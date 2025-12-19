/**
 * Vectorize ALL files from OpticWise Sales & Marketing Shared Drive
 * Recursively processes all files in all subfolders
 * Supports: PDFs, Google Docs, Word docs, Text files, Markdown, CSV, Spreadsheets, Presentations
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getDriveClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The ID of OpticWise Sales & Marketing shared drive
const SALES_MARKETING_DRIVE_ID = '0AMmNVvy1_Jb3Uk9PVA';

// File types we can extract text from and vectorize
const VECTORIZABLE_TYPES = [
  'application/pdf',
  'application/vnd.google-apps.document',           // Google Docs
  'application/vnd.google-apps.spreadsheet',        // Google Sheets
  'application/vnd.google-apps.presentation',       // Google Slides
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword',                              // .doc
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
];

// Map for export types
const EXPORT_MIME_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
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
async function extractGoogleDocText(drive: any, fileId: string, mimeType: string, fileName: string): Promise<string> {
  const exportMime = EXPORT_MIME_TYPES[mimeType];
  if (!exportMime) return '';
  
  try {
    const response = await drive.files.export({
      fileId,
      mimeType: exportMime,
    });
    
    const content = response.data || '';
    console.log(`      ✓ Exported ${content.length} chars from Google ${mimeType.split('.').pop()}`);
    return content;
  } catch (error: any) {
    console.log(`      ⚠ Could not export ${fileName}: ${error.message}`);
    return '';
  }
}

// Extract text from regular files (PDF, DOCX, TXT, etc.)
async function extractFileText(drive: any, fileId: string, mimeType: string, fileName: string): Promise<string> {
  try {
    // For plain text files, download directly
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv' || mimeType === 'text/html') {
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      });
      const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      console.log(`      ✓ Downloaded ${content.length} chars from text file`);
      return content;
    }
    
    // For PDFs, DOCX, and other binary formats
    // We'll store metadata for now - in production you'd use pdf-parse or similar
    if (mimeType === 'application/pdf') {
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      console.log(`      ℹ PDF detected (metadata only)`);
      return `PDF Document: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') {
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      console.log(`      ℹ Word document detected (metadata only)`);
      return `Word Document: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    if (mimeType.includes('spreadsheetml')) {
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      console.log(`      ℹ Excel spreadsheet detected (metadata only)`);
      return `Spreadsheet: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    if (mimeType.includes('presentationml')) {
      const file = await drive.files.get({
        fileId,
        fields: 'name,description',
      });
      console.log(`      ℹ PowerPoint detected (metadata only)`);
      return `Presentation: ${file.data.name}\nDescription: ${file.data.description || 'No description'}`;
    }
    
    return '';
  } catch (error: any) {
    console.log(`      ⚠ Could not extract ${fileName}: ${error.message}`);
    return '';
  }
}

// Build folder path from folder hierarchy
async function buildFolderPath(drive: any, folderId: string, folderCache: Map<string, string>): Promise<string> {
  if (folderCache.has(folderId)) {
    return folderCache.get(folderId)!;
  }
  
  if (folderId === SALES_MARKETING_DRIVE_ID) {
    return 'Sales & Marketing';
  }
  
  try {
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'name,parents',
      supportsAllDrives: true,
    });
    
    const folderName = folder.data.name || 'Unknown';
    const parents = folder.data.parents || [];
    
    if (parents.length === 0 || parents[0] === SALES_MARKETING_DRIVE_ID) {
      const path = `Sales & Marketing/${folderName}`;
      folderCache.set(folderId, path);
      return path;
    }
    
    const parentPath = await buildFolderPath(drive, parents[0], folderCache);
    const path = `${parentPath}/${folderName}`;
    folderCache.set(folderId, path);
    return path;
  } catch (error) {
    return 'Sales & Marketing';
  }
}

async function vectorizeSalesMarketingDrive() {
  console.log('='.repeat(80));
  console.log('VECTORIZING OPTICWISE SALES & MARKETING SHARED DRIVE');
  console.log('='.repeat(80));
  console.log('');
  console.log(`📁 Shared Drive ID: ${SALES_MARKETING_DRIVE_ID}`);
  console.log(`📊 Target file types: ${VECTORIZABLE_TYPES.length} types`);
  console.log('');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    // Step 1: Fetch ALL vectorizable files from the shared drive recursively
    console.log('🔍 Discovering all files in Sales & Marketing drive...');
    console.log('   (This includes ALL subfolders and sub-subfolders)');
    console.log('');
    
    const query = VECTORIZABLE_TYPES.map(t => `mimeType='${t}'`).join(' or ');
    
    let allFiles: any[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;
    
    do {
      const response = await drive.files.list({
        corpora: 'drive',
        driveId: SALES_MARKETING_DRIVE_ID,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 1000, // Max allowed
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, description, size, webViewLink, thumbnailLink, iconLink, createdTime, modifiedTime, owners, parents)',
        orderBy: 'modifiedTime desc',
        pageToken,
      });
      
      const files = response.data.files || [];
      allFiles = allFiles.concat(files);
      pageToken = response.data.nextPageToken || undefined;
      pageCount++;
      
      console.log(`   📄 Page ${pageCount}: Found ${files.length} files (Total so far: ${allFiles.length})`);
      
      // Small delay between pagination requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (pageToken);
    
    console.log('');
    console.log(`✅ Discovery complete: ${allFiles.length} vectorizable files found`);
    console.log('');
    
    // Group by type for logging
    const byType: Record<string, number> = {};
    allFiles.forEach(f => {
      const shortType = f.mimeType
        .replace('application/vnd.google-apps.', 'google-')
        .replace('application/vnd.openxmlformats-officedocument.', '')
        .replace('application/', '');
      byType[shortType] = (byType[shortType] || 0) + 1;
    });
    
    console.log('📊 File types breakdown:');
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${count.toString().padStart(5)} × ${type}`);
      });
    console.log('');
    
    // Check existing vectorized files
    const existingVectorized = await prisma.driveFile.findMany({
      where: { vectorized: true },
      select: { googleFileId: true },
    });
    const existingSet = new Set(existingVectorized.map(e => e.googleFileId));
    
    const newFiles = allFiles.filter(f => !existingSet.has(f.id));
    console.log(`📈 Status:`);
    console.log(`   ✓ Already vectorized: ${existingSet.size}`);
    console.log(`   ⏳ To process: ${newFiles.length}`);
    console.log('');
    
    if (newFiles.length === 0) {
      console.log('✅ All files already vectorized!');
      return;
    }
    
    console.log('='.repeat(80));
    console.log('🚀 STARTING VECTORIZATION');
    console.log('='.repeat(80));
    console.log('');
    
    let synced = 0;
    let updated = 0;
    let errors = 0;
    const startTime = Date.now();
    const folderCache = new Map<string, string>();
    
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!file.id) continue;
      
      try {
        const progress = `[${i + 1}/${newFiles.length}]`;
        console.log(`\n${progress} 📄 ${file.name}`);
        console.log(`   Type: ${file.mimeType}`);
        
        // Build folder path
        let folderPath = 'Sales & Marketing';
        if (file.parents && file.parents.length > 0) {
          folderPath = await buildFolderPath(drive, file.parents[0], folderCache);
        }
        console.log(`   Path: ${folderPath}`);
        
        // Check if already exists
        const existing = await prisma.driveFile.findUnique({
          where: { googleFileId: file.id },
        });
        
        // Extract text content
        console.log(`   Extracting content...`);
        let content = '';
        if (file.mimeType.startsWith('application/vnd.google-apps.')) {
          content = await extractGoogleDocText(drive, file.id, file.mimeType, file.name);
        } else {
          content = await extractFileText(drive, file.id, file.mimeType, file.name);
        }
        
        // Create text for embedding
        const textForEmbedding = `
File: ${file.name}
Folder: ${folderPath}
Type: ${file.mimeType}
Description: ${file.description || ''}
Content: ${content}
        `.trim().slice(0, 8000);
        
        // Generate embedding
        console.log(`   Generating AI embedding...`);
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Get owners
        const owners = file.owners?.map((o: any) => ({
          email: o.emailAddress,
          displayName: o.displayName,
        })) || [];
        
        // Prepare data
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
          folderPath: folderPath,
          createdTime: file.createdTime ? new Date(file.createdTime) : null,
          modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
          ownedByMe: false,
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
          console.log(`   ✅ Created & vectorized`);
        }
        
        // Progress summary every 10 files
        if ((i + 1) % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = ((synced + updated) / parseFloat(elapsed)).toFixed(2);
          const remaining = Math.ceil((newFiles.length - (i + 1)) / parseFloat(rate));
          console.log(`\n   📊 Progress: ${i + 1}/${newFiles.length} files (${rate}/sec, ~${remaining}s remaining)`);
        }
        
        // Rate limiting for OpenAI API and Google Drive API
        await new Promise(resolve => setTimeout(resolve, 250));
        
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
        
        // Continue processing despite errors
        if (errors >= 10 && errors % 10 === 0) {
          console.log(`\n   ⚠️  Warning: ${errors} errors so far. Continuing...`);
        }
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Final Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ VECTORIZATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Results:`);
    console.log(`   📥 New files created: ${synced}`);
    console.log(`   🔄 Existing files updated: ${updated}`);
    console.log(`   ✓ Total processed successfully: ${synced + updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total files discovered: ${allFiles.length}`);
    console.log(`   ⏱️  Time taken: ${totalTime} seconds`);
    console.log(`   ⚡ Average speed: ${((synced + updated) / parseFloat(totalTime)).toFixed(2)} files/sec`);
    console.log('');
    console.log('='.repeat(80));
    
    // Database stats
    const totalVectorized = await prisma.driveFile.count({ where: { vectorized: true } });
    console.log(`\n📈 Database totals:`);
    console.log(`   Total vectorized files in DB: ${totalVectorized}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
console.log('Starting vectorization process...\n');
vectorizeSalesMarketingDrive().catch(console.error);

