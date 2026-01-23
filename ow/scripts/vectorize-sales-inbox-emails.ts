/**
 * Vectorize Sales Inbox Email Messages
 * These are actual customer conversations (unlike GmailMessage which is mostly personal/admin)
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.substring(0, 8000),
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function vectorizeSalesInboxEmails() {
  console.log('🚀 Vectorizing Sales Inbox Email Messages');
  console.log('==========================================\n');

  try {
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM "EmailMessage" WHERE embedding IS NULL`
    );
    const total = parseInt(countResult.rows[0].total);
    console.log(`Total email messages to vectorize: ${total}\n`);

    if (total === 0) {
      console.log('✅ All email messages already vectorized!');
      return;
    }

    // Get messages with thread context
    const result = await pool.query(
      `SELECT 
        em.id,
        em.sender,
        em.body,
        em."sentAt",
        et.subject,
        p.name as person_name,
        o.name as org_name
       FROM "EmailMessage" em
       JOIN "EmailThread" et ON em."threadId" = et.id
       LEFT JOIN "Person" p ON et."personId" = p.id
       LEFT JOIN "Organization" o ON p."organizationId" = o.id
       WHERE em.embedding IS NULL
       ORDER BY em."sentAt" DESC
       LIMIT 500`
    );

    console.log(`Processing ${result.rows.length} email messages...\n`);

    let processed = 0;
    let errors = 0;

    for (const email of result.rows) {
      try {
        // Create rich text for embedding
        const context = `Subject: ${email.subject || 'No subject'}
From: ${email.sender}
${email.person_name ? `Contact: ${email.person_name}` : ''}
${email.org_name ? `Company: ${email.org_name}` : ''}
Date: ${new Date(email.sentAt).toLocaleDateString()}

${email.body}`;

        const embedding = await generateEmbedding(context);

        await pool.query(
          `UPDATE "EmailMessage"
           SET embedding = $1, vectorized = true
           WHERE id = $2`,
          [`[${embedding.join(',')}]`, email.id]
        );

        processed++;
        if (processed % 25 === 0) {
          console.log(`  ✅ Progress: ${processed}/${result.rows.length} (${((processed/result.rows.length)*100).toFixed(1)}%)`);
        }

        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        errors++;
        console.error(`  ❌ Error processing email ${email.id}:`, error);
      }
    }

    console.log(`\n✅ Complete: ${processed} vectorized, ${errors} errors`);

    // Show final status
    const finalResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(embedding) as has_embedding,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as marked_vectorized
       FROM "EmailMessage"`
    );

    console.log('\n📈 Final Status:');
    console.log(`Total email messages: ${finalResult.rows[0].total}`);
    console.log(`With embeddings: ${finalResult.rows[0].has_embedding}`);
    console.log(`Marked vectorized: ${finalResult.rows[0].marked_vectorized}`);

    console.log('\n✅ Sales Inbox emails now searchable!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

vectorizeSalesInboxEmails();
