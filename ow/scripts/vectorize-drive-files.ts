/**
 * Vectorize Google Drive files (PDFs, Docs, Word, Text, Markdown, CSV)
 * This script syncs files from Drive and generates embeddings for AI search
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getDriveClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// File types we can extract text from and vectorize
const VECTORIZABLE_TYPES = [
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
];

// Map for export types
const EXPORT_MIME_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
};

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.slice(0, 8000), // OpenAI limit
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

// Extract text from Google native formats
async function extractGoogleDocText(drive: any, fileId: string, mimeType: string): Promise<string> {
  const exportMime = EXPORT_MIME_TYPES[mimeType];
  if (!exportMime) return '';
  
  try {
    const response = await drive.files.export({
      fileId,
      mimeType: exportMime,
    });
    return response.data || '';
  } catch (error: any) {
    console.log(`  Could not export ${fileId}: ${error.message}`);
    return '';
  }
}

// Extract text from regular files (PDF, DOCX, TXT)
async function extractFileText(drive: any, fileId: string, mimeType: string): Promise<string> {
  try {
    // For plain text files, download directly
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      });
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }
    
    // For PDFs and DOCX, Google Drive can sometimes convert to text
    // But we need to handle this differently - for now, we'll store basic metadata
    // In production, you'd want to use a PDF parsing library or OCR
    if (mimeType === 'application/pdf') {
      // Get file metadata for basic info
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      return `PDF Document: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Similar approach for DOCX
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      return `Word Document: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    return '';
  } catch (error: any) {
    console.log(`  Could not extract ${fileId}: ${error.message}`);
    return '';
  }
}

async function syncAndVectorizeFiles() {
  console.log('='.repeat(60));
  console.log('DRIVE FILE VECTORIZATION');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    // Step 1: Fetch all vectorizable files from Drive
    console.log('📥 Fetching files from Google Drive...');
    
    const query = VECTORIZABLE_TYPES.map(t => `mimeType='${t}'`).join(' or ');
    
    let allFiles: any[] = [];
    let pageToken: string | undefined;
    
    do {
      const response: any = await drive.files.list({
        q: query,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, description, size, webViewLink, thumbnailLink, iconLink, createdTime, modifiedTime, ownedByMe, owners, parents)',
        orderBy: 'modifiedTime desc',
        pageToken,
      });
      
      allFiles = allFiles.concat(response.data.files || []);
      pageToken = response.data.nextPageToken;
      
      console.log(`  Fetched ${allFiles.length} files so far...`);
    } while (pageToken);
    
    console.log(`\n✅ Found ${allFiles.length} vectorizable files\n`);
    
    // Group by type for logging
    const byType: Record<string, number> = {};
    allFiles.forEach(f => {
      byType[f.mimeType] = (byType[f.mimeType] || 0) + 1;
    });
    
    console.log('File types:');
    Object.entries(byType).forEach(([type, count]) => {
      const shortType = type.replace('application/vnd.google-apps.', 'google-').replace('application/', '');
      console.log(`  ${count.toString().padStart(4)} × ${shortType}`);
    });
    console.log('');
    
    // Step 2: Process each file
    let synced = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const file of allFiles) {
      if (!file.id) continue;
      
      try {
        // Check if already in database
        const existing = await prisma.driveFile.findUnique({
          where: { googleFileId: file.id },
        });
        
        // Skip if already vectorized
        if (existing?.vectorized && existing.embedding) {
          skipped++;
          continue;
        }
        
        console.log(`\n📄 Processing: ${file.name}`);
        console.log(`   Type: ${file.mimeType}`);
        
        // Extract text content
        let content = '';
        if (file.mimeType.startsWith('application/vnd.google-apps.')) {
          content = await extractGoogleDocText(drive, file.id, file.mimeType);
        } else {
          content = await extractFileText(drive, file.id, file.mimeType);
        }
        
        console.log(`   Content: ${content.length} characters extracted`);
        
        // Create text for embedding
        const textForEmbedding = `
File: ${file.name}
Type: ${file.mimeType}
Description: ${file.description || ''}
Content: ${content}
        `.trim();
        
        // Generate embedding
        console.log(`   Generating embedding...`);
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Get owners
        const owners = file.owners?.map((o: any) => ({
          email: o.emailAddress,
          displayName: o.displayName,
        })) || [];
        
        // Upsert to database
        const data = {
          googleFileId: file.id,
          name: file.name || 'Untitled',
          mimeType: file.mimeType || 'unknown',
          description: file.description || null,
          size: file.size ? BigInt(file.size) : null,
          webViewLink: file.webViewLink || null,
          thumbnailLink: file.thumbnailLink || null,
          iconLink: file.iconLink || null,
          content: content || null,
          createdTime: file.createdTime ? new Date(file.createdTime) : null,
          modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
          ownedByMe: file.ownedByMe || false,
          owners: owners,
          parents: file.parents || null,
          vectorized: true,
          embedding: `[${embedding.join(',')}]`,
        };
        
        if (existing) {
          await prisma.driveFile.update({
            where: { googleFileId: file.id },
            data,
          });
          updated++;
          console.log(`   ✅ Updated & vectorized`);
        } else {
          await prisma.driveFile.create({ data });
          synced++;
          console.log(`   ✅ Synced & vectorized`);
        }
        
        // Rate limiting for OpenAI API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`  📥 New files synced: ${synced}`);
    console.log(`  🔄 Files updated: ${updated}`);
    console.log(`  ⏭️  Already vectorized: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📁 Total processed: ${allFiles.length}`);
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
syncAndVectorizeFiles().catch(console.error);

