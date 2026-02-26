import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/html',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text types
  if (mimeType.startsWith('text/') || mimeType === 'application/msword') {
    return buffer.toString('utf-8');
  }

  // Excel - extract as CSV-like text
  if (mimeType.includes('spreadsheet')) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer);
    const sheets: string[] = [];
    for (const name of workbook.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      sheets.push(`--- Sheet: ${name} ---\n${csv}`);
    }
    return sheets.join('\n\n');
  }

  return buffer.toString('utf-8');
}

function chunkText(text: string, chunkSize = 500, overlap = 50): { text: string; index: number; wordCount: number }[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= chunkSize) {
    return [{ text: words.join(' '), index: 0, wordCount: words.length }];
  }

  const chunks: { text: string; index: number; wordCount: number }[] = [];
  let start = 0;
  let index = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push({
      text: chunkWords.join(' '),
      index,
      wordCount: chunkWords.length,
    });
    start += chunkSize - overlap;
    index++;
  }

  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-large',
    input: text.slice(0, 8000),
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const comment = (formData.get('comment') as string) || '';
    const category = (formData.get('category') as string) || 'Other';
    const name = (formData.get('name') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: `File type not supported: ${file.type}. Supported: PDF, DOCX, TXT, CSV, MD, HTML, XLSX` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileData = buffer.toString('base64');

    // Extract text
    let content = '';
    try {
      content = await extractText(buffer, file.type);
    } catch (err) {
      console.error('Text extraction error:', err);
      content = '';
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from this file. The file may be empty or in an unsupported format.' },
        { status: 400 }
      );
    }

    // Create the document record
    const doc = await prisma.knowledgeDocument.create({
      data: {
        name: name || file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData,
        content,
        comment: comment || null,
        category,
        uploadedBy: session.userId,
      },
    });

    // Chunk the text
    const chunks = chunkText(content);

    // Generate embeddings and store chunks
    let chunksCreated = 0;
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.text);

        await prisma.$executeRawUnsafe(
          `INSERT INTO "KnowledgeChunk" ("id", "documentId", "chunkIndex", "chunkText", "wordCount", "embedding", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())`,
          `kc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          doc.id,
          chunk.index,
          chunk.text,
          chunk.wordCount,
          `[${embedding.join(',')}]`,
        );
        chunksCreated++;
      } catch (err) {
        console.error(`Error creating chunk ${chunk.index}:`, err);
      }

      await new Promise(r => setTimeout(r, 50));
    }

    // Mark as vectorized
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { vectorized: chunksCreated > 0 },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        category: doc.category,
        fileSize: doc.fileSize,
        chunksCreated,
        totalWords: content.split(/\s+/).length,
        vectorized: chunksCreated > 0,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: String(error) },
      { status: 500 }
    );
  }
}
