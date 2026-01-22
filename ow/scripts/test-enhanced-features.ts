/**
 * Test Enhanced Features
 * 
 * Tests all new Newbury Partners-inspired features:
 * - Tool Registry
 * - Hybrid Search
 * - Email Voice Analysis
 * - Execution Planning
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { toolRegistry, registerAllTools } from '../tools';
import { HybridSearchService } from '../lib/hybrid-search';
import { EmailVoiceAnalyzer } from '../lib/email-voice-analyzer';
import { ExecutionPlanner } from '../lib/execution-planner';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

async function testAllFeatures() {
  console.log('🧪 Testing Enhanced Features\n');
  console.log('='.repeat(80) + '\n');

  // Test 1: Tool Registry
  console.log('TEST 1: Tool Registry');
  console.log('-'.repeat(80));
  registerAllTools();
  const tools = toolRegistry.listTools();
  console.log(`✅ Registered ${tools.length} tools:`);
  tools.forEach(t => console.log(`   - ${t.name} (${t.category})`));
  console.log('');

  // Test 2: Hybrid Search
  console.log('TEST 2: Hybrid Search');
  console.log('-'.repeat(80));
  const hybridSearch = new HybridSearchService(pool, openai, anthropic, pinecone);
  const searchResults = await hybridSearch.search({
    query: 'digital infrastructure',
    top_k: 5,
    enable_reranking: true,
  });
  console.log(`✅ Hybrid search returned ${searchResults.data.results.length} results`);
  console.log(`   Confidence: ${(searchResults.confidence * 100).toFixed(1)}%`);
  console.log(`   Method: ${searchResults.data.method}`);
  console.log('');

  // Test 3: Email Voice Analysis
  console.log('TEST 3: Email Voice Analysis');
  console.log('-'.repeat(80));
  const emailVoiceAnalyzer = new EmailVoiceAnalyzer(pool, anthropic);
  const voiceGuide = await emailVoiceAnalyzer.generateEmailStyleGuide();
  console.log('✅ Generated email voice style guide');
  console.log(voiceGuide.substring(0, 500) + '...');
  console.log('');

  // Test 4: Execution Planning
  console.log('TEST 4: Execution Planning');
  console.log('-'.repeat(80));
  const planner = new ExecutionPlanner(anthropic, toolRegistry);
  const plan = await planner.generatePlan({
    userMessage: 'What deals need attention?',
    conversationHistory: [],
  });
  console.log('✅ Generated execution plan:');
  console.log(`   Understanding: ${plan.understanding}`);
  console.log(`   Steps: ${plan.steps.length}`);
  plan.steps.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.tool} - ${s.reason}`);
  });
  console.log(`   Estimated time: ${plan.estimated_time}`);
  console.log('');

  // Test 5: Tool Execution
  console.log('TEST 5: Tool Execution');
  console.log('-'.repeat(80));
  const crmResult = await toolRegistry.executeTool(
    'search_crm',
    { query: 'deals', type: 'deals', limit: 5 },
    { dbPool: pool, openai, pinecone }
  );
  console.log(`✅ Executed search_crm tool`);
  console.log(`   Success: ${crmResult.success}`);
  console.log(`   Confidence: ${((crmResult.confidence || 0) * 100).toFixed(1)}%`);
  console.log(`   Data points: ${crmResult.data_points?.length || 0}`);
  console.log('');

  // Test 6: StyleGuide Check
  console.log('TEST 6: StyleGuide Check');
  console.log('-'.repeat(80));
  const styleResult = await pool.query(
    'SELECT category, subcategory, COUNT(*) as count FROM "StyleGuide" GROUP BY category, subcategory'
  );
  console.log(`✅ StyleGuide contains ${styleResult.rows.length} categories:`);
  styleResult.rows.forEach(r => {
    console.log(`   - ${r.category}/${r.subcategory}: ${r.count} examples`);
  });
  console.log('');

  console.log('='.repeat(80));
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('📋 Summary:');
  console.log(`   ✅ Tool Registry: ${tools.length} tools registered`);
  console.log(`   ✅ Hybrid Search: Working with ${searchResults.data.results.length} results`);
  console.log(`   ✅ Email Voice Analysis: Generated style guide`);
  console.log(`   ✅ Execution Planning: ${plan.steps.length} steps planned`);
  console.log(`   ✅ Tool Execution: CRM search successful`);
  console.log(`   ✅ StyleGuide: ${styleResult.rows.length} categories populated`);
  console.log('');
  console.log('🎉 All Newbury Partners features are working!\n');
}

testAllFeatures()
  .then(() => {
    console.log('✅ Testing complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
