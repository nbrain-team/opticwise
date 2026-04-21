/**
 * Generate Agent Test Responses
 * Since we can't call the live API, we'll generate responses using the brandscript
 * to simulate what the agent would produce
 */

import Anthropic from '@anthropic-ai/sdk';
import { generateBrandScriptPrompt } from '../lib/brandscript-prompt';
import * as fs from 'fs';

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

interface TestResponse {
  questionNumber: number;
  question: string;
  response: string;
  timestamp: string;
  category: string;
}

async function generateResponse(question: string, questionNumber: number): Promise<TestResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment');
  }

  const anthropic = new Anthropic({ apiKey });
  
  const brandScriptPrompt = generateBrandScriptPrompt({
    isDeepAnalysis: false,
    currentDate: new Date()
  });

  const systemPrompt = brandScriptPrompt + `\n\n**AVAILABLE INFORMATION:**\n(You are answering general questions about OpticWise - no specific customer data available for this query)`;

  console.log(`\n[${questionNumber}/25] Generating response for:`);
  console.log(`Q: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}\n`);

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: question
      }
    ]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  // Categorize the question
  let category = 'General';
  if (question.toLowerCase().includes('ppp') || question.toLowerCase().includes('audit') || question.toLowerCase().includes('framework')) {
    category = 'PPP/Framework';
  } else if (question.toLowerCase().includes('noi') || question.toLowerCase().includes('roi') || question.toLowerCase().includes('cost') || question.toLowerCase().includes('money')) {
    category = 'Financial/ROI';
  } else if (question.toLowerCase().includes('data') || question.toLowerCase().includes('ai')) {
    category = 'Data/AI';
  } else if (question.toLowerCase().includes('security') || question.toLowerCase().includes('privacy')) {
    category = 'Security/Privacy';
  } else if (question.toLowerCase().includes('vendor') || question.toLowerCase().includes('contract')) {
    category = 'Vendor Management';
  } else if (question.toLowerCase().includes('tenant') || question.toLowerCase().includes('resident') || question.toLowerCase().includes('retention')) {
    category = 'Tenant Experience';
  } else if (question.toLowerCase().includes('implementation') || question.toLowerCase().includes('timeline')) {
    category = 'Implementation';
  } else if (question.toLowerCase().includes('wi-fi') || question.toLowerCase().includes('connectivity') || question.toLowerCase().includes('isp')) {
    category = 'Technical/Infrastructure';
  }

  console.log(`✅ Response generated (${response.length} characters) - Category: ${category}\n`);

  return {
    questionNumber,
    question,
    response,
    timestamp: new Date().toISOString(),
    category
  };
}

async function generateAllResponses() {
  console.log('🧪 Generating Agent Test Responses...\n');
  console.log(`Generating responses for ${QUESTIONS.length} questions using BrandScript\n`);
  console.log('=' .repeat(80) + '\n');

  const responses: TestResponse[] = [];

  for (let i = 0; i < QUESTIONS.length; i++) {
    try {
      const response = await generateResponse(QUESTIONS[i], i + 1);
      responses.push(response);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error generating response ${i + 1}:`, error);
      responses.push({
        questionNumber: i + 1,
        question: QUESTIONS[i],
        response: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        category: 'Error'
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Response generation complete!\n');

  // Save results
  fs.writeFileSync('./agent-test-responses.json', JSON.stringify(responses, null, 2));
  console.log(`📝 Responses saved to: ./agent-test-responses.json\n`);

  // Generate summary
  const successCount = responses.filter(r => !r.response.startsWith('ERROR')).length;
  const categories = [...new Set(responses.map(r => r.category))];
  
  console.log('📊 Summary:');
  console.log(`  - Total questions: ${QUESTIONS.length}`);
  console.log(`  - Successful: ${successCount}`);
  console.log(`  - Categories: ${categories.join(', ')}`);

  return responses;
}

// Run
generateAllResponses().catch(console.error);
