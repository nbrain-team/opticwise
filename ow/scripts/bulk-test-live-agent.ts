/**
 * Bulk Test Live Agent - Production API
 * 
 * This script tests all 25 questions against the LIVE OWnet agent
 * and exports results to CSV for client review
 */

import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_URL = 'https://ownet.opticwise.com';

const QUESTIONS = [
  {
    id: 1,
    category: 'Financial/ROI',
    question: "We're spending $180K annually on managed Wi-Fi across our portfolio. How would OpticWise's approach be different from what we have now, and would it actually save us money?"
  },
  {
    id: 2,
    category: 'Technical/Infrastructure',
    question: "Our residents keep complaining about Wi-Fi dead zones and slow speeds in their units. How does OpticWise solve connectivity issues that our current ISP can't seem to fix?"
  },
  {
    id: 3,
    category: 'Technical/Infrastructure',
    question: "I keep hearing about \"digital infrastructure\" versus just having good internet. What's the actual difference, and why should I care as a building owner?"
  },
  {
    id: 4,
    category: 'Vendor Management',
    question: "We have 8 different vendors managing different systems in our buildings - HVAC, access control, cameras, Wi-Fi. How does OpticWise help me get control over all of this?"
  },
  {
    id: 5,
    category: 'PPP/Framework',
    question: "What exactly is a PPP Audit, and what would you actually find if you did one at my property?"
  },
  {
    id: 6,
    category: 'PPP/Framework',
    question: "I don't understand the \"Building of Things\" concept. Can you explain it in plain English and tell me what problem it solves?"
  },
  {
    id: 7,
    category: 'Implementation/Operations',
    question: "Our current ISP gave us free equipment and installation. Why would I pay OpticWise when I'm getting this for free?"
  },
  {
    id: 8,
    category: 'Financial/ROI',
    question: "How does OpticWise help me increase NOI? I need specifics, not just \"better tenant experience.\""
  },
  {
    id: 9,
    category: 'Implementation/Operations',
    question: "We're a 250-unit multifamily property. What would implementation actually look like - timeline, disruption, cost?"
  },
  {
    id: 10,
    category: 'Implementation/Operations',
    question: "My property management team is already overwhelmed. Are you adding another system they have to learn and manage?"
  },
  {
    id: 11,
    category: 'Implementation/Operations',
    question: "What's the difference between what OpticWise does and what a typical PropTech vendor does?"
  },
  {
    id: 12,
    category: 'Data/AI',
    question: "You talk about \"data ownership.\" What data are you talking about, and why does it matter if I own it or not?"
  },
  {
    id: 13,
    category: 'Data/AI',
    question: "How does OpticWise make my building \"AI-ready\"? Everyone's talking about AI, but what does that actually mean for my property?"
  },
  {
    id: 14,
    category: 'Security/Privacy',
    question: "We're worried about cybersecurity and resident privacy. How does OpticWise handle security differently than our current setup?"
  },
  {
    id: 15,
    category: 'Technical/Infrastructure',
    question: "What is ElasticISP and how is it different from just having multiple internet providers?"
  },
  {
    id: 16,
    category: 'PPP/Framework',
    question: "Can you explain the PPP 5C Framework? I see it mentioned but don't understand what each step means for my building."
  },
  {
    id: 17,
    category: 'Financial/ROI',
    question: "We have a bulk internet agreement with our ISP that gives us revenue share. Would we lose that money if we work with OpticWise?"
  },
  {
    id: 18,
    category: 'Financial/ROI',
    question: "What's the actual ROI timeline? When would I start seeing financial returns on this investment?"
  },
  {
    id: 19,
    category: 'Tenant Experience',
    question: "How does OpticWise help with tenant retention? What's the connection between infrastructure and keeping residents?"
  },
  {
    id: 20,
    category: 'Implementation/Operations',
    question: "We're looking at ESG requirements and sustainability reporting. Does OpticWise help with that, and if so, how?"
  },
  {
    id: 21,
    category: 'Technical/Infrastructure',
    question: "What's the difference between the 5S User Experience and just having \"good Wi-Fi\"?"
  },
  {
    id: 22,
    category: 'Vendor Management',
    question: "I'm concerned about vendor lock-in. If I work with OpticWise, am I just trading one vendor dependency for another?"
  },
  {
    id: 23,
    category: 'Implementation/Operations',
    question: "We have a Class B office building with 15 different tenants. Each has their own IT requirements. How does OpticWise handle that complexity?"
  },
  {
    id: 24,
    category: 'Vendor Management',
    question: "What happens to my existing vendor contracts if I bring in OpticWise? Do I have to break agreements or can you work with what's already in place?"
  },
  {
    id: 25,
    category: 'Data/AI',
    question: "I'm being told by consultants that I need to \"future-proof\" my building. What does OpticWise actually do that makes a building future-proof versus just having modern systems?"
  }
];

