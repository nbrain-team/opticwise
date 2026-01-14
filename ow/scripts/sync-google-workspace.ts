/**
 * Master script to sync all Google Workspace data
 * Runs Gmail, Calendar, and Drive sync in sequence
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runScript(scriptName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running ${scriptName}...`);
  console.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(`tsx ${scriptName}`, {
      cwd: __dirname,
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✓ ${scriptName} completed successfully`);
  } catch (error) {
    console.error(`✗ ${scriptName} failed:`, error);
    throw error;
  }
}

async function syncAll() {
  const startTime = Date.now();
  
  console.log('\n🚀 Starting Google Workspace sync...\n');
  
  try {
    // Sync in sequence to avoid rate limit issues
    await runScript('sync-gmail.ts');
    await runScript('sync-calendar.ts');
    await runScript('sync-drive.ts');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Google Workspace sync completed successfully!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

syncAll();







