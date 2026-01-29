/**
 * OWnet Agent - Comprehensive Connection Test
 * Tests all data source connections: Pinecone, CRM, Google Workspace
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { Pool } from 'pg';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    const result = await pool.query('SELECT NOW()');
    results.push({
      name: 'Database Connection',
      status: 'PASS',
      message: `Connected to PostgreSQL successfully`,
      details: { timestamp: result.rows[0].now }
    });
    console.log('✅ Database connection successful');
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'FAIL',
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Database connection failed:', error);
  }
}

async function testAgentTables() {
  console.log('\n🔍 Testing Agent Tables...');
  try {
    // Check AgentChatSession table
    const sessionResult = await pool.query(
      'SELECT COUNT(*) as count FROM "AgentChatSession"'
    );
    const sessionCount = parseInt(sessionResult.rows[0].count);
    
    // Check AgentChatMessage table
    const messageResult = await pool.query(
      'SELECT COUNT(*) as count FROM "AgentChatMessage"'
    );
    const messageCount = parseInt(messageResult.rows[0].count);
    
    results.push({
      name: 'Agent Tables',
      status: 'PASS',
      message: `Agent tables exist and accessible`,
      details: {
        sessions: sessionCount,
        messages: messageCount
      }
    });
    console.log(`✅ Agent tables exist: ${sessionCount} sessions, ${messageCount} messages`);
  } catch (error) {
    results.push({
      name: 'Agent Tables',
      status: 'FAIL',
      message: `Agent tables not found or inaccessible: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Agent tables check failed:', error);
  }
}

async function testCRMData() {
  console.log('\n🔍 Testing CRM Data Access...');
  try {
    // Test Deals
    const dealsResult = await pool.query(
      'SELECT COUNT(*) as count FROM "Deal" WHERE status = $1',
      ['open']
    );
    const dealsCount = parseInt(dealsResult.rows[0].count);
    
    // Test Contacts
    const contactsResult = await pool.query(
      'SELECT COUNT(*) as count FROM "Person" WHERE email IS NOT NULL'
    );
    const contactsCount = parseInt(contactsResult.rows[0].count);
    
    // Test Organizations
    const orgsResult = await pool.query(
      'SELECT COUNT(*) as count FROM "Organization"'
    );
    const orgsCount = parseInt(orgsResult.rows[0].count);
    
    results.push({
      name: 'CRM Data Access',
      status: 'PASS',
      message: `CRM data accessible`,
      details: {
        openDeals: dealsCount,
        contacts: contactsCount,
        organizations: orgsCount
      }
    });
    console.log(`✅ CRM data: ${dealsCount} open deals, ${contactsCount} contacts, ${orgsCount} organizations`);
  } catch (error) {
    results.push({
      name: 'CRM Data Access',
      status: 'FAIL',
      message: `Failed to access CRM data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ CRM data access failed:', error);
  }
}

async function testGoogleWorkspaceData() {
  console.log('\n🔍 Testing Google Workspace Data...');
  try {
    // Test Gmail
    const gmailResult = await pool.query(
      'SELECT COUNT(*) as count, COUNT(CASE WHEN vectorized = true THEN 1 END) as vectorized FROM "GmailMessage"'
    );
    const gmailCount = parseInt(gmailResult.rows[0].count);
    const gmailVectorized = parseInt(gmailResult.rows[0].vectorized);
    
    // Test Calendar
    const calendarResult = await pool.query(
      'SELECT COUNT(*) as count, COUNT(CASE WHEN vectorized = true THEN 1 END) as vectorized FROM "CalendarEvent"'
    );
    const calendarCount = parseInt(calendarResult.rows[0].count);
    const calendarVectorized = parseInt(calendarResult.rows[0].vectorized);
    
    // Test Drive
    const driveResult = await pool.query(
      'SELECT COUNT(*) as count, COUNT(CASE WHEN vectorized = true THEN 1 END) as vectorized FROM "DriveFile"'
    );
    const driveCount = parseInt(driveResult.rows[0].count);
    const driveVectorized = parseInt(driveResult.rows[0].vectorized);
    
    const totalGoogle = gmailCount + calendarCount + driveCount;
    const totalVectorized = gmailVectorized + calendarVectorized + driveVectorized;
    
    results.push({
      name: 'Google Workspace Data',
      status: totalGoogle > 0 ? 'PASS' : 'WARN',
      message: totalGoogle > 0 
        ? `Google Workspace data accessible (${totalVectorized}/${totalGoogle} vectorized)`
        : 'No Google Workspace data found',
      details: {
        gmail: { total: gmailCount, vectorized: gmailVectorized },
        calendar: { total: calendarCount, vectorized: calendarVectorized },
        drive: { total: driveCount, vectorized: driveVectorized }
      }
    });
    console.log(`✅ Google data: Gmail(${gmailCount}), Calendar(${calendarCount}), Drive(${driveCount})`);
    console.log(`   Vectorized: Gmail(${gmailVectorized}), Calendar(${calendarVectorized}), Drive(${driveVectorized})`);
  } catch (error) {
    results.push({
      name: 'Google Workspace Data',
      status: 'FAIL',
      message: `Failed to access Google Workspace data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Google Workspace data access failed:', error);
  }
}

async function testPineconeConnection() {
  console.log('\n🔍 Testing Pinecone Connection...');
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts';
    const index = pinecone.index(indexName);
    
    // Get index stats
    const stats = await index.describeIndexStats();
    
    results.push({
      name: 'Pinecone Connection',
      status: 'PASS',
      message: `Connected to Pinecone index: ${indexName}`,
      details: {
        indexName,
        totalVectors: stats.totalRecordCount,
        dimension: stats.dimension
      }
    });
    console.log(`✅ Pinecone connected: ${stats.totalRecordCount} vectors in ${indexName}`);
  } catch (error) {
    results.push({
      name: 'Pinecone Connection',
      status: 'FAIL',
      message: `Failed to connect to Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Pinecone connection failed:', error);
  }
}

async function testPineconeSearch() {
  console.log('\n🔍 Testing Pinecone Search...');
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts';
    const index = pinecone.index(indexName);
    
    // Generate test embedding
    const testQuery = "Tell me about recent sales calls";
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: testQuery,
      dimensions: 1024,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search Pinecone
    const searchResults = await index.query({
      topK: 5,
      vector: queryEmbedding,
      includeMetadata: true,
    });
    
    results.push({
      name: 'Pinecone Search',
      status: searchResults.matches && searchResults.matches.length > 0 ? 'PASS' : 'WARN',
      message: searchResults.matches && searchResults.matches.length > 0
        ? `Search successful, found ${searchResults.matches.length} results`
        : 'Search returned no results',
      details: {
        query: testQuery,
        resultsCount: searchResults.matches?.length || 0,
        topMatch: searchResults.matches?.[0] ? {
          score: searchResults.matches[0].score,
          title: searchResults.matches[0].metadata?.title
        } : null
      }
    });
    console.log(`✅ Pinecone search: Found ${searchResults.matches?.length || 0} results`);
  } catch (error) {
    results.push({
      name: 'Pinecone Search',
      status: 'FAIL',
      message: `Failed to search Pinecone: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Pinecone search failed:', error);
  }
}

async function testCallTranscripts() {
  console.log('\n🔍 Testing Call Transcripts...');
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count, COUNT(CASE WHEN vectorized = true THEN 1 END) as vectorized FROM "CallTranscript"'
    );
    const totalCount = parseInt(result.rows[0].count);
    const vectorizedCount = parseInt(result.rows[0].vectorized);
    
    results.push({
      name: 'Call Transcripts',
      status: totalCount > 0 ? 'PASS' : 'WARN',
      message: totalCount > 0 
        ? `${totalCount} transcripts found (${vectorizedCount} vectorized)`
        : 'No call transcripts found',
      details: {
        total: totalCount,
        vectorized: vectorizedCount,
        notVectorized: totalCount - vectorizedCount
      }
    });
    console.log(`✅ Call transcripts: ${totalCount} total, ${vectorizedCount} vectorized`);
  } catch (error) {
    results.push({
      name: 'Call Transcripts',
      status: 'FAIL',
      message: `Failed to access call transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Call transcripts check failed:', error);
  }
}

async function testOpenAIConnection() {
  console.log('\n🔍 Testing OpenAI Connection...');
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: 'test',
      dimensions: 1024,
    });
    
    results.push({
      name: 'OpenAI Connection',
      status: 'PASS',
      message: 'OpenAI API connected successfully',
      details: {
        model: 'text-embedding-3-large',
        dimensions: 1024,
        embeddingLength: response.data[0].embedding.length
      }
    });
    console.log('✅ OpenAI API connected');
  } catch (error) {
    results.push({
      name: 'OpenAI Connection',
      status: 'FAIL',
      message: `Failed to connect to OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ OpenAI connection failed:', error);
  }
}

async function testAnthropicConnection() {
  console.log('\n🔍 Testing Anthropic Connection...');
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "test successful"' }],
    });
    
    results.push({
      name: 'Anthropic Connection',
      status: 'PASS',
      message: 'Anthropic API connected successfully',
      details: {
        model: 'claude-sonnet-4-5-20250929',
        response: response.content[0].type === 'text' ? response.content[0].text : ''
      }
    });
    console.log('✅ Anthropic API connected');
  } catch (error) {
    results.push({
      name: 'Anthropic Connection',
      status: 'FAIL',
      message: `Failed to connect to Anthropic: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ Anthropic connection failed:', error);
  }
}

async function testEndToEndQuery() {
  console.log('\n🔍 Testing End-to-End Agent Query...');
  try {
    // Simulate a real agent query
    const testQuery = "What are my top deals?";
    
    // 1. Get CRM data
    const dealsResult = await pool.query(
      `SELECT d.id, d.title, d.value, d.currency, s.name as stage_name
       FROM "Deal" d
       LEFT JOIN "Stage" s ON d."stageId" = s.id
       WHERE d.status = 'open'
       ORDER BY d.value DESC
       LIMIT 5`
    );
    
    // 2. Search Pinecone
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: testQuery,
      dimensions: 1024,
    });
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
    const searchResults = await index.query({
      topK: 3,
      vector: embeddingResponse.data[0].embedding,
      includeMetadata: true,
    });
    
    // 3. Build context
    const crmContext = dealsResult.rows.map(d => 
      `${d.title} - ${d.currency} ${d.value} (${d.stage_name})`
    ).join('\n');
    
    const transcriptContext = searchResults.matches?.map(m => 
      m.metadata?.text_chunk || ''
    ).join('\n') || '';
    
    // 4. Generate AI response
    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Context:\nDeals:\n${crmContext}\n\nTranscripts:\n${transcriptContext}\n\nQuestion: ${testQuery}`
        }
      ],
    });
    
    const responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
    
    results.push({
      name: 'End-to-End Query',
      status: 'PASS',
      message: 'Full agent query pipeline successful',
      details: {
        query: testQuery,
        dealsFound: dealsResult.rows.length,
        transcriptsFound: searchResults.matches?.length || 0,
        responseLength: responseText.length
      }
    });
    console.log('✅ End-to-end query successful');
    console.log(`   Query: "${testQuery}"`);
    console.log(`   Found: ${dealsResult.rows.length} deals, ${searchResults.matches?.length || 0} transcript matches`);
  } catch (error) {
    results.push({
      name: 'End-to-End Query',
      status: 'FAIL',
      message: `End-to-end query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    console.error('❌ End-to-end query failed:', error);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`\n✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log(`⚠️  WARNINGS: ${warnings}`);
  console.log(`📝 TOTAL: ${results.length}\n`);
  
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));
  
  results.forEach((result, idx) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`\n${idx + 1}. ${icon} ${result.name}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED! OWnet Agent is ready for use.');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the errors above.');
  }
  
  console.log('='.repeat(80) + '\n');
}

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🧪 OWNET AGENT - COMPREHENSIVE CONNECTION TEST');
  console.log('='.repeat(80));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Run all tests
  await testDatabaseConnection();
  await testAgentTables();
  await testCRMData();
  await testGoogleWorkspaceData();
  await testCallTranscripts();
  await testPineconeConnection();
  await testOpenAIConnection();
  await testAnthropicConnection();
  await testPineconeSearch();
  await testEndToEndQuery();
  
  // Print summary
  printSummary();
  
  // Cleanup
  await pool.end();
  
  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

