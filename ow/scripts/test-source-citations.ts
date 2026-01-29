/**
 * Test Source Citations Feature
 * 
 * Tests the source citation formatting and confidence score display
 */

import { formatSourceCitations, type ContextSource, type SourceCitation } from '../lib/ai-agent-utils';

console.log('🧪 Testing Source Citations Feature\n');
console.log('='.repeat(80));

// Create mock context sources with citations
const mockContexts: ContextSource[] = [
  {
    type: 'transcript',
    content: 'Call transcript content...',
    metadata: { chunkCount: 2 },
    tokenCount: 1500,
    sources: [
      {
        id: 'transcript-1',
        type: 'transcript',
        title: 'Discovery Call with Acme Corp',
        date: '1/15/2026',
        confidence: 0.95,
        preview: 'We discussed their infrastructure needs for the new office building. They mentioned budget approval...',
        metadata: {
          chunkIndex: 1,
          wordCount: 450
        }
      },
      {
        id: 'transcript-2',
        type: 'transcript',
        title: 'Follow-up Call - Acme Technical Review',
        date: '1/20/2026',
        confidence: 0.88,
        preview: 'Technical team asked about fiber capacity and redundancy options. Pricing discussion scheduled...',
        metadata: {
          chunkIndex: 2,
          wordCount: 380
        }
      }
    ]
  },
  {
    type: 'email',
    content: 'Email content...',
    metadata: { emailCount: 3 },
    tokenCount: 2000,
    sources: [
      {
        id: 'email-1',
        type: 'email',
        title: 'Re: Proposal Questions',
        date: '1/18/2026',
        author: 'john.smith@acmecorp.com',
        confidence: 0.92,
        preview: 'Thanks for the detailed proposal. We have a few questions about the implementation timeline and...',
        metadata: {
          contact: 'John Smith',
          company: 'Acme Corp'
        }
      },
      {
        id: 'email-2',
        type: 'email',
        title: 'Pricing Clarification',
        date: '1/22/2026',
        author: 'sarah.jones@acmecorp.com',
        confidence: 0.85,
        preview: 'Could you break down the monthly recurring costs vs one-time installation fees? Our CFO needs...',
        metadata: {
          contact: 'Sarah Jones',
          company: 'Acme Corp'
        }
      },
      {
        id: 'email-3',
        type: 'email',
        title: 'Meeting Confirmation',
        date: '1/25/2026',
        author: 'john.smith@acmecorp.com',
        confidence: 0.78,
        preview: 'Confirmed for next Tuesday at 2pm. Please bring technical specs for the fiber installation...'
      }
    ]
  },
  {
    type: 'crm',
    content: 'CRM data...',
    metadata: { dealCount: 2 },
    tokenCount: 500,
    sources: [
      {
        id: 'deal-1',
        type: 'crm',
        title: 'Acme Corp - Office Infrastructure',
        date: '1/10/2026',
        confidence: 1.0,
        preview: 'USD 250,000 - Proposal',
        metadata: {
          value: 250000,
          currency: 'USD',
          stage: 'Proposal',
          organization: 'Acme Corp',
          contact: 'John Smith'
        }
      },
      {
        id: 'deal-2',
        type: 'crm',
        title: 'Acme Corp - Managed Services',
        date: '1/15/2026',
        confidence: 1.0,
        preview: 'USD 50,000 - Discovery',
        metadata: {
          value: 50000,
          currency: 'USD',
          stage: 'Discovery',
          organization: 'Acme Corp',
          contact: 'Sarah Jones'
        }
      }
    ]
  }
];

console.log('\n📋 Test Case: Format Source Citations\n');

try {
  const formatted = formatSourceCitations(mockContexts);
  
  console.log('✅ Source citations formatted successfully!\n');
  console.log('📄 Formatted Output:\n');
  console.log(formatted);
  
  // Validate output
  const validations = [
    { check: formatted.includes('## 📚 Sources'), name: 'Has sources header' },
    { check: formatted.includes('🎙️ Call Transcripts'), name: 'Has transcripts section' },
    { check: formatted.includes('📧 Emails'), name: 'Has emails section' },
    { check: formatted.includes('📇 CRM Data'), name: 'Has CRM section' },
    { check: formatted.includes('Relevance: 95%'), name: 'Shows confidence scores' },
    { check: formatted.includes('🟢'), name: 'Has high relevance emoji' },
    { check: formatted.includes('🟡'), name: 'Has medium relevance emoji' },
    { check: formatted.includes('Discovery Call with Acme Corp'), name: 'Shows transcript title' },
    { check: formatted.includes('john.smith@acmecorp.com'), name: 'Shows email author' },
    { check: formatted.includes('USD 250,000'), name: 'Shows CRM value' },
    { check: formatted.includes('Relevance Score Legend'), name: 'Has legend' }
  ];
  
  console.log('\n📊 Validation Results:\n');
  
  let passed = 0;
  let failed = 0;
  
  validations.forEach((validation, index) => {
    if (validation.check) {
      console.log(`✅ ${index + 1}. ${validation.name}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${validation.name}`);
      failed++;
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary\n');
  console.log(`Total Validations: ${validations.length}`);
  console.log(`✅ Passed: ${passed} (${Math.round(passed / validations.length * 100)}%)`);
  console.log(`❌ Failed: ${failed} (${Math.round(failed / validations.length * 100)}%)`);
  
  if (failed === 0) {
    console.log('\n🎉 All validations passed! Source citations feature is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Review the output above.\n');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error formatting source citations:', error);
  process.exit(1);
}
