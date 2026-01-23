/**
 * Master Vectorization Script
 * Re-vectorizes all data after vector column type conversion
 * Handles: GmailMessage, DriveFile, WebPage, StyleGuide
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.substring(0, 8000), // Limit to avoid token limits
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function vectorizeGmailMessages() {
  console.log('\n📧 Vectorizing Gmail Messages...');
  
  const result = await pool.query(
    `SELECT id, subject, body, snippet 
     FROM "GmailMessage" 
     WHERE embedding IS NULL 
     ORDER BY date DESC 
     LIMIT 1000`
  );
  
  console.log(`Found ${result.rows.length} emails to vectorize`);
  
  let processed = 0;
  let errors = 0;
  
  for (const email of result.rows) {
    try {
      const text = `${email.subject || ''}\n\n${email.body || email.snippet || ''}`;
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE "GmailMessage" 
         SET embedding = $1, vectorized = true 
         WHERE id = $2`,
        [`[${embedding.join(',')}]`, email.id]
      );
      
      processed++;
      if (processed % 50 === 0) {
        console.log(`  ✅ Processed ${processed}/${result.rows.length} emails`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      console.error(`  ❌ Error processing email ${email.id}:`, error);
    }
  }
  
  console.log(`✅ Gmail: ${processed} vectorized, ${errors} errors`);
  return { processed, errors };
}

async function vectorizeDriveFiles() {
  console.log('\n📁 Vectorizing Drive Files...');
  
  const result = await pool.query(
    `SELECT id, name, content, description 
     FROM "DriveFile" 
     WHERE embedding IS NULL 
     AND (content IS NOT NULL OR description IS NOT NULL)
     ORDER BY "modifiedTime" DESC 
     LIMIT 500`
  );
  
  console.log(`Found ${result.rows.length} drive files to vectorize`);
  
  let processed = 0;
  let errors = 0;
  
  for (const file of result.rows) {
    try {
      const text = `${file.name}\n\n${file.description || ''}\n\n${file.content || ''}`;
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE "DriveFile" 
         SET embedding = $1, vectorized = true 
         WHERE id = $2`,
        [`[${embedding.join(',')}]`, file.id]
      );
      
      processed++;
      if (processed % 25 === 0) {
        console.log(`  ✅ Processed ${processed}/${result.rows.length} files`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      console.error(`  ❌ Error processing file ${file.id}:`, error);
    }
  }
  
  console.log(`✅ Drive Files: ${processed} vectorized, ${errors} errors`);
  return { processed, errors };
}

async function vectorizeWebPages() {
  console.log('\n🌐 Vectorizing Web Pages...');
  
  const result = await pool.query(
    `SELECT id, url, title, content 
     FROM "WebPage" 
     WHERE embedding IS NULL 
     AND content IS NOT NULL`
  );
  
  console.log(`Found ${result.rows.length} web pages to vectorize`);
  
  let processed = 0;
  let errors = 0;
  
  for (const page of result.rows) {
    try {
      const text = `${page.title || ''}\n\n${page.content || ''}`;
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE "WebPage" 
         SET embedding = $1, vectorized = true 
         WHERE id = $2`,
        [`[${embedding.join(',')}]`, page.id]
      );
      
      processed++;
      console.log(`  ✅ Processed ${processed}/${result.rows.length}: ${page.url}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      console.error(`  ❌ Error processing page ${page.id}:`, error);
    }
  }
  
  console.log(`✅ Web Pages: ${processed} vectorized, ${errors} errors`);
  return { processed, errors };
}

async function vectorizeStyleGuide() {
  console.log('\n🎨 Vectorizing Style Guide...');
  
  const result = await pool.query(
    `SELECT id, category, subcategory, content, tone, author 
     FROM "StyleGuide" 
     WHERE embedding IS NULL`
  );
  
  console.log(`Found ${result.rows.length} style guide entries to vectorize`);
  
  let processed = 0;
  let errors = 0;
  
  for (const entry of result.rows) {
    try {
      const text = `${entry.category} - ${entry.subcategory || ''}\n${entry.tone || ''}\n\n${entry.content}`;
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE "StyleGuide" 
         SET embedding = $1, vectorized = true 
         WHERE id = $2`,
        [`[${embedding.join(',')}]`, entry.id]
      );
      
      processed++;
      console.log(`  ✅ Processed ${processed}/${result.rows.length}: ${entry.category}/${entry.subcategory}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      console.error(`  ❌ Error processing style guide ${entry.id}:`, error);
    }
  }
  
  console.log(`✅ Style Guide: ${processed} vectorized, ${errors} errors`);
  return { processed, errors };
}

async function main() {
  console.log('🚀 Starting Master Vectorization Process');
  console.log('==========================================\n');
  
  try {
    // First, reset vectorized flags for items with no embeddings
    console.log('🔄 Resetting vectorized flags for items with missing embeddings...');
    await pool.query(`UPDATE "GmailMessage" SET vectorized = false WHERE embedding IS NULL`);
    await pool.query(`UPDATE "DriveFile" SET vectorized = false WHERE embedding IS NULL`);
    await pool.query(`UPDATE "WebPage" SET vectorized = false WHERE embedding IS NULL`);
    await pool.query(`UPDATE "StyleGuide" SET vectorized = false WHERE embedding IS NULL`);
    console.log('✅ Flags reset\n');
    
    const results = {
      gmail: await vectorizeGmailMessages(),
      drive: await vectorizeDriveFiles(),
      webPages: await vectorizeWebPages(),
      styleGuide: await vectorizeStyleGuide(),
    };
    
    console.log('\n\n📊 VECTORIZATION SUMMARY');
    console.log('========================');
    console.log(`Gmail Messages:  ${results.gmail.processed} vectorized, ${results.gmail.errors} errors`);
    console.log(`Drive Files:     ${results.drive.processed} vectorized, ${results.drive.errors} errors`);
    console.log(`Web Pages:       ${results.webPages.processed} vectorized, ${results.webPages.errors} errors`);
    console.log(`Style Guide:     ${results.styleGuide.processed} vectorized, ${results.styleGuide.errors} errors`);
    console.log('\n✅ Vectorization complete!');
    
    const totalProcessed = results.gmail.processed + results.drive.processed + 
                          results.webPages.processed + results.styleGuide.processed;
    const totalErrors = results.gmail.errors + results.drive.errors + 
                       results.webPages.errors + results.styleGuide.errors;
    
    console.log(`\nTotal: ${totalProcessed} items vectorized, ${totalErrors} errors`);
    
    // Show final counts
    console.log('\n📈 Final Status:');
    const finalStatus = await pool.query(`
      SELECT 
        'GmailMessage' as table_name,
        COUNT(*) as total,
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized
      FROM "GmailMessage"
      UNION ALL
      SELECT 
        'DriveFile' as table_name,
        COUNT(*) as total,
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized
      FROM "DriveFile"
      UNION ALL
      SELECT 
        'WebPage' as table_name,
        COUNT(*) as total,
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized
      FROM "WebPage"
      UNION ALL
      SELECT 
        'StyleGuide' as table_name,
        COUNT(*) as total,
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized
      FROM "StyleGuide"
      ORDER BY table_name
    `);
    
    console.table(finalStatus.rows);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();
