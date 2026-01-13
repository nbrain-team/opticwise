/**
 * Check access to Shared Drives and list their contents
 */

import { getServiceAccountClient, getDriveClient } from '../lib/google';

async function checkSharedDrives() {
  console.log('='.repeat(60));
  console.log('CHECKING SHARED DRIVES ACCESS');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    // List all shared drives
    console.log('📁 Listing Shared Drives...\n');
    const sharedDrives = await drive.drives.list({
      pageSize: 50,
    });
    
    const drives = sharedDrives.data.drives || [];
    console.log(`Found ${drives.length} shared drives:\n`);
    
    for (const d of drives) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📁 ${d.name}`);
      console.log(`   ID: ${d.id}`);
      console.log(`${'='.repeat(50)}`);
      
      // Try to list files in this shared drive
      try {
        const files = await drive.files.list({
          corpora: 'drive',
          driveId: d.id,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 100,
          fields: 'files(id, name, mimeType, modifiedTime)',
          orderBy: 'modifiedTime desc',
        });
        
        const fileList = files.data.files || [];
        console.log(`\n   📄 Files found: ${fileList.length}`);
        
        // Group by type
        const byType: Record<string, number> = {};
        fileList.forEach(f => {
          const type = f.mimeType?.replace('application/vnd.google-apps.', 'google-') || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        });
        
        console.log('\n   File types:');
        Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .forEach(([type, count]) => {
            console.log(`      ${count.toString().padStart(4)} × ${type}`);
          });
        
        // Show first 10 files
        console.log('\n   Recent files:');
        fileList.slice(0, 10).forEach((f, i) => {
          console.log(`      ${i + 1}. ${f.name}`);
        });
        
        if (fileList.length > 10) {
          console.log(`      ... and ${fileList.length - 10} more files`);
        }
        
      } catch (error: any) {
        console.log(`\n   ❌ Error accessing drive: ${error.message}`);
        if (error.code === 404) {
          console.log('      Drive not found or no access');
        }
      }
    }
    
    // Also check what's currently in our database for comparison
    console.log('\n\n' + '='.repeat(60));
    console.log('COMPARING WITH DATABASE');
    console.log('='.repeat(60));
    
    // Import prisma
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const dbCount = await prisma.driveFile.count();
    console.log(`\nTotal files in database: ${dbCount}`);
    
    // Check if any files from shared drives are in database
    // Shared drive files have different parent IDs
    const sampleFiles = await prisma.driveFile.findMany({
      take: 5,
      select: { name: true, parents: true },
    });
    
    console.log('\nSample files in DB (showing parents):');
    sampleFiles.forEach(f => {
      console.log(`  - ${f.name}`);
      console.log(`    Parents: ${JSON.stringify(f.parents)}`);
    });
    
    await prisma.$disconnect();
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run
checkSharedDrives().catch(console.error);




