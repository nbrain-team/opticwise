# Brand Voice Enhancement Proposal
## Leveraging Your Vectorized Content for Authentic AI Outputs

**Date:** January 22, 2026  
**Status:** Proposal - Ready for Implementation  
**Priority:** High Impact

---

## 🎯 Executive Summary

You've successfully vectorized thousands of content pieces (emails, documents, transcripts) into your Pinecone database. Now it's time to leverage this data to make your AI agent sound authentically like OpticWise, not a generic AI assistant.

**The Problem:**
- AI outputs still use phrases like "Based on my knowledge..." and "According to my analysis..."
- Responses don't fully match OpticWise' communication style
- The StyleGuide table exists but is **empty** - it was built but never populated
- Brand voice function (`getStyleExamples()`) exists but has no data to pull from

**The Solution:**
A comprehensive 3-phase approach to extract, analyze, and deploy OpticWise' authentic voice across all AI outputs.

---

## 📊 Current State Analysis

### What's Already Built ✅

1. **StyleGuide Database Table** - Schema exists with proper indexes
   - Fields: category, subcategory, content, tone, author, embedding
   - Vector search capability (1024-dimensional embeddings)
   - Usage tracking built-in

2. **Style Matching Function** - `getStyleExamples()` in `ai-agent-utils.ts`
   - Retrieves style examples by category/subcategory
   - Returns formatted examples for prompt injection
   - Ready to use, just needs data

3. **Vector Database** - Thousands of content pieces already embedded
   - Emails in GmailMessage table (vectorized)
   - Transcripts in Pinecone (vectorized)
   - Documents in DriveFile table (vectorized)

4. **Natural Language Guidelines** - Already implemented in OWnet
   - Avoids robotic phrases
   - Uses conversational language
   - But still generic, not brand-specific

### What's Missing ❌

1. **No Style Examples in StyleGuide** - Table is empty
2. **No Brand Voice Injection** - Style examples not pulled into prompts
3. **No Voice Analysis** - Haven't extracted patterns from existing content
4. **No Email-Specific Tuning** - Sales inbox AI doesn't use StyleGuide

---

## 🚀 Proposed Solution: 3-Phase Implementation

### **Phase 1: Voice Extraction & Analysis** (Week 1)
*Extract and analyze OpticWise' authentic voice from existing content*

#### 1.1 Mine Best Email Examples
**Goal:** Find 30-50 high-quality email examples that represent the brand

**Process:**
```typescript
// Query sent emails (OUTGOING) with high engagement
SELECT 
  subject, body, "from", "to", date,
  LENGTH(body) as length
FROM "GmailMessage"
WHERE direction = 'OUTGOING'
  AND "from" ILIKE '%newbury%' OR "from" ILIKE '%bill%'
  AND LENGTH(body) BETWEEN 200 AND 2000  -- Sweet spot
  AND date > NOW() - INTERVAL '6 months'  -- Recent
ORDER BY date DESC
LIMIT 100;
```

**Manual Curation:**
- Review top 100 emails
- Select 30-50 that best represent:
  - Cold outreach
  - Follow-ups
  - Proposal discussions
  - Technical explanations
  - Relationship building
  - Closing conversations

**Categories to Create:**
- `email/cold_outreach` - First contact emails
- `email/follow_up` - Check-in and follow-up emails
- `email/proposal` - Proposal and pricing discussions
- `email/technical` - Technical explanations
- `email/relationship` - Relationship building and casual check-ins

#### 1.2 Extract Transcript Voice Patterns
**Goal:** Identify how OpticWise speaks in conversations

**Process:**
```typescript
// Query high-quality transcript chunks from Pinecone
// Filter for chunks where Bill/team is speaking (not prospect)
// Look for:
// - Common phrases and expressions
// - Sentence structure patterns
// - Technical terminology usage
// - Tone indicators (humor, directness, empathy)
```

**Extract Patterns:**
- Opening phrases ("Here's what I'm thinking...")
- Transition words ("The way I see it...")
- Closing patterns ("Let me know what you think")
- Technical explanations style
- Question asking patterns

#### 1.3 Analyze Writing Style Attributes
**Goal:** Document specific style characteristics

