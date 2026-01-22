/**
 * Populate StyleGuide Table with Brand Voice Examples
 * 
 * This script populates the StyleGuide table with curated email examples
 * that represent OpticWise' authentic communication style.
 * 
 * Usage:
 *   1. Review and curate examples using extract-email-examples.ts
 *   2. Add curated examples to the styleExamples array below
 *   3. Run: npx tsx scripts/populate-style-guide.ts
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface StyleExample {
  category: string;
  subcategory: string;
  content: string;
  tone: string;
  author: string;
  context?: string;
}

/**
 * CURATED STYLE EXAMPLES
 * 
 * Add your curated email examples here after reviewing the output
 * from extract-email-examples.ts
 * 
 * Each example should be a real email that exemplifies the brand voice.
 */
const styleExamples: StyleExample[] = [
  // EXAMPLE FORMAT - Replace with actual curated emails
  {
    category: 'email',
    subcategory: 'follow_up',
    content: `Hey [Name],

Just wanted to circle back on our conversation from last week about the data infrastructure project.

I've been thinking about what you mentioned regarding the integration challenges. Here's what I'd recommend:

1. Start with a pilot on one property to prove the ROI
2. Use that data to build the business case for the full rollout
3. We can have this up and running in 30-45 days

The way I see it, you're looking at about $50K for the pilot, but the monthly recurring revenue potential is $8-12K once it's scaled across the portfolio.

Does that align with what you were thinking? Happy to jump on a call this week to walk through the details.

Bill`,
    tone: 'professional-casual',
    author: 'Bill',
    context: 'Follow-up after initial discovery call, technical project discussion'
  },

  // ADD MORE EXAMPLES HERE
  // Copy the format above and add 30-50 curated examples
  // from your email extraction review

  // COLD OUTREACH EXAMPLES
  // {
  //   category: 'email',
  //   subcategory: 'cold_outreach',
  //   content: `[Your curated cold outreach email]`,
  //   tone: 'professional-direct',
  //   author: 'Bill',
  //   context: 'First contact with potential client'
  // },

  // PROPOSAL EXAMPLES
  // {
  //   category: 'email',
  //   subcategory: 'proposal',
  //   content: `[Your curated proposal email]`,
  //   tone: 'professional-confident',
  //   author: 'Bill',
  //   context: 'Sending pricing and proposal details'
  // },

  // TECHNICAL EXAMPLES
  // {
  //   category: 'email',
  //   subcategory: 'technical',
  //   content: `[Your curated technical email]`,
  //   tone: 'professional-educational',
  //   author: 'Bill',
  //   context: 'Explaining technical concepts or implementation'
  // },

  // RELATIONSHIP EXAMPLES
  // {
  //   category: 'email',
  //   subcategory: 'relationship',
  //   content: `[Your curated relationship email]`,
  //   tone: 'casual-warm',
  //   author: 'Bill',
  //   context: 'Casual check-in or relationship building'
  // },
];

async function populateStyleGuide() {
  console.log('🎨 Populating StyleGuide with brand voice examples...\n');

  if (styleExamples.length === 0) {
    console.error('❌ No style examples found!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run extract-email-examples.ts to extract candidates');
    console.log('   2. Review the generated files in ./style-examples-review/');
    console.log('   3. Add curated examples to the styleExamples array in this file');
    console.log('   4. Run this script again\n');
    process.exit(1);
  }

  console.log(`📊 Found ${styleExamples.length} examples to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const [index, example] of styleExamples.entries()) {
    try {
      console.log(`Processing ${index + 1}/${styleExamples.length}: ${example.category}/${example.subcategory}`);

      // Generate embedding for the example
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: example.content,
        dimensions: 1024,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Insert into StyleGuide table
      await pool.query(
        `INSERT INTO "StyleGuide" 
         (category, subcategory, content, tone, author, context, embedding, vectorized, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
        [
          example.category,
          example.subcategory,
          example.content,
          example.tone,
          example.author,
          example.context || null,
          `[${embedding.join(',')}]`,
        ]
      );

      console.log(`   ✅ Added successfully\n`);
      successCount++;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Error adding example:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Population Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Total: ${styleExamples.length}\n`);

  // Query and display the current state
  const statsResult = await pool.query(`
    SELECT 
      category, 
      subcategory, 
      COUNT(*) as count,
      AVG("usageCount") as avg_usage
    FROM "StyleGuide"
    GROUP BY category, subcategory
    ORDER BY category, subcategory;
  `);

  if (statsResult.rows.length > 0) {
    console.log('📋 StyleGuide Contents:');
    console.log('='.repeat(60));
    statsResult.rows.forEach(row => {
      console.log(`   ${row.category}/${row.subcategory}: ${row.count} examples (avg usage: ${row.avg_usage})`);
    });
    console.log('');
  }

  console.log('🎉 StyleGuide population complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Test the style examples with: npx tsx scripts/test-style-examples.ts');
  console.log('   2. Deploy the updated AI endpoints to use StyleGuide');
  console.log('   3. Monitor voice consistency with: npx tsx scripts/monitor-voice-consistency.ts\n');
}

// Run the population
populateStyleGuide()
  .then(() => {
    console.log('✅ Population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Population failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
