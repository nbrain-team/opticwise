/**
 * Test Deep Analysis Mode Enhancement
 * 
 * Tests the enhanced trigger detection and token allocation
 * for comprehensive analysis requests
 */

import { classifyQuery } from '../lib/ai-agent-utils';

console.log('🧪 Testing Deep Analysis Mode Enhancement\n');
console.log('='.repeat(80));

interface TestCase {
  query: string;
  expectedMode: string;
  expectedMinTokens: number;
  description: string;
}

const testCases: TestCase[] = [
  // Max Token Commands
  {
    query: 'Analyze all deals with max tokens',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 60000,
    description: 'Max tokens command'
  },
  {
    query: 'Give me max_tokens on this analysis',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 60000,
    description: 'Max tokens with underscore'
  },
  {
    query: 'Provide maximum detail on all customers',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 60000,
    description: 'Maximum keyword'
  },
  {
    query: 'I need an exhaustive analysis of the pipeline',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 60000,
    description: 'Exhaustive keyword'
  },
  
  // Deep Analysis Phrases
  {
    query: 'Deep analysis of all our deals',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Deep analysis phrase'
  },
  {
    query: 'Give me a deep dive into customer activity',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Deep dive phrase'
  },
  {
    query: 'Provide a comprehensive analysis of the pipeline',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Comprehensive analysis'
  },
  {
    query: 'I want a detailed analysis of all activity',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Detailed analysis'
  },
  
  // Analyze All Commands
  {
    query: 'Analyze all of them with full details',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 60000,
    description: 'Analyze all command'
  },
  {
    query: 'Give me everything you know about this customer',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Everything you know'
  },
  {
    query: 'Show me all the data on these deals',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'All the data'
  },
  
  // Complete/Full Reports
  {
    query: 'Provide a complete report on pipeline activity',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Complete report'
  },
  {
    query: 'Give me a full breakdown of all deals',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Full breakdown'
  },
  {
    query: 'I need a comprehensive review of customer interactions',
    expectedMode: 'deep_analysis',
    expectedMinTokens: 30000,
    description: 'Comprehensive review'
  },
  
  // Research Mode (Should NOT trigger deep analysis)
  {
    query: 'Find all emails from last week',
    expectedMode: 'research',
    expectedMinTokens: 10000,
    description: 'Research query'
  },
  {
    query: 'Show me everything about Acme Corp',
    expectedMode: 'research',
    expectedMinTokens: 10000,
    description: 'Show everything (research level)'
  },
  
  // Quick Answer (Should NOT trigger deep analysis)
  {
    query: 'What deals do we have?',
    expectedMode: 'quick_answer',
    expectedMinTokens: 3000,
    description: 'Simple question'
  },
  {
    query: 'How many open deals?',
    expectedMode: 'quick_answer',
    expectedMinTokens: 3000,
    description: 'Count query'
  },
  {
    query: 'Show me the pipeline',
    expectedMode: 'quick_answer',
    expectedMinTokens: 3000,
    description: 'Simple show command'
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 Running Test Cases...\n');

testCases.forEach((testCase, index) => {
  const result = classifyQuery(testCase.query);
  
  const modeMatch = result.type === testCase.expectedMode;
  const tokenMatch = result.suggestedMaxTokens >= testCase.expectedMinTokens;
  const testPassed = modeMatch && tokenMatch;
  
  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS - ${testCase.description}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAIL - ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Expected: ${testCase.expectedMode} with ${testCase.expectedMinTokens}+ tokens`);
    console.log(`   Got: ${result.type} with ${result.suggestedMaxTokens} tokens`);
    if (result.keywords.length > 0) {
      console.log(`   Matched keywords: ${result.keywords.join(', ')}`);
    }
  }
  console.log();
});

console.log('='.repeat(80));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed} (${Math.round(passed / testCases.length * 100)}%)`);
console.log(`❌ Failed: ${failed} (${Math.round(failed / testCases.length * 100)}%)`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Deep Analysis Mode is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the output above.\n');
  process.exit(1);
}
