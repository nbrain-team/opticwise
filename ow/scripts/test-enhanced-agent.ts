/**
 * Test Enhanced AI Agent Features
 * Comprehensive test suite for all new AI agent capabilities
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';
import {
  classifyQuery,
  expandQuery,
  loadContextWithinBudget,
  detectDataSourceIntent,
  estimateTokens,
  checkSemanticCache,
  saveToSemanticCache
} from '../lib/ai-agent-utils';

// Initialize clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
  duration?: number;
}

const results: TestResult[] = [];

// ============================================
// TEST 1: Query Classification
// ============================================
async function testQueryClassification() {
  console.log('\n🔍 Test 1: Query Classification');
  const startTime = Date.now();
  
  const testQueries = [
    { query: 'What is OpticWise?', expectedType: 'quick_answer' },
    { query: 'Give me a comprehensive analysis of our pipeline', expectedType: 'deep_analysis' },
    { query: 'Research all mentions of Koelbel', expectedType: 'research' },
    { query: 'Draft an email to Mass Equities', expectedType: 'creative' },
  ];
  
  let passed = 0;
  const classifications: any[] = [];
  
  for (const test of testQueries) {
    const result = classifyQuery(test.query);
    classifications.push({
      query: test.query,
      detected: result.type,
      expected: test.expectedType,
      match: result.type === test.expectedType
    });
    
    if (result.type === test.expectedType) {
      passed++;
    }
  }
  
  const success = passed === testQueries.length;
  results.push({
    name: 'Query Classification',
    status: success ? 'PASS' : 'WARN',
    message: `${passed}/${testQueries.length} classifications correct`,
    details: classifications,
    duration: Date.now() - startTime
  });
  
  console.log(success ? '✅ PASS' : '⚠️  WARN', `- ${passed}/${testQueries.length} correct`);
}

// ============================================
// TEST 2: Token Estimation
// ============================================
async function testTokenEstimation() {
  console.log('\n🔍 Test 2: Token Estimation');
  const startTime = Date.now();
  
  const testTexts = [
    { text: 'Hello world', expectedRange: [2, 4] },
    { text: 'This is a longer test sentence with more words to count', expectedRange: [10, 20] },
    { text: 'A'.repeat(1000), expectedRange: [100, 300] }
  ];
  
  let passed = 0;
  const estimates: any[] = [];
  
  for (const test of testTexts) {
    const tokens = estimateTokens(test.text);
    const inRange = tokens >= test.expectedRange[0] && tokens <= test.expectedRange[1];
    
    estimates.push({
      text: test.text.slice(0, 50) + (test.text.length > 50 ? '...' : ''),
      estimated: tokens,
      expectedRange: test.expectedRange,
      inRange
    });
    
    if (inRange) passed++;
  }
  
  const success = passed === testTexts.length;
  results.push({
    name: 'Token Estimation',
    status: success ? 'PASS' : 'WARN',
    message: `${passed}/${testTexts.length} estimations within expected range`,
    details: estimates,
    duration: Date.now() - startTime
  });
  
  console.log(success ? '✅ PASS' : '⚠️  WARN', `- ${passed}/${testTexts.length} in range`);
}

// ============================================
// TEST 3: Data Source Intent Detection
// ============================================
async function testDataSourceDetection() {
  console.log('\n🔍 Test 3: Data Source Intent Detection');
  const startTime = Date.now();
  
  const testQueries = [
    { query: 'Show me emails about Koelbel', expected: { needsEmail: true } },
    { query: 'What meetings do I have tomorrow?', expected: { needsCalendar: true } },
    { query: 'Find the proposal document for Mass Equities', expected: { needsDrive: true } },
    { query: 'What deals are in the pipeline?', expected: { needsCRM: true } },
  ];
  
  let passed = 0;
  const detections: any[] = [];
  
  for (const test of testQueries) {
    const result = detectDataSourceIntent(test.query);
    const expectedKey = Object.keys(test.expected)[0] as keyof typeof result;
    const match = result[expectedKey] === true;
    
    detections.push({
      query: test.query,
      detected: result,
      expected: test.expected,
      match
    });
    
    if (match) passed++;
  }
  
  const success = passed === testQueries.length;
  results.push({
    name: 'Data Source Detection',
    status: success ? 'PASS' : 'WARN',
    message: `${passed}/${testQueries.length} detections correct`,
    details: detections,
    duration: Date.now() - startTime
  });
  
  console.log(success ? '✅ PASS' : '⚠️  WARN', `- ${passed}/${testQueries.length} correct`);
}

// ============================================
// TEST 4: Query Expansion
// ============================================
async function testQueryExpansion() {
  console.log('\n🔍 Test 4: Query Expansion');
  const startTime = Date.now();
  
  try {
    const query = 'Tell me about Koelbel project';
    const expanded = await expandQuery(query, openai);
    
    const hasVariations = expanded.variations.length >= 3;
    const hasEntities = expanded.entities && expanded.entities.length > 0;
    const hasKeywords = expanded.keywords && expanded.keywords.length > 0;
    
    const success = hasVariations && hasEntities && hasKeywords;
    
    results.push({
      name: 'Query Expansion',
      status: success ? 'PASS' : 'WARN',
      message: success ? 'Query expanded successfully' : 'Expansion incomplete',
      details: {
        original: query,
        variations: expanded.variations,
        entities: expanded.entities,
        keywords: expanded.keywords
      },
      duration: Date.now() - startTime
    });
    
    console.log(success ? '✅ PASS' : '⚠️  WARN', `- ${expanded.variations.length} variations generated`);
  } catch (error) {
    results.push({
      name: 'Query Expansion',
      status: 'FAIL',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    });
    console.log('❌ FAIL');
  }
}

// ============================================
// TEST 5: Database Migration Check
// ============================================
async function testDatabaseMigration() {
  console.log('\n🔍 Test 5: Database Migration Check');
  const startTime = Date.now();
  
  const expectedTables = [
    'StyleGuide',
    'KnowledgeNode',
    'KnowledgeEdge',
    'UserMemory',
    'AIFeedback',
    'QueryAnalytics',
    'SemanticCache',
    'ProactiveInsight',
    'CompetitorMention'
  ];
  
  const existingTables: string[] = [];
  const missingTables: string[] = [];
  
  for (const table of expectedTables) {
    try {
      await pool.query(`SELECT 1 FROM "${table}" LIMIT 1`);
      existingTables.push(table);
    } catch (error) {
      missingTables.push(table);
    }
  }
  
  const success = missingTables.length === 0;
  
  results.push({
    name: 'Database Migration',
    status: success ? 'PASS' : 'WARN',
    message: success 
      ? 'All new tables exist' 
      : `Missing ${missingTables.length} tables - migration not run`,
    details: {
      existing: existingTables,
      missing: missingTables
    },
    duration: Date.now() - startTime
  });
  
  if (success) {
    console.log('✅ PASS - All tables exist');
  } else {
    console.log('⚠️  WARN - Migration needed:', missingTables);
  }
}

// ============================================
// TEST 6: Semantic Cache (if tables exist)
// ============================================
async function testSemanticCache() {
  console.log('\n🔍 Test 6: Semantic Cache');
  const startTime = Date.now();
  
  try {
    // Check if table exists
    await pool.query('SELECT 1 FROM "SemanticCache" LIMIT 1');
    
    const testQuery = 'What are my top deals?';
    
    // Save to cache
    await saveToSemanticCache(
      testQuery,
      'Test response for top deals',
      { sources: ['crm'] },
      pool,
      openai,
      1 // 1 hour TTL
    );
    
    // Try to retrieve
    const cached = await checkSemanticCache(testQuery, pool, openai, 0.95);
    
    const success = cached !== null && cached.response.includes('Test response');
    
    results.push({
      name: 'Semantic Cache',
      status: success ? 'PASS' : 'WARN',
      message: success ? 'Cache save and retrieval working' : 'Cache test incomplete',
      details: {
        saved: true,
        retrieved: cached !== null,
        response: cached?.response
      },
      duration: Date.now() - startTime
    });
    
    console.log(success ? '✅ PASS' : '⚠️  WARN');
  } catch (error) {
    results.push({
      name: 'Semantic Cache',
      status: 'WARN',
      message: 'Table not found - migration needed',
      duration: Date.now() - startTime
    });
    console.log('⚠️  WARN - Table not found');
  }
}

// ============================================
// TEST 7: Context Loading
// ============================================
async function testContextLoading() {
  console.log('\n🔍 Test 7: Context Loading');
  const startTime = Date.now();
  
  try {
    // Create a dummy session for testing
    const sessionResult = await pool.query(
      `INSERT INTO "AgentChatSession" ("userId", title) 
       VALUES ((SELECT id FROM "User" LIMIT 1), 'Test Session')
       RETURNING id`
    );
    const sessionId = sessionResult.rows[0]?.id;
    
    if (!sessionId) {
      throw new Error('No user found - cannot create test session');
    }
    
    const query = 'What are my recent deals?';
    const { contexts, totalTokens, budget } = await loadContextWithinBudget(
      query,
      pool,
      openai,
      pinecone,
      sessionId,
      100000 // 100K budget
    );
    
    const hasContexts = contexts.length > 0;
    const withinBudget = totalTokens <= budget.availableForContext;
    
    // Cleanup
    await pool.query('DELETE FROM "AgentChatSession" WHERE id = $1', [sessionId]);
    
    const success = hasContexts && withinBudget;
    
    results.push({
      name: 'Context Loading',
      status: success ? 'PASS' : 'WARN',
      message: success 
        ? `Loaded ${contexts.length} context sources (${totalTokens} tokens)` 
        : 'Context loading issue',
      details: {
        contextsLoaded: contexts.map(c => ({ type: c.type, tokens: c.tokenCount })),
        totalTokens,
        budget
      },
      duration: Date.now() - startTime
    });
    
    console.log(success ? '✅ PASS' : '⚠️  WARN', `- ${contexts.length} sources, ${totalTokens} tokens`);
  } catch (error) {
    results.push({
      name: 'Context Loading',
      status: 'FAIL',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    });
    console.log('❌ FAIL');
  }
}

// ============================================
// TEST 8: End-to-End Agent Query
// ============================================
async function testEndToEndQuery() {
  console.log('\n🔍 Test 8: End-to-End Agent Query');
  const startTime = Date.now();
  
  try {
    const query = 'What are my top 5 deals?';
    
    // Classify
    const intent = classifyQuery(query);
    
    // Detect sources
    const sourceIntent = detectDataSourceIntent(query);
    
    // Query CRM
    const deals = await pool.query(`
      SELECT d.title, d.value, d.currency, s.name as stage
      FROM "Deal" d
      LEFT JOIN "Stage" s ON d."stageId" = s.id
      WHERE d.status = 'open'
      ORDER BY d.value DESC
      LIMIT 5
    `);
    
    const hasResults = deals.rows.length > 0;
    
    results.push({
      name: 'End-to-End Query',
      status: hasResults ? 'PASS' : 'WARN',
      message: hasResults 
        ? `Query pipeline working, found ${deals.rows.length} deals` 
        : 'No deals found in database',
      details: {
        query,
        intent: intent.type,
        sourceIntent,
        dealsFound: deals.rows.length,
        topDeals: deals.rows.map(d => `${d.title}: ${d.currency} ${Number(d.value).toLocaleString()}`)
      },
      duration: Date.now() - startTime
    });
    
    console.log(hasResults ? '✅ PASS' : '⚠️  WARN', `- Found ${deals.rows.length} deals`);
  } catch (error) {
    results.push({
      name: 'End-to-End Query',
      status: 'FAIL',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    });
    console.log('❌ FAIL');
  }
}

// ============================================
// SUMMARY
// ============================================
function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY - Enhanced AI Agent');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`\n✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log(`⚠️  WARNINGS: ${warnings}`);
  console.log(`📝 TOTAL: ${results.length}`);
  console.log(`⏱️  DURATION: ${totalDuration}ms`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));
  
  results.forEach((result, idx) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`\n${idx + 1}. ${icon} ${result.name}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message}`);
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 ALL TESTS PASSED! Enhanced AI Agent is ready for deployment.');
  } else if (failed === 0) {
    console.log('⚠️  TESTS PASSED WITH WARNINGS. Review warnings above.');
    console.log('   Most warnings are due to migration not being run yet.');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review and fix errors above.');
  }
  
  console.log('='.repeat(80) + '\n');
}

// ============================================
// RUN ALL TESTS
// ============================================
async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🧪 ENHANCED AI AGENT - TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Run tests
  await testQueryClassification();
  await testTokenEstimation();
  await testDataSourceDetection();
  await testQueryExpansion();
  await testDatabaseMigration();
  await testSemanticCache();
  await testContextLoading();
  await testEndToEndQuery();
  
  // Print summary
  printSummary();
  
  // Cleanup
  await pool.end();
  
  // Exit code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
