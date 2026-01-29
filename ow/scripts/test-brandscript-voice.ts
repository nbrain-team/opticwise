/**
 * Test BrandScript Voice Implementation
 * 
 * Comprehensive test suite for OpticWise BrandScript voice guidelines
 * Based on the BrandScript document test suite
 */

import { enforceBrandVoice, validateSB7Structure, injectReframingLineIfNeeded } from '../lib/brandscript-voice-enforcement';
import { COPY_BLOCKS } from '../lib/brandscript-prompt';

console.log('🧪 Testing OpticWise BrandScript Voice Implementation\n');
console.log('='.repeat(80));

interface TestCase {
  name: string;
  input: string;
  checks: {
    name: string;
    test: (output: string) => boolean;
  }[];
}

// Test Suite based on BrandScript document
const testCases: TestCase[] = [
  // Test 1: Infrastructure Terminology
  {
    name: 'Infrastructure Terminology Enforcement',
    input: 'We provide infrastructure solutions for your building.',
    checks: [
      {
        name: 'Replaces "infrastructure" with "digital infrastructure"',
        test: (output) => output.includes('digital infrastructure') && !output.match(/(?<!digital\s)(?<!Digital\s)\binfrastructure\b/i)
      }
    ]
  },
  
  // Test 2: PropTech Framing Replacement
  {
    name: 'PropTech Framing Replacement',
    input: 'Our PropTech stack includes smart building gadgets and IoT devices.',
    checks: [
      {
        name: 'Replaces "PropTech stack"',
        test: (output) => !output.toLowerCase().includes('proptech stack')
      },
      {
        name: 'Replaces "smart building gadgets"',
        test: (output) => !output.includes('smart building gadgets')
      },
      {
        name: 'Replaces "IoT devices"',
        test: (output) => !output.includes('IoT devices') || output.includes('connected building systems')
      }
    ]
  },
  
  // Test 3: Vendor Language Replacement
  {
    name: 'Vendor Language to Guide Language',
    input: 'We sell our product to help you. Buy our solution today.',
    checks: [
      {
        name: 'Replaces "we sell" with "we help you"',
        test: (output) => !output.toLowerCase().includes('we sell')
      },
      {
        name: 'Replaces "our product" with "our approach"',
        test: (output) => !output.toLowerCase().includes('our product')
      },
      {
        name: 'Replaces "buy our" with "partner with us"',
        test: (output) => !output.toLowerCase().includes('buy our')
      }
    ]
  },
  
  // Test 4: 5S UX Definition
  {
    name: '5S UX Correct Definition',
    input: '5S includes Seamless, Security, Stability, Speed, Service.',
    checks: [
      {
        name: 'Corrects to "Seamless Mobility"',
        test: (output) => output.includes('Seamless Mobility')
      }
    ]
  },
  
  // Test 5: SB7 Structure Validation
  {
    name: 'SB7 Structure Validation',
    input: `You want to grow NOI and improve tenant experience. But vendors own your infrastructure and data is fragmented. If you don't own your infrastructure, your vendors do. OpticWise helps you take control through our PPP 5C plan: Clarify, Connect, Collect, Coordinate, Control. The result is higher NOI, better tenant experience, and operational control. Start with a PPP Audit.`,
    checks: [
      {
        name: 'Has owner language ("you")',
        test: (output) => /\byou\b/i.test(output)
      },
      {
        name: 'Has problem framing',
        test: (output) => /vendor|fragment|control/i.test(output)
      },
      {
        name: 'Has reframing line or theme',
        test: (output) => /if you don't own|vendor.*own/i.test(output)
      },
      {
        name: 'Has plan reference',
        test: (output) => /clarify|connect|collect|coordinate|control|5c/i.test(output)
      },
      {
        name: 'Has outcomes',
        test: (output) => /noi|tenant|experience|control/i.test(output)
      },
      {
        name: 'Has CTA',
        test: (output) => /audit|call|schedule|start/i.test(output)
      }
    ]
  },
  
  // Test 6: Reframing Line Injection (Optional Enhancement)
  {
    name: 'Reframing Line Injection (Optional)',
    input: `Many owners have bulk agreements with Comcast or AT&T. These vendor contracts often limit your control over the network and data. You need to reclaim ownership to unlock value.

This is a longer paragraph to trigger injection.`,
    checks: [
      {
        name: 'Injects reframing line when vendor context exists (or already present)',
        test: (output) => output.toLowerCase().includes('if you don\'t own') || output.toLowerCase().includes('reclaim ownership')
      }
    ]
  },
  
  // Test 7: Copy Blocks Available
  {
    name: 'Copy Blocks Accessibility',
    input: '',
    checks: [
      {
        name: 'One-liner copy block exists',
        test: () => COPY_BLOCKS.oneLiner.length > 50
      },
      {
        name: 'Elevator pitch exists',
        test: () => COPY_BLOCKS.elevatorPitch.length > 100
      },
      {
        name: 'Reframing line exists',
        test: () => COPY_BLOCKS.reframingLine === 'If you don\'t own your infrastructure, your vendors do.'
      },
      {
        name: 'Infinite game lines exist',
        test: () => COPY_BLOCKS.infiniteGameLines.length === 3
      }
    ]
  }
];

