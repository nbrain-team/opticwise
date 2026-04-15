/**
 * OpticWise Customer Service Agent — Data Ingestion Pipeline
 * 
 * Parses support emails from mbox file and call transcripts,
 * chunks the content, generates embeddings via OpenAI, and
 * upserts vectors into a dedicated Pinecone namespace.
 * 
 * Usage:
 *   npx tsx scripts/ingest-support-data.ts
 * 
 * Environment variables required:
 *   OPENAI_API_KEY, PINECONE_API_KEY, DATABASE_URL
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts';
const PINECONE_NAMESPACE = 'support-agent';
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMS = 1024;
const CHUNK_SIZE = 400; // words per chunk
const CHUNK_OVERLAP = 60;
const BATCH_SIZE = 50; // vectors per Pinecone upsert batch

interface EmailRecord {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  threadId?: string;
}

interface TranscriptRecord {
  callId: string;
  date: string | null;
  duration: number;
  transcript: string;
}

interface ChunkRecord {
  id: string;
  text: string;
  metadata: Record<string, string | number | boolean>;
}

// ─── Mbox Parsing ─────────────────────────────────────────────

function parseMbox(filePath: string): EmailRecord[] {
  console.log(`[Ingest] Reading mbox file: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const emails: EmailRecord[] = [];
  
  const messages = raw.split(/^From /m).filter(m => m.trim().length > 0);
  console.log(`[Ingest] Found ${messages.length} raw messages in mbox`);

  let skippedNoFrom = 0;
  let skippedShort = 0;
  let skippedSpam = 0;

  for (const msg of messages) {
    try {
      // Strip \r from all lines — Google Takeout mbox uses \r\n line endings
      // which breaks regex anchors like $
      const lines = msg.split('\n').map(l => l.replace(/\r$/, ''));

      // Google Takeout mbox has very long header chains (80+ lines of
      // Received/ARC/DKIM before the actual From/To/Subject).
      // Scan ALL lines until we hit a MIME boundary or Content body to
      // extract every header, ignoring blank lines between header blocks.
      const headers: Record<string, string> = {};
      let lastHeaderKey = '';
      let bodyStart = lines.length;

      for (let i = 0; i < Math.min(lines.length, 200); i++) {
        const line = lines[i];

        // Continuation of previous header
        if ((line.startsWith(' ') || line.startsWith('\t')) && lastHeaderKey) {
          headers[lastHeaderKey] += ' ' + line.trim();
          continue;
        }

        // Standard header line
        const match = line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/);
        if (match) {
          const key = match[1].toLowerCase();
          if (!headers[key]) {
            headers[key] = match[2].trim();
          }
          lastHeaderKey = key;
          continue;
        }

        // Blank line — could be between header groups or start of body.
        // If we already found From:, the next blank after Subject/Content-Type
        // is the real body start.
        if (line.trim() === '' && headers['from'] && headers['content-type']) {
          bodyStart = i + 1;
          break;
        }

        // Also break if line looks like MIME content (body started)
        if (line.startsWith('--') && headers['from']) {
          bodyStart = i;
          break;
        }
      }

      const from = headers['from'] || '';
      const to = headers['to'] || headers['delivered-to'] || '';
      const subject = headers['subject'] || '';
      const date = headers['date'] || '';

      if (!from) { skippedNoFrom++; continue; }

      const body = lines.slice(bodyStart).join('\n').trim();
      const cleanBody = cleanEmailBody(body);
      
      if (!cleanBody || cleanBody.length < 30) { skippedShort++; continue; }

      if (isSpamOrAutomated(from, subject, cleanBody)) { skippedSpam++; continue; }

      emails.push({
        messageId: headers['message-id'] || `msg-${emails.length}`,
        from,
        to,
        subject: decodeSubject(subject),
        date,
        body: cleanBody.slice(0, 5000),
        threadId: headers['in-reply-to'] || undefined,
      });
    } catch {
      // Skip malformed messages
    }
  }

  console.log(`[Ingest] Parsed ${emails.length} valid support emails`);
  console.log(`[Ingest] Skipped: ${skippedNoFrom} no-from, ${skippedShort} too-short, ${skippedSpam} spam/automated`);
  return emails;
}

function cleanEmailBody(body: string): string {
  let text = body;
  
  // Decode quoted-printable
  text = text.replace(/=\r?\n/g, '');
  text = text.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Strip HTML tags
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Remove base64 encoded content
  text = text.replace(/[A-Za-z0-9+/=]{50,}/g, '');
  
  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

function decodeSubject(subject: string): string {
  return subject
    .replace(/=\?utf-8\?[QBqb]\?/gi, '')
    .replace(/\?=/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/_/g, ' ')
    .trim();
}

function isSpamOrAutomated(from: string, subject: string, _body: string): boolean {
  const lower = `${from} ${subject}`.toLowerCase();
  
  // Hard-skip automated system messages
  const hardSkip = [
    'mailer-daemon', 'postmaster', 'noreply@google',
    'no-reply@google', 'calendar-notification',
  ];
  if (hardSkip.some(s => lower.includes(s))) return true;

  // Skip known spam senders from the mbox
  const spamSenders = [
    'anu.nic.web5656', 'price list', 'error price',
  ];
  if (spamSenders.some(s => lower.includes(s))) return true;

  return false;
}

// ─── Transcript Parsing ───────────────────────────────────────

function loadTranscripts(dir: string): TranscriptRecord[] {
  const transcripts: TranscriptRecord[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  
  console.log(`[Ingest] Loading ${files.length} transcript files from ${dir}`);

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      if (!data.transcript || data.transcript.length < 30) continue;

      transcripts.push({
        callId: data.call_id || path.basename(file, '.json'),
        date: data.call_date || null,
        duration: data.duration_seconds || 0,
        transcript: data.transcript,
      });
    } catch {
      // Skip malformed files
    }
  }

  console.log(`[Ingest] Loaded ${transcripts.length} valid transcripts`);
  return transcripts;
}

// ─── Chunking ─────────────────────────────────────────────────

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  if (words.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end >= words.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

function createEmailChunks(emails: EmailRecord[]): ChunkRecord[] {
  const chunks: ChunkRecord[] = [];

  // Group emails by thread (subject similarity)
  const threadMap = new Map<string, EmailRecord[]>();
  for (const email of emails) {
    const normalizedSubject = email.subject
      .replace(/^(re|fwd|fw):\s*/gi, '')
      .toLowerCase()
      .trim();
    const key = normalizedSubject || email.messageId;
    if (!threadMap.has(key)) threadMap.set(key, []);
    threadMap.get(key)!.push(email);
  }

  console.log(`[Ingest] Grouped emails into ${threadMap.size} threads`);

  for (const [threadKey, threadEmails] of threadMap) {
    // Sort by date within thread
    threadEmails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Combine thread into a single document for better context
    const threadText = threadEmails.map(e => {
      const dateStr = e.date ? new Date(e.date).toLocaleDateString() : 'unknown date';
      return `[${dateStr}] From: ${e.from}\nTo: ${e.to}\nSubject: ${e.subject}\n\n${e.body}`;
    }).join('\n\n---\n\n');

    const textChunks = chunkText(threadText, CHUNK_SIZE, CHUNK_OVERLAP);

    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
        id: `email-${threadKey.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${i}`,
        text: textChunks[i],
        metadata: {
          source: 'email',
          subject: threadEmails[0].subject.slice(0, 200),
          from: threadEmails[0].from.slice(0, 100),
          date: threadEmails[0].date || '',
          thread_size: threadEmails.length,
          chunk_index: i,
          total_chunks: textChunks.length,
          text_chunk: textChunks[i].slice(0, 2000),
        },
      });
    }
  }

  return chunks;
}

