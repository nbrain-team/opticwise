/**
 * List all folders in the OpticWise Sales & Marketing shared drive
 */

import { getServiceAccountClient, getDriveClient } from '../lib/google';

async function listSalesMarketingFolders() {
  console.log('='.repeat(80));
  console.log('LISTING ALL FOLDERS IN OPTICWISE SALES & MARKETING SHARED DRIVE');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    
    // The ID of OpticWise Sales & Marketing shared drive
    const SALES_MARKETING_DRIVE_ID = '0AMmNVvy1_Jb3Uk9PVA';
    
    console.log('📁 Fetching all folders...\n');
    
    // Get all folders in this shared drive
    let allFolders: any[] = [];
    let pageToken: string | undefined = undefined;
    
    do {
      const response = await drive.files.list({
        corpora: 'drive',
        driveId: SALES_MARKETING_DRIVE_ID,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 1000,
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: 'nextPageToken, files(id, name, parents, createdTime, modifiedTime)',
        orderBy: 'name',
        pageToken: pageToken,
      });
      
      const folders = response.data.files || [];
      allFolders = allFolders.concat(folders);
      pageToken = response.data.nextPageToken || undefined;
      
    } while (pageToken);
    
    console.log(`✅ Found ${allFolders.length} folders total\n`);
    console.log('='.repeat(80));
    
    // Build a hierarchy map
    const folderMap = new Map();
    const rootFolders: any[] = [];
    
    allFolders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    });
    
    // Organize into hierarchy
    allFolders.forEach(folder => {
      const folderData = folderMap.get(folder.id);
      
      if (!folder.parents || folder.parents.length === 0 || folder.parents[0] === SALES_MARKETING_DRIVE_ID) {
        // Root level folder
        rootFolders.push(folderData);
      } else {
        // Child folder - add to parent
        const parent = folderMap.get(folder.parents[0]);
        if (parent) {
          parent.children.push(folderData);
        } else {
          // Parent not found, treat as root
          rootFolders.push(folderData);
        }
      }
    });
    
    // Print hierarchy
    function printFolder(folder: any, indent: string = '', isLast: boolean = true) {
      const prefix = indent + (isLast ? '└── ' : '├── ');
      console.log(`${prefix}📁 ${folder.name}`);
      
      // Sort children by name
      folder.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
      
      const childIndent = indent + (isLast ? '    ' : '│   ');
      folder.children.forEach((child: any, index: number) => {
        printFolder(child, childIndent, index === folder.children.length - 1);
      });
    }
    
    console.log('\n📂 FOLDER HIERARCHY:\n');
    rootFolders.sort((a, b) => a.name.localeCompare(b.name));
    rootFolders.forEach((folder, index) => {
      printFolder(folder, '', index === rootFolders.length - 1);
    });
    
    // Also print flat list with paths
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 FLAT LIST WITH FOLDER PATHS:\n');
    console.log('='.repeat(80));
    
    function getFolderPath(folderId: string, folderMap: Map<string, any>): string {
      const folder = folderMap.get(folderId);
      if (!folder) return '';
      
      if (!folder.parents || folder.parents.length === 0 || folder.parents[0] === SALES_MARKETING_DRIVE_ID) {
        return folder.name;
      }
      
      const parentPath = getFolderPath(folder.parents[0], folderMap);
      return parentPath ? `${parentPath}/${folder.name}` : folder.name;
    }
    
    const folderPaths = allFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: getFolderPath(folder.id, folderMap),
      created: folder.createdTime,
      modified: folder.modifiedTime,
    }));
    
    folderPaths.sort((a, b) => a.path.localeCompare(b.path));
    
    let currentIndex = 1;
    folderPaths.forEach(folder => {
      console.log(`\n${currentIndex}. ${folder.path}`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   Modified: ${new Date(folder.modified).toLocaleDateString()}`);
      currentIndex++;
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total folders: ${allFolders.length}`);
    console.log('='.repeat(80));
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Run
listSalesMarketingFolders().catch(console.error);

