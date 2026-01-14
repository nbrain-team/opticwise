/**
 * List main folders in Google Drive to help decide what to vectorize
 */

import { getServiceAccountClient, getDriveClient } from '../lib/google';

async function listDriveFolders() {
  console.log('Connecting to Google Drive...\n');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    // First, get info about the Drive we're accessing
    const about = await drive.about.get({
      fields: 'user,storageQuota',
    });
    
    console.log('=== DRIVE ACCESS INFO ===');
    console.log(`User: ${about.data.user?.displayName} (${about.data.user?.emailAddress})`);
    if (about.data.storageQuota) {
      const usedGB = (parseInt(about.data.storageQuota.usage || '0') / 1e9).toFixed(2);
      const limitGB = about.data.storageQuota.limit 
        ? (parseInt(about.data.storageQuota.limit) / 1e9).toFixed(2) 
        : 'Unlimited';
      console.log(`Storage: ${usedGB} GB used of ${limitGB} GB`);
    }
    console.log('');
    
    // Get root-level folders
    console.log('=== ROOT-LEVEL FOLDERS ===');
    const rootFolders = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and 'root' in parents",
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'name',
      pageSize: 100,
    });
    
    const folders = rootFolders.data.files || [];
    console.log(`Found ${folders.length} root-level folders:\n`);
    
    // For each root folder, count items inside
    for (const folder of folders) {
      // Count files/folders inside
      const contents = await drive.files.list({
        q: `'${folder.id}' in parents`,
        fields: 'files(id, mimeType)',
        pageSize: 1000,
      });
      
      const items = contents.data.files || [];
      const subfolders = items.filter(f => f.mimeType === 'application/vnd.google-apps.folder').length;
      const files = items.length - subfolders;
      
      console.log(`📁 ${folder.name}`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   Contents: ${files} files, ${subfolders} subfolders`);
      console.log(`   Modified: ${folder.modifiedTime}`);
      console.log('');
    }
    
    // Also get Shared Drives if any
    console.log('\n=== SHARED DRIVES ===');
    try {
      const sharedDrives = await drive.drives.list({
        pageSize: 50,
      });
      
      const drives = sharedDrives.data.drives || [];
      if (drives.length > 0) {
        console.log(`Found ${drives.length} shared drives:\n`);
        for (const d of drives) {
          console.log(`📁 ${d.name}`);
          console.log(`   ID: ${d.id}`);
          console.log('');
        }
      } else {
        console.log('No shared drives found.');
      }
    } catch (error: any) {
      console.log('Could not list shared drives (may need additional permissions)');
    }
    
    // Get overall file count and types
    console.log('\n=== FILE TYPE SUMMARY ===');
    const allFiles = await drive.files.list({
      pageSize: 1000,
      fields: 'files(mimeType)',
    });
    
    const filesByType: Record<string, number> = {};
    (allFiles.data.files || []).forEach((f: any) => {
      const type = f.mimeType || 'unknown';
      filesByType[type] = (filesByType[type] || 0) + 1;
    });
    
    // Sort by count
    const sortedTypes = Object.entries(filesByType)
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`Total files accessible: ${allFiles.data.files?.length || 0}\n`);
    for (const [type, count] of sortedTypes) {
      const shortType = type.replace('application/vnd.google-apps.', 'google-').replace('application/', '');
      console.log(`  ${count.toString().padStart(4)} × ${shortType}`);
    }
    
    // Get recent files
    console.log('\n=== RECENTLY MODIFIED FILES ===');
    const recentFiles = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    
    console.log('Last 10 modified files:\n');
    (recentFiles.data.files || []).forEach((f: any, i: number) => {
      const shortType = (f.mimeType || 'unknown').replace('application/vnd.google-apps.', '');
      console.log(`${i + 1}. ${f.name}`);
      console.log(`   Type: ${shortType}`);
      console.log(`   Modified: ${f.modifiedTime}`);
      console.log('');
    });
    
  } catch (error: any) {
    console.error('Error accessing Drive:', error.message);
    if (error.code === 403) {
      console.log('\nPermission denied. Make sure:');
      console.log('1. Domain-wide delegation is enabled for the service account');
      console.log('2. The scopes include https://www.googleapis.com/auth/drive.readonly');
      console.log('3. The user being impersonated has Drive access');
    }
    throw error;
  }
}

// Run
listDriveFolders().catch(console.error);





