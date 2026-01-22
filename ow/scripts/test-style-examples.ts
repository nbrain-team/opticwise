/**
 * Test StyleGuide Examples
 * 
 * This script tests the StyleGuide functionality by:
 * 1. Querying style examples from the database
 * 2. Generating sample AI responses with and without style examples
 * 3. Comparing the outputs to show the difference
 * 
 * Usage:
 *   npx tsx scripts/test-style-examples.ts
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import { getStyleExamples } from '../lib/ai-agent-utils';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const testScenarios = [
  {
    name: 'Follow-up Email',
    category: 'email',
    subcategory: 'follow_up',
    prompt: 'Write a follow-up email to a prospect we met last week about implementing our data infrastructure solution. They mentioned concerns about integration complexity.',
  },
  {
    name: 'Cold Outreach',
    category: 'email',
    subcategory: 'cold_outreach',
    prompt: 'Write a cold outreach email to a commercial real estate company about our digital infrastructure platform.',
  },
  {
    name: 'Proposal Discussion',
    category: 'email',
    subcategory: 'proposal',
    prompt: 'Write an email presenting pricing for a 5-property pilot project. The monthly cost is $12K with a $50K setup fee.',
  },
];

async function testStyleExamples() {
  console.log('🧪 Testing StyleGuide Examples\n');
  console.log('='.repeat(80) + '\n');

  // First, check if StyleGuide has data
  const countResult = await pool.query('SELECT COUNT(*) as count FROM "StyleGuide"');
  const totalExamples = parseInt(countResult.rows[0].count);

  if (totalExamples === 0) {
    console.error('❌ StyleGuide table is empty!');
    console.log('\n📋 Run populate-style-guide.ts first to add examples.\n');
    process.exit(1);
  }

  console.log(`✅ Found ${totalExamples} style examples in database\n`);

  // Test each scenario
  for (const scenario of testScenarios) {
    console.log('='.repeat(80));
    console.log(`📧 Scenario: ${scenario.name}`);
    console.log('='.repeat(80) + '\n');

    // Get style examples
    const styleExamples = await getStyleExamples(
      scenario.category,
      scenario.subcategory,
      pool,
      openai,
      3
    );

    if (styleExamples.length === 0) {
      console.log(`⚠️  No style examples found for ${scenario.category}/${scenario.subcategory}`);
      console.log('   Skipping this scenario...\n');
      continue;
    }

    console.log(`📚 Retrieved ${styleExamples.length} style examples\n`);

    // Generate WITHOUT style examples (baseline)
    console.log('🤖 Generating WITHOUT style examples (baseline)...\n');
    const baselineResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Bill from OpticWise. Write professional, direct emails.`,
        },
        {
          role: 'user',
          content: scenario.prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const baselineOutput = baselineResponse.choices[0].message.content;
    console.log('📄 BASELINE OUTPUT (No Style Examples):');
    console.log('-'.repeat(80));
    console.log(baselineOutput);
    console.log('-'.repeat(80) + '\n');

    // Generate WITH style examples
    console.log('🎨 Generating WITH style examples...\n');
    const styledPrompt = `
**STYLE REFERENCE EXAMPLES:**

${styleExamples.join('\n\n---\n\n')}

**INSTRUCTIONS:**
1. Study the examples above carefully
2. Match the tone, structure, and language patterns
3. Use similar sentence lengths and paragraph breaks
4. Adopt the same level of directness and warmth
5. Mirror the opening and closing styles
6. Use similar vocabulary and phrasing

**TASK:** ${scenario.prompt}
`;

    const styledResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Bill from OpticWise. Match the style shown in the examples.`,
        },
        {
          role: 'user',
          content: styledPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const styledOutput = styledResponse.choices[0].message.content;
    console.log('📄 STYLED OUTPUT (With Style Examples):');
    console.log('-'.repeat(80));
    console.log(styledOutput);
    console.log('-'.repeat(80) + '\n');

    // Analysis
    console.log('📊 ANALYSIS:');
    console.log('-'.repeat(80));
    
    const baselineHasRoboticPhrases = checkForRoboticPhrases(baselineOutput || '');
    const styledHasRoboticPhrases = checkForRoboticPhrases(styledOutput || '');
    
    console.log(`Baseline robotic phrases: ${baselineHasRoboticPhrases.length > 0 ? '❌ ' + baselineHasRoboticPhrases.join(', ') : '✅ None'}`);
    console.log(`Styled robotic phrases: ${styledHasRoboticPhrases.length > 0 ? '❌ ' + styledHasRoboticPhrases.join(', ') : '✅ None'}`);
    
    console.log(`\nBaseline length: ${baselineOutput?.length || 0} characters`);
    console.log(`Styled length: ${styledOutput?.length || 0} characters`);
    
    console.log('-'.repeat(80) + '\n\n');

    // Delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('='.repeat(80));
  console.log('✅ Testing complete!\n');
  console.log('📋 Review the outputs above to see the difference style examples make.\n');
  console.log('💡 Tips:');
  console.log('   - Styled outputs should sound more natural and authentic');
  console.log('   - Look for fewer robotic phrases in styled outputs');
  console.log('   - Styled outputs should match the tone of your examples\n');
}

function checkForRoboticPhrases(text: string): string[] {
  const roboticPhrases = [
    'Based on my knowledge',
    'According to my analysis',
    'I have analyzed',
    'Let me provide you with',
    'I would recommend that you',
    'Based on your recent activity',
    'I hope this email finds you well',
    'Please let me know if you have any questions',
    'Thank you for your time and consideration',
    'I look forward to hearing from you',
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of roboticPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }

  return found;
}

// Run the test
testStyleExamples()
  .then(() => {
    console.log('✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