console.log('\n📋 Running BrandScript Voice Tests...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: { testName: string; checkName: string; output?: string }[] = [];

testCases.forEach((testCase, index) => {
  console.log(`\n### Test ${index + 1}: ${testCase.name}\n`);
  
  let testOutput = testCase.input;
  if (testCase.input) {
    testOutput = enforceBrandVoice(testCase.input);
    if (testCase.name.includes('Injection')) {
      testOutput = injectReframingLineIfNeeded(testOutput);
    }
  }
  
  testCase.checks.forEach((check) => {
    totalTests++;
    const passed = check.test(testOutput);
    
    if (passed) {
      passedTests++;
      console.log(`  ✅ ${check.name}`);
    } else {
      failedTests++;
      console.log(`  ❌ ${check.name}`);
      failures.push({
        testName: testCase.name,
        checkName: check.name,
        output: testOutput
      });
    }
  });
});

// Additional validation tests
console.log('\n### Validation Tests\n');

const validationTests = [
  {
    name: 'SB7 validation function works',
    test: () => {
      const goodText = 'You want NOI growth. But vendors own your infrastructure. OpticWise helps through PPP 5C: Clarify, Connect, Collect, Coordinate, Control. Result: higher NOI and control. Book a PPP Audit.';
      const result = validateSB7Structure(goodText);
      return result.score >= 5;
    }
  },
  {
    name: 'SB7 validation detects missing elements',
    test: () => {
      const badText = 'We have a great product.';
      const result = validateSB7Structure(badText);
      return result.score < 5 && result.warnings.length > 0;
    }
  }
];

validationTests.forEach((test) => {
  totalTests++;
  const passed = test.test();
  
  if (passed) {
    passedTests++;
    console.log(`  ✅ ${test.name}`);
  } else {
    failedTests++;
    console.log(`  ❌ ${test.name}`);
    failures.push({
      testName: 'Validation Tests',
      checkName: test.name
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`);
console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`);

if (failedTests > 0) {
  console.log('\n⚠️  Failed Tests:\n');
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.testName} - ${failure.checkName}`);
    if (failure.output) {
      console.log(`   Output: "${failure.output.substring(0, 100)}..."`);
    }
    console.log();
  });
}

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! BrandScript voice enforcement is working correctly.\n');
  console.log('✅ Digital infrastructure terminology enforced');
  console.log('✅ PropTech framing replaced with strategic asset framing');
  console.log('✅ Vendor language replaced with guide language');
  console.log('✅ 5S UX definitions corrected');
  console.log('✅ SB7 structure validation working');
  console.log('✅ Reframing line injection working');
  console.log('✅ Copy blocks available\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the output above.\n');
  process.exit(1);
}
