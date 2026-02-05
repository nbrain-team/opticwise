/**
 * Bulk Agent Testing Script
 * Tests 25 customer questions against the OWnet agent API
 */

const QUESTIONS = [
  "We're spending $180K annually on managed Wi-Fi across our portfolio. How would OpticWise's approach be different from what we have now, and would it actually save us money?",
  "Our residents keep complaining about Wi-Fi dead zones and slow speeds in their units. How does OpticWise solve connectivity issues that our current ISP can't seem to fix?",
  "I keep hearing about \"digital infrastructure\" versus just having good internet. What's the actual difference, and why should I care as a building owner?",
  "We have 8 different vendors managing different systems in our buildings - HVAC, access control, cameras, Wi-Fi. How does OpticWise help me get control over all of this?",
  "What exactly is a PPP Audit, and what would you actually find if you did one at my property?",
  "I don't understand the \"Building of Things\" concept. Can you explain it in plain English and tell me what problem it solves?",
  "Our current ISP gave us free equipment and installation. Why would I pay OpticWise when I'm getting this for free?",
  "How does OpticWise help me increase NOI? I need specifics, not just \"better tenant experience.\"",
  "We're a 250-unit multifamily property. What would implementation actually look like - timeline, disruption, cost?",
  "My property management team is already overwhelmed. Are you adding another system they have to learn and manage?",
  "What's the difference between what OpticWise does and what a typical PropTech vendor does?",
  "You talk about \"data ownership.\" What data are you talking about, and why does it matter if I own it or not?",
  "How does OpticWise make my building \"AI-ready\"? Everyone's talking about AI, but what does that actually mean for my property?",
  "We're worried about cybersecurity and resident privacy. How does OpticWise handle security differently than our current setup?",
  "What is ElasticISP and how is it different from just having multiple internet providers?",
  "Can you explain the PPP 5C Framework? I see it mentioned but don't understand what each step means for my building.",
  "We have a bulk internet agreement with our ISP that gives us revenue share. Would we lose that money if we work with OpticWise?",
  "What's the actual ROI timeline? When would I start seeing financial returns on this investment?",
  "How does OpticWise help with tenant retention? What's the connection between infrastructure and keeping residents?",
  "We're looking at ESG requirements and sustainability reporting. Does OpticWise help with that, and if so, how?",
  "What's the difference between the 5S User Experience and just having \"good Wi-Fi\"?",
  "I'm concerned about vendor lock-in. If I work with OpticWise, am I just trading one vendor dependency for another?",
  "We have a Class B office building with 15 different tenants. Each has their own IT requirements. How does OpticWise handle that complexity?",
  "What happens to my existing vendor contracts if I bring in OpticWise? Do I have to break agreements or can you work with what's already in place?",
  "I'm being told by consultants that I need to \"future-proof\" my building. What does OpticWise actually do that makes a building future-proof versus just having modern systems?"
];

interface TestResult {
  questionNumber: number;
  question: string;
  response: string;
  sources?: any;
  error?: string;
  timestamp: string;
  responseTime: number;
}

async function callOWnetAgent(message: string): Promise<{ response: string; sources?: any; error?: string }> {
  const startTime = Date.now();
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://opticwise-frontend.onrender.com';
    
    const response = await fetch(`${baseUrl}/api/ownet/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: `bulk-test-${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    let fullResponse = '';
    let sources: any = undefined;
    const decoder = new TextDecoder();
    
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
            } else if (data.type === 'complete') {
              sources = data.sources;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
    
    return {
      response: fullResponse,
      sources
    };
  } catch (error) {
    console.error('Error calling OWnet agent:', error);
    return {
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runBulkTest() {
  console.log('🧪 Starting Bulk Agent Testing...\n');
  console.log(`Testing ${QUESTIONS.length} questions\n`);
  console.log('=' .repeat(80) + '\n');
  
  const results: TestResult[] = [];
  
  for (let i = 0; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i];
    console.log(`\n[${i + 1}/${QUESTIONS.length}] Testing question...`);
    console.log(`Q: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}\n`);
    
    const startTime = Date.now();
    const { response, sources, error } = await callOWnetAgent(question);
    const responseTime = Date.now() - startTime;
    
    results.push({
      questionNumber: i + 1,
      question,
      response,
      sources,
      error,
      timestamp: new Date().toISOString(),
      responseTime
    });
    
    if (error) {
      console.log(`❌ Error: ${error}`);
    } else {
      console.log(`✅ Response received (${responseTime}ms)`);
      console.log(`Response length: ${response.length} characters`);
      if (sources) {
        console.log(`Sources: ${JSON.stringify(sources).substring(0, 100)}...`);
      }
    }
    
    // Small delay between requests to avoid overloading
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Bulk testing complete!\n');
  
  // Save results to file
  const fs = require('fs');
  const outputPath = './bulk-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📝 Results saved to: ${outputPath}\n`);
  
  // Generate summary
  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.filter(r => r.error).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  
  console.log('📊 Summary:');
  console.log(`  - Total questions: ${QUESTIONS.length}`);
  console.log(`  - Successful: ${successCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`  - Avg response time: ${Math.round(avgResponseTime)}ms`);
  
  return results;
}

// Run the test
runBulkTest().catch(console.error);
