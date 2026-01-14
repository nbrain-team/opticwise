import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface ColumnAnalysis {
  name: string;
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
  dataType: string;
}

function analyzeWorkbook(filePath: string, fileName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ANALYZING: ${fileName}`);
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`\n📄 Sheet: ${sheetName}`);
  console.log(`📈 Total Rows: ${data.length}`);

  if (data.length === 0) {
    console.log('⚠️  No data found in sheet');
    return;
  }

  // Get all columns
  const columns = Object.keys(data[0]);
  console.log(`📋 Total Columns: ${columns.length}\n`);

  // Analyze each column
  const columnAnalysis: ColumnAnalysis[] = columns.map(col => {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues);
    
    // Determine data type
    let dataType = 'string';
    if (nonNullValues.length > 0) {
      const sample = nonNullValues[0];
      if (typeof sample === 'number') {
        dataType = 'number';
      } else if (sample instanceof Date) {
        dataType = 'date';
      } else if (typeof sample === 'boolean') {
        dataType = 'boolean';
      }
    }

    return {
      name: col,
      sampleValues: nonNullValues.slice(0, 3),
      uniqueCount: uniqueValues.size,
      nullCount: values.length - nonNullValues.length,
      dataType
    };
  });

  // Print column details
  console.log('COLUMN DETAILS:');
  console.log('-'.repeat(80));
  
  columnAnalysis.forEach((col, idx) => {
    console.log(`\n${idx + 1}. ${col.name}`);
    console.log(`   Type: ${col.dataType}`);
    console.log(`   Non-null: ${data.length - col.nullCount}/${data.length}`);
    console.log(`   Unique values: ${col.uniqueCount}`);
    console.log(`   Sample values: ${col.sampleValues.map(v => JSON.stringify(v)).join(', ')}`);
  });

  // Look for ID columns and relationship fields
  console.log('\n\n🔗 RELATIONSHIP FIELDS DETECTED:');
  console.log('-'.repeat(80));
  
  const relationshipFields = columnAnalysis.filter(col => 
    col.name.toLowerCase().includes('id') || 
    col.name.toLowerCase().includes('person') ||
    col.name.toLowerCase().includes('org') ||
    col.name.toLowerCase().includes('owner')
  );

  if (relationshipFields.length > 0) {
    relationshipFields.forEach(field => {
      console.log(`✓ ${field.name} (${field.uniqueCount} unique values)`);
    });
  } else {
    console.log('No obvious relationship fields found');
  }

  // Sample first 3 rows
  console.log('\n\n📝 SAMPLE DATA (First 3 rows):');
  console.log('-'.repeat(80));
  data.slice(0, 3).forEach((row, idx) => {
    console.log(`\nRow ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      }
    });
  });
}

async function main() {
  const baseDir = path.join(__dirname, '../..');
  
  const files = [
    { path: path.join(baseDir, 'deals-2029418-75.xlsx'), name: 'DEALS' },
    { path: path.join(baseDir, 'organizations-2029418-76.xlsx'), name: 'ORGANIZATIONS' },
    { path: path.join(baseDir, 'people-2029418-77.xlsx'), name: 'PEOPLE' }
  ];

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      analyzeWorkbook(file.path, file.name);
    } else {
      console.log(`\n⚠️  File not found: ${file.path}`);
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);

