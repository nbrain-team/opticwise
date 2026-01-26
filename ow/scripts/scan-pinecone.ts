import { Pinecone } from '@pinecone-database/pinecone';

async function scanPineconeIndex() {
  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts';
    console.log(`\n🔍 Scanning Pinecone Index: ${indexName}\n`);

    const index = pc.index(indexName);

    // Get index stats
    const stats = await index.describeIndexStats();
    
    console.log('📊 INDEX STATISTICS:');
    console.log('='.repeat(60));
    console.log(`Total Vectors: ${stats.totalRecordCount?.toLocaleString()}`);
    console.log(`Dimension: ${stats.dimension}`);
    console.log(`Index Fullness: ${((stats.indexFullness || 0) * 100).toFixed(2)}%`);
    
    if (stats.namespaces) {
      console.log('\n📁 NAMESPACES:');
      console.log('='.repeat(60));
      
      for (const [namespace, data] of Object.entries(stats.namespaces)) {
        const nsName = namespace || '(default)';
        console.log(`\n  Namespace: ${nsName}`);
        console.log(`  └─ Vector Count: ${data.recordCount?.toLocaleString()}`);
      }
    }

    // Try to fetch some sample vectors to analyze metadata
    console.log('\n\n🔬 SAMPLE VECTOR ANALYSIS:');
    console.log('='.repeat(60));
    
    // Query for some random vectors to see metadata structure
    const sampleQuery = await index.query({
      vector: new Array(stats.dimension).fill(0),
      topK: 10,
      includeMetadata: true,
    });

    if (sampleQuery.matches && sampleQuery.matches.length > 0) {
      console.log(`\nFound ${sampleQuery.matches.length} sample vectors\n`);
      
      // Analyze metadata structure
      const metadataKeys = new Set<string>();
      const documentTypes = new Set<string>();
      
      sampleQuery.matches.forEach((match, idx) => {
        if (match.metadata) {
          Object.keys(match.metadata).forEach(key => metadataKeys.add(key));
          
          if (match.metadata.type) {
            documentTypes.add(match.metadata.type as string);
          }
          
          if (idx < 3) {
            console.log(`\nSample ${idx + 1}:`);
            console.log(`  ID: ${match.id}`);
            console.log(`  Metadata Keys: ${Object.keys(match.metadata).join(', ')}`);
            if (match.metadata.text) {
              const text = String(match.metadata.text);
              console.log(`  Text Preview: ${text.substring(0, 100)}...`);
            }
          }
        }
      });
      
      console.log('\n\n📋 METADATA STRUCTURE:');
      console.log('='.repeat(60));
      console.log(`Common Metadata Fields: ${Array.from(metadataKeys).join(', ')}`);
      
      if (documentTypes.size > 0) {
        console.log(`Document Types Found: ${Array.from(documentTypes).join(', ')}`);
      }
    }

    console.log('\n\n✅ Scan Complete!\n');

  } catch (error) {
    console.error('❌ Error scanning Pinecone:', error);
    throw error;
  }
}

scanPineconeIndex();