function createTranscriptChunks(transcripts: TranscriptRecord[]): ChunkRecord[] {
  const chunks: ChunkRecord[] = [];

  for (const t of transcripts) {
    const textChunks = chunkText(t.transcript, CHUNK_SIZE, CHUNK_OVERLAP);

    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
        id: `call-${t.callId.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}-${i}`,
        text: textChunks[i],
        metadata: {
          source: 'call_transcript',
          call_id: t.callId,
          date: t.date || '',
          duration_seconds: t.duration,
          chunk_index: i,
          total_chunks: textChunks.length,
          text_chunk: textChunks[i].slice(0, 2000),
        },
      });
    }
  }

  return chunks;
}

// ─── Embedding + Upsert ──────────────────────────────────────

async function generateEmbeddings(
  openai: OpenAI,
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMS,
  });
  return response.data.map(d => d.embedding);
}

async function upsertToPinecone(
  index: ReturnType<Pinecone['index']>,
  chunks: ChunkRecord[],
  openai: OpenAI
): Promise<void> {
  console.log(`[Ingest] Upserting ${chunks.length} chunks to Pinecone namespace "${PINECONE_NAMESPACE}"`);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.text);

    try {
      const embeddings = await generateEmbeddings(openai, texts);

      const vectors = batch.map((chunk, j) => ({
        id: chunk.id,
        values: embeddings[j],
        metadata: chunk.metadata,
      }));

      await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
      
      const progress = Math.round(((i + batch.length) / chunks.length) * 100);
      console.log(`[Ingest] Progress: ${progress}% (${i + batch.length}/${chunks.length})`);
    } catch (error) {
      console.error(`[Ingest] Batch error at offset ${i}:`, error);
      // Retry once after a pause
      await new Promise(r => setTimeout(r, 5000));
      try {
        const embeddings = await generateEmbeddings(openai, texts);
        const vectors = batch.map((chunk, j) => ({
          id: chunk.id,
          values: embeddings[j],
          metadata: chunk.metadata,
        }));
        await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
      } catch (retryError) {
        console.error(`[Ingest] Retry failed at offset ${i}, skipping batch:`, retryError);
      }
    }

    // Rate limit buffer
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// ─── Database Tracking ────────────────────────────────────────