**Create Style Profile:**
```markdown
NEWBURY PARTNERS VOICE PROFILE

Tone Attributes:
- Confidence Level: High (but not arrogant)
- Formality: Professional-casual blend
- Directness: Very direct, no fluff
- Warmth: Present but not overly friendly
- Humor: Occasional, dry wit

Structural Patterns:
- Paragraph Length: 1-3 sentences typically
- Sentence Length: Mix of short punchy and medium
- Opening Style: Direct, often starts with context
- Closing Style: Clear next step or question

Language Patterns:
- Contractions: Frequent (you're, we're, it's)
- Industry Jargon: Used appropriately, not excessively
- Questions: Often rhetorical or thought-provoking
- Emphasis: Bold for key points, not excessive

Signature Phrases:
- "Here's the thing..."
- "The way I see it..."
- "Let me know what you think"
- "Does that make sense?"
- "Happy to discuss further"

Avoid:
- "I hope this email finds you well"
- "Please let me know if you have any questions"
- "Thank you for your time and consideration"
- "I look forward to hearing from you"
- Any AI-sounding phrases
```

---

### **Phase 2: StyleGuide Population** (Week 1-2)
*Populate the StyleGuide table with curated examples*

#### 2.1 Create Population Script
**File:** `/ow/scripts/populate-style-guide.ts`

```typescript
import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
  {
    category: 'email',
    subcategory: 'cold_outreach',
    content: `[ACTUAL EMAIL EXAMPLE FROM CURATION]`,
    tone: 'professional-direct',
    author: 'Bill',
    context: 'First contact with potential client, technical focus'
  },
  // ... 30-50 more examples
];

async function populateStyleGuide() {
  for (const example of styleExamples) {
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: example.content,
      dimensions: 1024,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Insert into StyleGuide
    await pool.query(
      `INSERT INTO "StyleGuide" 
       (category, subcategory, content, tone, author, context, embedding, vectorized)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [
        example.category,
        example.subcategory,
        example.content,
        example.tone,
        example.author,
        example.context,
        `[${embedding.join(',')}]`
      ]
    );
    
    console.log(`✅ Added: ${example.category}/${example.subcategory}`);
  }
  
  console.log(`\n🎉 Successfully populated ${styleExamples.length} style examples`);
}

populateStyleGuide();
```

#### 2.2 Populate with Curated Examples
**Action Items:**
1. Run email extraction queries
2. Manually review and select best 30-50 examples
3. Categorize each example
4. Add to `styleExamples` array in script
5. Run population script
6. Verify in database

**Verification Query:**
```sql
SELECT 
  category, 
  subcategory, 
  COUNT(*) as count,
  AVG("usageCount") as avg_usage
FROM "StyleGuide"
GROUP BY category, subcategory
ORDER BY category, subcategory;
```

---

### **Phase 3: Integration & Deployment** (Week 2)
*Integrate StyleGuide into all AI output endpoints*

#### 3.1 Update OWnet Agent (`/api/ownet/chat/route.ts`)

**Current State:** Generic natural language guidelines  
**New State:** Brand-specific voice injection

**Changes:**
```typescript
// Add at top of file
import { getStyleExamples } from '@/lib/ai-agent-utils';

// Inside POST function, before building systemPrompt
let styleContext = '';

// Determine which style examples to use based on query intent
if (intent.type === 'email' || message.toLowerCase().includes('email')) {
  const examples = await getStyleExamples('email', 'follow_up', db, openai, 3);
  if (examples.length > 0) {
    styleContext = `\n\n**NEWBURY PARTNERS WRITING STYLE EXAMPLES:**\n\n${examples.join('\n\n---\n\n')}`;
  }
}

// Update systemPrompt to include styleContext
const systemPrompt = baseSystemPrompt + deepAnalysisPrompt + styleContext + `

**Your Communication Style:**
- Match the tone, structure, and language patterns shown in the style examples above
- Use similar sentence lengths and paragraph structures
- Adopt the same level of formality and directness
- Mirror the personality and warmth level
- Use similar opening and closing patterns
...
`;
```

#### 3.2 Update Sales Inbox AI Reply (`/api/sales-inbox/ai-reply/route.ts`)

**Current State:** Generic "Bill's style" description  
**New State:** Actual Bill email examples

**Changes:**
```typescript
import { getStyleExamples } from '@/lib/ai-agent-utils';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Inside POST function, before generating reply
const openaiForStyle = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get relevant style examples based on email context
let styleCategory = 'email';
let styleSubcategory = 'follow_up'; // Default

