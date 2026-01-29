/**
 * Test Brand Terminology Enforcement
 * 
 * Tests that "infrastructure" is always replaced with "digital infrastructure"
 * This is a critical brand rule for OpticWise
 */

import { enforceBrandTerminology } from '../lib/ai-agent-utils';

console.log('🧪 Testing Brand Terminology Enforcement\n');
console.log('='.repeat(80));

interface TestCase {
  input: string;
  expected: string;
  description: string;
}

const testCases: TestCase[] = [
  // Basic replacements
  {
    input: 'We provide infrastructure solutions.',
    expected: 'We provide digital infrastructure solutions.',
    description: 'Simple lowercase replacement'
  },
  {
    input: 'Infrastructure is our core offering.',
    expected: 'Digital Infrastructure is our core offering.',
    description: 'Capitalized at start of sentence'
  },
  {
    input: 'Building infrastructure for modern offices.',
    expected: 'Building digital infrastructure for modern offices.',
    description: 'Lowercase in middle of sentence'
  },
  
  // Should NOT replace when "digital" already present
  {
    input: 'We specialize in digital infrastructure.',
    expected: 'We specialize in digital infrastructure.',
    description: 'Already has "digital" (lowercase)'
  },
  {
    input: 'Digital Infrastructure is what we do.',
    expected: 'Digital Infrastructure is what we do.',
    description: 'Already has "Digital" (capitalized)'
  },
  {
    input: 'Our digital infrastructure solutions are comprehensive.',
    expected: 'Our digital infrastructure solutions are comprehensive.',
    description: 'Already has "digital" in middle of sentence'
  },
  
  // Multiple instances
  {
    input: 'Infrastructure planning and infrastructure deployment.',
    expected: 'Digital Infrastructure planning and digital infrastructure deployment.',
    description: 'Multiple instances in one sentence'
  },
  {
    input: 'The infrastructure needs assessment revealed infrastructure gaps.',
    expected: 'The digital infrastructure needs assessment revealed digital infrastructure gaps.',
    description: 'Multiple instances with different contexts'
  },
  
  // Mixed cases
  {
    input: 'Infrastructure and Digital Infrastructure both mentioned.',
    expected: 'Digital Infrastructure and Digital Infrastructure both mentioned.',
    description: 'Mixed - one needs fixing, one already correct'
  },
  {
    input: 'Our infrastructure team handles digital infrastructure projects.',
    expected: 'Our digital infrastructure team handles digital infrastructure projects.',
    description: 'Mixed - first needs fixing, second already correct'
  },
  
  // Real-world examples
  {
    input: 'OpticWise provides infrastructure solutions for commercial real estate.',
    expected: 'OpticWise provides digital infrastructure solutions for commercial real estate.',
    description: 'Real-world marketing copy'
  },
  {
    input: 'The building\'s infrastructure was outdated.',
    expected: 'The building\'s digital infrastructure was outdated.',
    description: 'Real-world technical description'
  },
  {
    input: 'We discussed infrastructure requirements during the call.',
    expected: 'We discussed digital infrastructure requirements during the call.',
    description: 'Real-world call summary'
  },
  
  // Edge cases
  {
    input: 'Infrastructure',
    expected: 'Digital Infrastructure',
    description: 'Single word (capitalized)'
  },
  {
    input: 'infrastructure',
    expected: 'digital infrastructure',
    description: 'Single word (lowercase)'
  },
  {
    input: 'The infrastructure.',
    expected: 'The digital infrastructure.',
    description: 'With punctuation'
  },
  {
    input: 'Infrastructure, infrastructure, infrastructure!',
    expected: 'Digital Infrastructure, digital infrastructure, digital infrastructure!',
    description: 'Multiple with punctuation'
  },
  
  // Should NOT affect other words
  {
    input: 'The infrastructural changes were significant.',
    expected: 'The infrastructural changes were significant.',
    description: 'Related word (infrastructural) should NOT change'
  },
  {
    input: 'Infrastructure-as-a-Service is different.',
    expected: 'Digital Infrastructure-as-a-Service is different.',
    description: 'Hyphenated term'
  }
];

console.log('\n📋 Running Test Cases...\n');

let passed = 0;
let failed = 0;
const failures: { test: TestCase; actual: string }[] = [];

testCases.forEach((testCase, index) => {
  const actual = enforceBrandTerminology(testCase.input);
  const testPassed = actual === testCase.expected;
  
  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASS - ${testCase.description}`);
  } else {
    failed++;
    failures.push({ test: testCase, actual });
    console.log(`❌ Test ${index + 1}: FAIL - ${testCase.description}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Actual:   "${actual}"`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed} (${Math.round(passed / testCases.length * 100)}%)`);
console.log(`❌ Failed: ${failed} (${Math.round(failed / testCases.length * 100)}%)`);

if (failed > 0) {
  console.log('\n⚠️  Failed Tests:\n');
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.test.description}`);
    console.log(`   Expected: "${failure.test.expected}"`);
    console.log(`   Got:      "${failure.actual}"`);
    console.log();
  });
}

if (failed === 0) {
  console.log('\n🎉 All tests passed! Brand terminology enforcement is working correctly.\n');
  console.log('✅ "infrastructure" will ALWAYS be replaced with "digital infrastructure"');
  console.log('✅ Capitalization is preserved correctly');
  console.log('✅ Already-correct instances are not modified');
  console.log('✅ Multiple instances in one response are all corrected\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the output above.\n');
  process.exit(1);
}
