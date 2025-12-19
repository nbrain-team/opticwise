/**
 * Check the current status of vectorized files in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  console.log('='.repeat(80));
  console.log('VECTORIZATION STATUS CHECK');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Total DriveFile records
    const totalFiles = await prisma.driveFile.count();
    console.log(`📁 Total DriveFile records in database: ${totalFiles}`);
    
    // Vectorized files
    const vectorizedFiles = await prisma.driveFile.count({
      where: { vectorized: true }
    });
    console.log(`✅ Vectorized files: ${vectorizedFiles}`);
    
    // Non-vectorized files
    const nonVectorized = await prisma.driveFile.count({
      where: { vectorized: false }
    });
    console.log(`⏳ Not yet vectorized: ${nonVectorized}`);
    
    console.log('');
    console.log('='.repeat(80));
    console.log('BREAKDOWN BY MIME TYPE');
    console.log('='.repeat(80));
    console.log('');
    
    // Group by mime type
    const filesByType = await prisma.driveFile.groupBy({
      by: ['mimeType', 'vectorized'],
      _count: true,
    });
    
    // Organize results
    const typeMap: Record<string, { vectorized: number; notVectorized: number }> = {};
    
    filesByType.forEach(item => {
      const shortType = item.mimeType
        .replace('application/vnd.google-apps.', 'google-')
        .replace('application/vnd.openxmlformats-officedocument.', '')
        .replace('application/', '');
      
      if (!typeMap[shortType]) {
        typeMap[shortType] = { vectorized: 0, notVectorized: 0 };
      }
      
      if (item.vectorized) {
        typeMap[shortType].vectorized = item._count;
      } else {
        typeMap[shortType].notVectorized = item._count;
      }
    });
    
    // Sort by total count
    const sorted = Object.entries(typeMap).sort((a, b) => {
      const totalA = a[1].vectorized + a[1].notVectorized;
      const totalB = b[1].vectorized + b[1].notVectorized;
      return totalB - totalA;
    });
    
    sorted.forEach(([type, counts]) => {
      const total = counts.vectorized + counts.notVectorized;
      const percentage = total > 0 ? ((counts.vectorized / total) * 100).toFixed(1) : '0';
      console.log(`${type.padEnd(40)} Total: ${total.toString().padStart(4)} | Vectorized: ${counts.vectorized.toString().padStart(4)} (${percentage}%)`);
    });
    
    console.log('');
    console.log('='.repeat(80));
    console.log('RECENT FILES (Last 10)');
    console.log('='.repeat(80));
    console.log('');
    
    const recentFiles = await prisma.driveFile.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        name: true,
        mimeType: true,
        vectorized: true,
        folderPath: true,
        updatedAt: true,
      }
    });
    
    recentFiles.forEach((file, i) => {
      const status = file.vectorized ? '✅' : '❌';
      const type = file.mimeType.split('.').pop()?.substring(0, 15) || 'unknown';
      console.log(`${i + 1}. ${status} ${file.name}`);
      console.log(`   Type: ${type} | Updated: ${file.updatedAt.toLocaleString()}`);
      if (file.folderPath) {
        console.log(`   Path: ${file.folderPath}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('FILES WITH FOLDER PATHS (Sales & Marketing specific)');
    console.log('='.repeat(80));
    console.log('');
    
    const salesMarketingFiles = await prisma.driveFile.count({
      where: {
        folderPath: {
          contains: 'Sales & Marketing'
        }
      }
    });
    
    console.log(`📂 Files in Sales & Marketing paths: ${salesMarketingFiles}`);
    
    if (salesMarketingFiles > 0) {
      const sampleSalesFiles = await prisma.driveFile.findMany({
        where: {
          folderPath: {
            contains: 'Sales & Marketing'
          }
        },
        take: 5,
        select: {
          name: true,
          folderPath: true,
          vectorized: true,
        }
      });
      
      console.log('\nSample files:');
      sampleSalesFiles.forEach((file, i) => {
        const status = file.vectorized ? '✅' : '❌';
        console.log(`  ${i + 1}. ${status} ${file.name}`);
        console.log(`     Path: ${file.folderPath}`);
      });
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    const percentage = totalFiles > 0 ? ((vectorizedFiles / totalFiles) * 100).toFixed(1) : '0';
    console.log(`Progress: ${vectorizedFiles}/${totalFiles} files vectorized (${percentage}%)`);
    
    if (vectorizedFiles === 0) {
      console.log('\n⚠️  WARNING: No vectorized files found!');
      console.log('   This means the vectorization script either:');
      console.log('   1. Has not been run yet');
      console.log('   2. Is currently running (check for progress in the script output)');
      console.log('   3. Encountered errors during execution');
    } else if (vectorizedFiles < 50) {
      console.log('\n⚠️  Only a few files vectorized. Expected hundreds from Sales & Marketing drive.');
      console.log('   The script may still be running or encountered issues.');
    } else {
      console.log('\n✅ Good! Files are being vectorized.');
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus().catch(console.error);