// Determine subcategory based on thread context
if (thread.messages.length === 1) {
  styleSubcategory = 'cold_outreach';
} else if (thread.deal && thread.deal.stage?.name?.includes('Proposal')) {
  styleSubcategory = 'proposal';
} else if (lastMessage.body.toLowerCase().includes('technical') || 
           lastMessage.body.toLowerCase().includes('implementation')) {
  styleSubcategory = 'technical';
}

// Fetch style examples
const styleExamples = await getStyleExamples(
  styleCategory, 
  styleSubcategory, 
  pool, 
  openaiForStyle, 
  3
);

// Build enhanced system prompt with actual examples
const systemPrompt = `You are Bill from OpticWise, responding to a client email.

${styleExamples.length > 0 ? `
**BILL'S ACTUAL EMAIL EXAMPLES - MATCH THIS STYLE:**

${styleExamples.join('\n\n---\n\n')}

**INSTRUCTIONS:**
1. Study the examples above carefully
2. Match Bill's tone, structure, and language patterns
3. Use similar sentence lengths and paragraph breaks
4. Adopt the same level of directness and warmth
5. Mirror the opening and closing styles
6. Use similar vocabulary and phrasing
` : `
BILL'S WRITING STYLE & TONE:
- Professional but warm and personable
- Direct and to-the-point, no fluff
...
`}

CONTEXT ABOUT THIS CONTACT:
${contactContext}

${transcriptContext ? `RELEVANT INFORMATION FROM PAST CALLS:\n${transcriptContext}` : ''}

CRITICAL RULES:
1. Do NOT include a subject line
2. Do NOT include "Dear [Name]" - start directly with content
3. End with just "Bill" (no last name, no signature block)
4. Keep it concise but thorough
5. Include a clear next step
`;
```

#### 3.3 Add Voice Consistency Monitoring

**Create:** `/ow/scripts/monitor-voice-consistency.ts`

```typescript
/**
 * Monitors AI outputs for voice consistency
 * Flags responses that don't match brand voice
 */

interface VoiceViolation {
  messageId: string;
  violation: string;
  severity: 'low' | 'medium' | 'high';
}

const roboticPhrases = [
  'Based on my knowledge',
  'According to my analysis',
  'I have analyzed',
  'Let me provide you with',
  'I would recommend that you',
  'Based on your recent activity',
  'Here are the items you should consider',
  'I hope this email finds you well',
  'Please let me know if you have any questions',
  'Thank you for your time and consideration',
];

async function checkVoiceConsistency(content: string): Promise<VoiceViolation[]> {
  const violations: VoiceViolation[] = [];
  
  // Check for robotic phrases
  for (const phrase of roboticPhrases) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        messageId: 'unknown',
        violation: `Contains robotic phrase: "${phrase}"`,
        severity: 'high'
      });
    }
  }
  
  // Check for overly formal language
  const formalPatterns = [
    /Dear (Sir|Madam|Mr\.|Mrs\.|Ms\.)/gi,
    /Yours (sincerely|faithfully|truly)/gi,
    /I am writing to inform you/gi,
  ];
  
  for (const pattern of formalPatterns) {
    if (pattern.test(content)) {
      violations.push({
        messageId: 'unknown',
        violation: `Overly formal language detected`,
        severity: 'medium'
      });
    }
  }
  
  return violations;
}