interface AgentResponse {
  id: number;
  category: string;
  question: string;
  response: string;
  hasEmojis: boolean;
  sourcesCollapsed: boolean;
  responseTime: number;
  error?: string;
  timestamp: string;
}

async function callLiveAgent(question: string): Promise<{ response: string; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log('  → Calling live agent API...');
    
    const authToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWk0eHQ2OGowMDAwOG90MHY0d3lnYnN6IiwiZW1haWwiOiJiaWxsQG9wdGljd2lzZS5jb20iLCJpYXQiOjE3NzAzMjAxNTIsImV4cCI6MTc3MDkyNDk1Mn0.CQvRSA3WFf2PwqmXFzft2cSQJlI4M4dvN9SQthoBFC0';
    
    const response = await fetch(`${PRODUCTION_URL}/api/ownet/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `ow_auth=${authToken}`,
      },
      body: JSON.stringify({
        message: question,
        sessionId: `bulk-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body from API');
    }
    
    let fullResponse = '';
    const decoder = new TextDecoder();
    
    console.log('  → Streaming response...');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              fullResponse += data.text;
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Unknown error from agent');
            }
          } catch (parseError) {
            // Skip invalid JSON lines
          }
        }
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    if (!fullResponse) {
      throw new Error('Empty response from agent');
    }
    
    return {
      response: fullResponse,
      responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      response: '',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function checkForEmojis(text: string): boolean {
  // Check for common emojis used in the old format
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|📚|📧|📇|📅|📄|💬|🎙️|🟢|🟡|🟠|👤|📝|👥|💰|📊|📍|🔍|✨|🧠/u;
  return emojiPattern.test(text);
}

function checkSourcesCollapsed(text: string): boolean {
  // Check if sources use <details> tags (collapsible)
  return text.includes('<details>') && text.includes('<summary>');
}

async function runBulkTest(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     BULK AGENT TESTING - LIVE PRODUCTION API                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`Testing ${QUESTIONS.length} questions against: ${PRODUCTION_URL}\n`);
  console.log('═'.repeat(70) + '\n');
  
  const results: AgentResponse[] = [];
  const categoryStats: Record<string, { total: number; success: number; errors: number }> = {};
  
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    console.log(`\n[${i + 1}/${QUESTIONS.length}] Category: ${q.category}`);
    console.log(`Question: ${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}`);
    
    const { response, responseTime, error } = await callLiveAgent(q.question);
    
    const hasEmojis = response ? checkForEmojis(response) : false;
    const sourcesCollapsed = response ? checkSourcesCollapsed(response) : false;
    
    results.push({
      id: q.id,
      category: q.category,
      question: q.question,
      response,
      hasEmojis,
      sourcesCollapsed,
      responseTime,
      error,
      timestamp: new Date().toISOString()
    });
    
    // Update stats
    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { total: 0, success: 0, errors: 0 };
    }
    categoryStats[q.category].total++;
    if (error) {
      categoryStats[q.category].errors++;
      console.log(`  ✗ ERROR: ${error}`);
    } else {
      categoryStats[q.category].success++;
      console.log(`  ✓ Response received: ${response.length} chars, ${responseTime}ms`);
      if (hasEmojis) console.log('  ⚠ WARNING: Emojis detected in response!');
      if (!sourcesCollapsed) console.log('  ⚠ WARNING: Sources not collapsed!');
    }
    
    // Small delay between requests
    if (i < QUESTIONS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n✅ BULK TESTING COMPLETE\n');
  
  // Save JSON results
  const jsonPath = path.join(process.cwd(), 'bulk-test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`📁 JSON results saved: ${jsonPath}`);
  
  // Generate CSV
  const csvPath = path.join(process.cwd(), 'bulk-test-results.csv');
  generateCSV(results, csvPath);
  console.log(`📊 CSV results saved: ${csvPath}`);
  
  // Print summary
  printSummary(results, categoryStats);
}

function generateCSV(results: AgentResponse[], outputPath: string): void {
  const header = [
    'Question_ID',
    'Category',
    'Question',
    'Agent_Response',
    'Response_Time_MS',
    'Has_Emojis',
    'Sources_Collapsed',
    'Error',
    'Response_Length',
    'Timestamp'
  ];
  
  const rows = results.map(r => [
    r.id.toString(),
    `"${r.category}"`,
    `"${r.question.replace(/"/g, '""')}"`,
    `"${r.response.replace(/"/g, '""')}"`,
    r.responseTime.toString(),
    r.hasEmojis ? 'YES' : 'NO',
    r.sourcesCollapsed ? 'YES' : 'NO',
    r.error ? `"${r.error.replace(/"/g, '""')}"` : '',
    r.response.length.toString(),
    r.timestamp
  ]);
  
  const csv = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  fs.writeFileSync(outputPath, csv, 'utf-8');
}

function printSummary(results: AgentResponse[], categoryStats: Record<string, any>): void {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const totalQuestions = results.length;
  const successful = results.filter(r => !r.error).length;
  const errors = results.filter(r => r.error).length;
  const withEmojis = results.filter(r => r.hasEmojis).length;
  const withCollapsedSources = results.filter(r => r.sourcesCollapsed).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions
  );
  
  console.log('📊 Overall Statistics:');
  console.log(`   Total Questions: ${totalQuestions}`);
  console.log(`   Successful: ${successful} (${Math.round(successful/totalQuestions*100)}%)`);
  console.log(`   Errors: ${errors} (${Math.round(errors/totalQuestions*100)}%)`);
  console.log(`   Avg Response Time: ${avgResponseTime}ms\n`);
  
  console.log('🎨 Formatting Check:');
  console.log(`   Emojis Found: ${withEmojis} responses ${withEmojis > 0 ? '⚠️  ISSUE!' : '✓'}`);
  console.log(`   Sources Collapsed: ${withCollapsedSources}/${successful} ${withCollapsedSources === successful ? '✓' : '⚠️  ISSUE!'}\n`);
  
  console.log('📁 By Category:');
  Object.entries(categoryStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, stats]) => {
      console.log(`   ${category}:`);
      console.log(`      Success: ${stats.success}/${stats.total} | Errors: ${stats.errors}`);
    });
  
  console.log('\n' + '═'.repeat(70));
  
  if (errors > 0) {
    console.log('\n⚠️  ERRORS DETECTED:');
    results.filter(r => r.error).forEach(r => {
      console.log(`   Q${r.id}: ${r.error}`);
    });
  }
  
  if (withEmojis > 0) {
    console.log('\n⚠️  EMOJI ISSUES DETECTED:');
    results.filter(r => r.hasEmojis).forEach(r => {
      console.log(`   Q${r.id}: Contains emoji icons (should be removed)`);
    });
  }
  
  if (withCollapsedSources < successful) {
    console.log('\n⚠️  SOURCE FORMATTING ISSUES:');
    results.filter(r => !r.error && !r.sourcesCollapsed).forEach(r => {
      console.log(`   Q${r.id}: Sources not in collapsible format`);
    });
  }
  
  console.log('\n');
}

// Run the test
runBulkTest().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
