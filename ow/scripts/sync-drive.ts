/**
 * Sync Google Drive files
 * Extract text content, vectorize and store in PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getDriveClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

// Extract text from Google Docs
async function extractDocumentText(drive: any, fileId: string): Promise<string> {
  try {
    const response = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    return response.data || '';
  } catch (error) {
    console.log(`Could not extract text from ${fileId}:`, error);
    return '';
  }
}

async function syncDrive() {
  console.log('Starting Drive sync...');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    console.log('Fetching Drive files...');
    
    // Get all files (limit to reasonable number)
    const response = await drive.files.list({
      pageSize: 1000,
      fields: 'files(id, name, mimeType, description, size, webViewLink, thumbnailLink, iconLink, createdTime, modifiedTime, viewedByMeTime, ownedByMe, owners, parents)',
      orderBy: 'modifiedTime desc',
    });
    
    const files = response.data.files || [];
    console.log(`Found ${files.length} files to sync`);
    
    let synced = 0;
    let skipped = 0;
    
    // Supported document types for text extraction
    const extractableTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/pdf',
      'text/plain',
    ];
    
    for (const file of files) {
      if (!file.id) continue;
      
      // Check if already synced
      const existing = await prisma.driveFile.findUnique({
        where: { googleFileId: file.id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Extract text content for supported types
      let content = '';
      if (file.mimeType && extractableTypes.includes(file.mimeType)) {
        try {
          content = await extractDocumentText(drive, file.id);
          console.log(`Extracted ${content.length} chars from ${file.name}`);
        } catch (error) {
          console.log(`Could not extract content from ${file.name}`);
        }
      }
      
      // Generate embedding for vectorization
      const textForEmbedding = `
        Filename: ${file.name}
        Description: ${file.description || ''}
        Type: ${file.mimeType}
        Content: ${content}
      `.trim().slice(0, 8000);
      
      const embedding = await generateEmbedding(textForEmbedding);
      
      // Get owners
      const owners = file.owners?.map((o: any) => ({
        email: o.emailAddress,
        displayName: o.displayName,
      })) || [];
      
      // Save to database
      await prisma.driveFile.create({
        data: {
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
          viewedTime: file.viewedByMeTime ? new Date(file.viewedByMeTime) : null,
          ownedByMe: file.ownedByMe || false,
          owners: owners,
          parents: file.parents || null,
          vectorized: true,
          embedding: `[${embedding.join(',')}]`,
        },
      });
      
      synced++;
      
      if (synced % 10 === 0) {
        console.log(`Synced ${synced}/${files.length} files...`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nDrive sync complete:`);
    console.log(`- Synced: ${synced} new files`);
    console.log(`- Skipped: ${skipped} existing files`);
    console.log(`- Total: ${files.length} files processed`);
    
  } catch (error) {
    console.error('Error syncing Drive:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncDrive().catch(console.error);