// Run on recent AI outputs
async function monitorRecentOutputs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const recentMessages = await pool.query(
    `SELECT id, content 
     FROM "AgentChatMessage" 
     WHERE role = 'assistant' 
       AND "createdAt" > NOW() - INTERVAL '24 hours'
     ORDER BY "createdAt" DESC`
  );
  
  for (const msg of recentMessages.rows) {
    const violations = await checkVoiceConsistency(msg.content);
    if (violations.length > 0) {
      console.log(`\n⚠️  Message ${msg.id}:`);
      violations.forEach(v => console.log(`   - [${v.severity}] ${v.violation}`));
    }
  }
}
```

---

## 📈 Expected Outcomes

### Immediate Benefits (Week 1-2)
- ✅ 30-50 authentic voice examples in StyleGuide
- ✅ AI outputs match OpticWise' actual communication style
- ✅ Elimination of robotic AI phrases
- ✅ Consistent brand voice across all channels

### Medium-Term Benefits (Month 1-2)
- ✅ Clients can't distinguish AI-generated from human-written content
- ✅ Higher email response rates (more authentic = more engaging)
- ✅ Reduced editing time for AI-generated drafts
- ✅ Stronger brand consistency across all touchpoints

### Long-Term Benefits (Month 3+)
- ✅ Continuous improvement through usage tracking
- ✅ Style examples get better over time (track which get used most)
- ✅ Can expand to other categories (proposals, marketing, social)
- ✅ Full brand voice automation across all content types

---

## 🎯 Success Metrics

### Quantitative Metrics
1. **Voice Consistency Score**
   - Measure: % of AI outputs with zero robotic phrases
   - Target: 95%+ by end of Phase 3

2. **Style Example Usage**
   - Measure: `usageCount` in StyleGuide table
   - Target: Each example used at least 10 times in first month

3. **Email Response Rates**
   - Measure: Response rate to AI-generated emails
   - Target: Match or exceed human-written baseline

4. **Edit Time Reduction**
   - Measure: Time spent editing AI drafts
   - Target: 50% reduction by end of Phase 3

### Qualitative Metrics
1. **Blind Testing**
   - Show 10 emails (5 AI, 5 human) to team
   - Target: <20% accuracy in identifying AI-written

2. **Client Feedback**
   - Ask clients if they notice any change in communication
   - Target: No negative feedback about "sounding different"

3. **Internal Team Assessment**
   - Rate AI outputs on 1-10 scale for brand voice match
   - Target: Average 8+ by end of Phase 3

---

## 🛠️ Implementation Checklist

### Phase 1: Voice Extraction (Week 1)
- [ ] Run email extraction queries on Render database
- [ ] Manually review and select 30-50 best examples
- [ ] Categorize examples (cold_outreach, follow_up, proposal, technical, relationship)
- [ ] Document voice profile (tone, structure, phrases, patterns)
- [ ] Create style examples array with all curated content

### Phase 2: StyleGuide Population (Week 1-2)
- [ ] Create `/ow/scripts/populate-style-guide.ts`
- [ ] Add all curated examples to script
- [ ] Test script locally with 2-3 examples
- [ ] Run full population script on Render
- [ ] Verify with database queries
- [ ] Document example categories and counts

### Phase 3: Integration (Week 2)
- [ ] Update `/ow/app/api/ownet/chat/route.ts` with style injection
- [ ] Update `/ow/app/api/sales-inbox/ai-reply/route.ts` with style examples
- [ ] Create voice consistency monitoring script
- [ ] Test with 10 sample queries
- [ ] Deploy to production
- [ ] Monitor first 24 hours of outputs

### Phase 4: Validation (Week 3)
- [ ] Run voice consistency monitor daily
- [ ] Collect team feedback on AI outputs
- [ ] Measure response rates on AI-generated emails
- [ ] Conduct blind testing with team
- [ ] Adjust style examples based on feedback
- [ ] Document learnings and improvements

---

## 💡 Advanced Enhancements (Future)

### 1. Dynamic Style Selection
Instead of manually choosing subcategory, use AI to classify:

```typescript
// Classify email context to select best style examples
const styleClassification = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: 'Classify this email context into one of: cold_outreach, follow_up, proposal, technical, relationship'
  }, {
    role: 'user',
    content: lastMessage.body
  }],
  max_tokens: 10
});

const subcategory = styleClassification.choices[0].message.content;
```

### 2. Semantic Style Matching
Use vector similarity to find most relevant style examples:

```typescript
// Instead of category-based selection, use semantic similarity
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: message,
  dimensions: 1024,
});

const styleExamples = await pool.query(
  `SELECT content, tone, author
   FROM "StyleGuide"
   WHERE vectorized = true
   ORDER BY embedding <=> $1::vector
   LIMIT 3`,
  [`[${queryEmbedding.data[0].embedding.join(',')}]`]
);
```

### 3. Continuous Learning
Track which style examples lead to best outcomes:

```typescript
// When user accepts AI-generated email without edits
await pool.query(
  `UPDATE "StyleGuide" 
   SET "usageCount" = "usageCount" + 1,
       "lastUsed" = NOW()
   WHERE id = ANY($1)`,
  [usedStyleExampleIds]
);