async function saveIngestionStats(
  pool: Pool,
  emailCount: number,
  transcriptCount: number,
  totalChunks: number
): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SupportIngestionLog" (
        id SERIAL PRIMARY KEY,
        "emailCount" INT NOT NULL,
        "transcriptCount" INT NOT NULL,
        "totalChunks" INT NOT NULL,
        "pineconeNamespace" TEXT NOT NULL,
        "ingestedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(
      `INSERT INTO "SupportIngestionLog" ("emailCount", "transcriptCount", "totalChunks", "pineconeNamespace")
       VALUES ($1, $2, $3, $4)`,
      [emailCount, transcriptCount, totalChunks, PINECONE_NAMESPACE]
    );
  } catch (error) {
    console.error('[Ingest] Error saving stats:', error);
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  OpticWise CS Agent — Data Ingestion Pipeline');
  console.log('═══════════════════════════════════════════════\n');

  // Validate env
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
  if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY required');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.index(PINECONE_INDEX);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // 1. Parse emails
  const mboxPath = '/Users/dannydemichele/Downloads/OWnet Tier 1 autonomous agent project/takeout-OW support emails history/Mail/All OW support email Including Spam and Trash.mbox';
  const emails = parseMbox(mboxPath);

  // 2. Parse transcripts
  const transcriptDir = '/Users/dannydemichele/Downloads/opticwise-cs-agent-transcripts/transcripts';
  const transcripts = loadTranscripts(transcriptDir);

  // 3. Create chunks
  const emailChunks = createEmailChunks(emails);
  const transcriptChunks = createTranscriptChunks(transcripts);
  const allChunks = [...emailChunks, ...transcriptChunks];

  console.log(`\n[Ingest] Summary:`);
  console.log(`  Emails parsed:     ${emails.length}`);
  console.log(`  Transcripts parsed: ${transcripts.length}`);
  console.log(`  Email chunks:      ${emailChunks.length}`);
  console.log(`  Transcript chunks: ${transcriptChunks.length}`);
  console.log(`  Total chunks:      ${allChunks.length}\n`);

  // 4. Vectorize + upsert
  await upsertToPinecone(index, allChunks, openai);

  // 5. Save stats
  await saveIngestionStats(pool, emails.length, transcripts.length, allChunks.length);

  console.log('\n[Ingest] Done! All support data vectorized.');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('[Ingest] Fatal error:', err);
  process.exit(1);
});
