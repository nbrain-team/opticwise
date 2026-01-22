/**
 * Populate StyleGuide with Curated OpticWise Voice Examples
 * 
 * These examples are curated to match OpticWise's authentic voice:
 * - Direct and confident
 * - Strategic focus
 * - Short, punchy sentences
 * - No fluff
 * - Professional but not corporate
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

const styleExamples: StyleExample[] = [
  // FOLLOW-UP EXAMPLES
  {
    category: 'email',
    subcategory: 'follow_up',
    content: `Hey [Name],

Wanted to circle back on our conversation about digital infrastructure.

You mentioned concerns about vendor lock-in and data control. Here's what I'm thinking:

1. Start with a PPP Audit to see what you actually own vs. what vendors control
2. Map the gaps - usually it's network ownership and data access
3. Build a 90-day roadmap to shift control back to the asset

Most owners find they're paying for infrastructure they don't control. That changes the economics pretty fast.

Does that align with what you were thinking? Happy to walk through specifics this week.

Bill`,
    tone: 'professional-direct',
    author: 'Bill',
    context: 'Follow-up after discovery call about infrastructure ownership'
  },
  
  {
    category: 'email',
    subcategory: 'follow_up',
    content: `[Name],

Quick follow-up from last week.

You asked about the ROI timeline. Here's the reality:

- Infrastructure audit: 2-3 weeks
- Design phase: 30 days
- Implementation: 60-90 days depending on property count
- Payback: Usually 12-18 months through vendor consolidation and new revenue streams

The bigger win isn't the payback period. It's owning the infrastructure as the asset value compounds over time.

Let me know if you want to see the detailed breakdown. I can send over a few case studies from similar portfolios.

Bill`,
    tone: 'professional-confident',
    author: 'Bill',
    context: 'Follow-up addressing ROI and timeline questions'
  },

  {
    category: 'email',
    subcategory: 'follow_up',
    content: `[Name],

I've been thinking about what you said regarding tenant experience and AI readiness.

Here's the thing: you can't deliver either without owning the infrastructure layer.

Vendors will tell you their platform does it all. But if they own the network and control the data, you're building on rented land.

We see this pattern constantly - owners invest in "smart building" tech, then realize they can't access their own operational data or switch vendors without starting over.

Worth a conversation? I'm in [city] next week if you want to grab coffee.

Bill`,
    tone: 'strategic-casual',
    author: 'Bill',
    context: 'Follow-up on strategic infrastructure discussion'
  },

  // COLD OUTREACH EXAMPLES
  {
    category: 'email',
    subcategory: 'cold_outreach',
    content: `Hi [Name],

I came across [Company] and noticed you're managing [X properties/portfolio] in [market].

Quick question: who owns the digital infrastructure in your buildings - you or your vendors?

Most CRE owners don't realize they've given up control of their networks, data, and tenant connectivity. That's costing them NOI and limiting their AI readiness.

We work with owners to reclaim that control and turn infrastructure into a strategic asset, not a vendor dependency.

Would it make sense to have a 15-minute call to see if there's a fit?

Bill Douglas
OpticWise`,
    tone: 'professional-direct',
    author: 'Bill',
    context: 'First contact with potential client, infrastructure ownership focus'
  },

  {
    category: 'email',
    subcategory: 'cold_outreach',
    content: `[Name],

Saw your recent acquisition in [market]. Congrats.

As you're evaluating the digital infrastructure in that asset, one thing to look at: who actually owns the network and data layer?

In most buildings, vendors control both. That limits your NOI potential and creates vendor lock-in that compounds over time.

We help owners audit what they actually control vs. what they think they control. Usually eye-opening.

Worth a conversation?

Bill`,
    tone: 'confident-casual',
    author: 'Bill',
    context: 'First contact triggered by acquisition news'
  },

  // PROPOSAL EXAMPLES
  {
    category: 'email',
    subcategory: 'proposal',
    content: `[Name],

Here's the pricing breakdown for the [Property Name] infrastructure project:

**Phase 1: PPP Audit™**
- $25K one-time
- 2-3 week timeline
- Deliverable: Full ownership map + gap analysis

**Phase 2: Design & Implementation**
- $150K setup (network ownership, BoT integration, 5S wireless)
- $8K/month ongoing (management, optimization, support)
- 60-90 day timeline

**Expected Returns:**
- Vendor consolidation savings: ~$4-6K/month
- New connectivity revenue: ~$8-12K/month
- Net positive cash flow: Month 12-15

The way I see it, you're not buying technology. You're buying back control of an asset that should have been yours from day one.

Does this align with your budget expectations? Happy to adjust scope if needed.

Bill`,
    tone: 'professional-confident',
    author: 'Bill',
    context: 'Sending pricing and proposal details'
  },

  {
    category: 'email',
    subcategory: 'proposal',
    content: `[Name],

Attached is the proposal for your [X-property] portfolio.

Key numbers:
- Setup: $200K across all properties
- Monthly: $15K (covers all sites)
- Breakeven: 14 months
- 5-year NPV: $1.2M

Here's what changes:
1. You own the network infrastructure (not the vendors)
2. You control the operational data (not the platforms)
3. You capture the connectivity revenue (not the ISPs)

This isn't a technology project. It's an ownership transfer.

Let me know what questions you have. I can walk through the detailed breakdown on a call this week.

Bill`,
    tone: 'strategic-direct',
    author: 'Bill',
    context: 'Portfolio-level proposal with financial focus'
  },

  // TECHNICAL EXAMPLES
  {
    category: 'email',
    subcategory: 'technical',
    content: `[Name],

You asked about the technical architecture. Here's the simplified version:

**Layer 1: Network Ownership**
You own the physical network infrastructure. No vendor lock-in.

**Layer 2: BoT Integration**
We connect your building systems (HVAC, access, lighting) to your network. Data stays in your environment.

**Layer 3: 5S Wireless**
Consistent tenant connectivity across all properties. You control the service, not the ISP.

**Layer 4: Data & AI Layer**
Operational data flows to your systems. You decide what to do with it.

The key: each layer is vendor-agnostic. You can swap providers without rebuilding the foundation.

That's the difference between renting infrastructure and owning it.

Does this make sense? Happy to go deeper on any layer.

Bill`,
    tone: 'technical-clear',
    author: 'Bill',
    context: 'Explaining technical architecture and approach'
  },

  {
    category: 'email',
    subcategory: 'technical',
    content: `[Name],

On the integration question - yes, we can connect to your existing property management system.

Here's how it works:

1. We audit your current systems (HVAC, access control, property management, etc.)
2. Identify the data endpoints and APIs
3. Build the integration layer through BoT
4. Data flows to your dashboard in real-time

No rip-and-replace. We work with what you have and add the ownership layer on top.

The goal isn't more technology. It's more control.

Let me know if you want to see a technical diagram. I can have our team put one together for your specific stack.

Bill`,
    tone: 'technical-practical',
    author: 'Bill',
    context: 'Addressing integration and compatibility questions'
  },

  // RELATIONSHIP EXAMPLES
  {
    category: 'email',
    subcategory: 'relationship',
    content: `[Name],

I'll be in [city] next week for a few days.

You game for breakfast or lunch? Would be good to catch up.

No agenda - just want to hear what you're working on and see if there's anything we can help with.

Let me know what works.

Bill`,
    tone: 'casual-warm',
    author: 'Bill',
    context: 'Casual check-in and relationship building'
  },

  {
    category: 'email',
    subcategory: 'relationship',
    content: `[Name],

Saw your post about [topic/news]. Congrats on [achievement/milestone].

Quick thought: as you're scaling the portfolio, keep an eye on who owns the infrastructure layer. That's where most owners lose leverage without realizing it.

Happy to share what we're seeing in the market if it's helpful.

Either way, congrats again.

Bill`,
    tone: 'casual-professional',
    author: 'Bill',
    context: 'Relationship building triggered by social media or news'
  },

  // STRATEGIC EXAMPLES
  {
    category: 'email',
    subcategory: 'follow_up',
    content: `[Name],

I've been thinking about your AI readiness question.

Here's the reality: you can't be AI-ready without owning your data infrastructure.

Every "smart building" platform promises AI capabilities. But if you don't own the network and control the data layer, you're building on rented land.

When that vendor changes their model or gets acquired, you start over.

We see this constantly - owners invest millions in technology, then realize they can't access their own operational data or switch vendors without losing everything.

The fix: own the infrastructure layer first. Then add intelligence on top.

That's the only way to build compounding advantage instead of vendor dependency.

Worth exploring?

Bill`,
    tone: 'strategic-direct',
    author: 'Bill',
    context: 'Strategic discussion about AI readiness and infrastructure ownership'
  },
];

async function populateStyleGuide() {
  console.log('🎨 Populating StyleGuide with OpticWise voice examples...\n');

  console.log(`📊 Found ${styleExamples.length} curated examples to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const [index, example] of styleExamples.entries()) {
    try {
      console.log(`Processing ${index + 1}/${styleExamples.length}: ${example.category}/${example.subcategory} (${example.tone})`);

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
      await new Promise(resolve => setTimeout(resolve, 200));

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
  console.log('   1. Test the style examples with: npm run brand:test');
  console.log('   2. Update AI endpoints to use StyleGuide');
  console.log('   3. Deploy to production\n');
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