// When user heavily edits AI output, flag for review
if (editDistance > threshold) {
  await pool.query(
    `INSERT INTO "AIFeedback" 
     (messageId, rating, category, feedback)
     VALUES ($1, 2, 'style_mismatch', 'Heavy editing required')`,
    [messageId]
  );
}
```

### 4. Multi-Author Support
If you have multiple team members with distinct voices:

```typescript
// Detect who should be "speaking"
const author = detectAuthor(emailThread); // 'Bill', 'Drew', 'Team'

// Get style examples for that specific author
const styleExamples = await getStyleExamples(
  'email',
  subcategory,
  pool,
  openai,
  3,
  author // Filter by author
);
```

---

## 🚨 Potential Challenges & Solutions

### Challenge 1: Not Enough Good Examples
**Problem:** Can't find 30-50 high-quality email examples  
**Solution:** 
- Start with 15-20 best examples
- Supplement with transcript excerpts
- Manually write 5-10 "ideal" examples based on voice profile

### Challenge 2: Style Examples Too Similar
**Problem:** All examples sound the same, not enough variety  
**Solution:**
- Ensure diversity across categories
- Include different lengths (short, medium, long)
- Mix different contexts (good news, bad news, neutral)

### Challenge 3: AI Still Sounds Generic
**Problem:** Even with examples, outputs don't match voice  
**Solution:**
- Increase number of examples in prompt (3 → 5)
- Add more explicit instructions about what to match
- Use few-shot prompting with before/after examples

### Challenge 4: Performance Impact
**Problem:** Fetching style examples adds latency  
**Solution:**
- Cache style examples in memory (refresh every hour)
- Use Redis for fast retrieval
- Pre-load examples at server startup

---

## 📋 Next Steps

### Immediate Actions (This Week)
1. **Review & Approve Proposal** - Confirm approach and timeline
2. **Extract Email Examples** - Run queries and manually curate
3. **Create Voice Profile** - Document specific patterns and phrases

### Week 1 Deliverables
- [ ] 30-50 curated email examples
- [ ] Voice profile document
- [ ] Population script ready to run

### Week 2 Deliverables
- [ ] StyleGuide table populated
- [ ] OWnet agent updated with style injection
- [ ] Sales inbox updated with style examples
- [ ] Initial testing complete

### Week 3 Deliverables
- [ ] Voice consistency monitoring active
- [ ] Team feedback collected
- [ ] Metrics baseline established
- [ ] Iteration plan for improvements

---

## 💰 Resource Requirements

### Time Investment
- **Phase 1:** 8-12 hours (email curation, voice analysis)
- **Phase 2:** 4-6 hours (script creation, population, testing)
- **Phase 3:** 6-8 hours (integration, testing, deployment)
- **Total:** ~20-26 hours over 2-3 weeks

### Technical Requirements
- Access to Render database (already have)
- OpenAI API credits (minimal, ~$5-10 for embeddings)
- No new infrastructure needed

### Human Resources
- 1 person for email curation (requires judgment about "good" examples)
- 1 developer for script creation and integration
- Team feedback for validation phase

---

## 🎉 Conclusion

You've built the infrastructure for world-class brand voice matching, but the StyleGuide table is empty. This proposal gives you a clear path to:

1. **Extract** authentic voice patterns from your existing content
2. **Populate** the StyleGuide with real examples
3. **Integrate** style examples into all AI outputs
4. **Monitor** and continuously improve voice consistency

The result: AI outputs that are indistinguishable from human-written content, perfectly matching OpticWise' authentic voice.

**Ready to proceed?** Let's start with Phase 1 and get those email examples extracted.

---

## 📞 Questions to Answer

1. **Do you want to start with email examples only, or include transcript patterns too?**
   - Recommendation: Start with emails (easier to curate), add transcripts later

2. **Should we focus on Bill's voice specifically, or blend team voices?**
   - Recommendation: Start with Bill (most consistent), expand later

3. **What's your target timeline?**
   - Recommendation: 2-3 weeks for full implementation

4. **Who should review and approve the curated examples?**
   - Recommendation: Bill reviews final 30-50 examples before population

5. **Do you want to test on a subset of outputs first, or deploy to all?**
   - Recommendation: Test on Sales Inbox first (lower risk), then OWnet

---

**Let's dial in that authentic OpticWise voice! 🎯**
