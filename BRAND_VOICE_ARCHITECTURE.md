# Brand Voice Enhancement - Technical Architecture

**Visual guide to how brand voice matching works**

---

## 🏗️ Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY                                │
│              "Draft a follow-up email"                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI ENDPOINT                                 │
│         /api/sales-inbox/ai-reply                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              GENERIC SYSTEM PROMPT                           │
│                                                              │
│  "You are Bill from OpticWise.                              │
│   Write professional, direct emails.                        │
│   Be helpful and specific."                                 │
│                                                              │
│  ⚠️  NO ACTUAL EXAMPLES                                     │
│  ⚠️  GENERIC DESCRIPTIONS ONLY                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT RETRIEVAL                          │
│                                                              │
│  ✅ CRM Data (deals, contacts)                              │
│  ✅ Transcripts (from Pinecone)                             │
│  ✅ Email Thread History                                    │
│  ❌ NO STYLE EXAMPLES                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   LLM (GPT-4o / Claude)                      │
│                                                              │
│  Generates response based on:                               │
│  - Generic prompt                                           │
│  - Context data                                             │
│  - Built-in training (not your voice)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI OUTPUT                                 │
│                                                              │
│  ⚠️  Professional but generic                               │
│  ⚠️  May include robotic phrases:                           │
│      "Based on my knowledge..."                             │
│      "I hope this email finds you well..."                  │
│      "Please let me know if you have questions..."          │
│  ⚠️  Doesn't match YOUR specific voice                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Proposed Architecture (After)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY                                │
│              "Draft a follow-up email"                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI ENDPOINT                                 │
│         /api/sales-inbox/ai-reply                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTEXT CLASSIFICATION                          │
│                                                              │
│  Determines email type:                                     │
│  - First contact → cold_outreach                            │
│  - Existing thread → follow_up                              │
│  - Pricing discussion → proposal                            │
│  - Technical question → technical                           │
│  - Casual check-in → relationship                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              STYLE EXAMPLE RETRIEVAL                         │
│                   ✨ NEW STEP ✨                            │
│                                                              │
│  Query: SELECT content, tone, author                        │
│         FROM "StyleGuide"                                   │
│         WHERE category = 'email'                            │
│           AND subcategory = 'follow_up'                     │
│         ORDER BY "usageCount" DESC                          │
│         LIMIT 3                                             │
│                                                              │
│  Returns: 3 actual email examples from Bill                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ENHANCED SYSTEM PROMPT                          │
│                   ✨ UPGRADED ✨                            │
│                                                              │
│  "You are Bill from OpticWise.                              │
│                                                              │
│  **BILL'S ACTUAL EMAIL EXAMPLES:**                          │
│                                                              │
│  [Example 1 - Actual Bill email]                            │
│  Hey [Name],                                                │
│  Just wanted to circle back...                              │
│  Does that align with what you were thinking?               │
│  Bill                                                        │
│                                                              │
│  [Example 2 - Actual Bill email]                            │
│  ...                                                         │
│                                                              │
│  [Example 3 - Actual Bill email]                            │
│  ...                                                         │
│                                                              │
│  **INSTRUCTIONS:**                                           │
│  Match the tone, structure, and language patterns above.    │
│  Use similar sentence lengths and paragraph breaks.         │
│  Adopt the same level of directness and warmth.             │
│  Mirror the opening and closing styles."                    │
│                                                              │
│  ✅ ACTUAL EXAMPLES FROM YOUR CONTENT                       │
│  ✅ SPECIFIC VOICE PATTERNS                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT RETRIEVAL                          │
│                                                              │
│  ✅ CRM Data (deals, contacts)                              │
│  ✅ Transcripts (from Pinecone)                             │
│  ✅ Email Thread History                                    │
│  ✅ STYLE EXAMPLES (from StyleGuide)  ← NEW!               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   LLM (GPT-4o / Claude)                      │
│                                                              │
│  Generates response based on:                               │
│  - Enhanced prompt with actual examples                     │
│  - Context data                                             │
│  - Few-shot learning from your examples                     │
│  - Pattern matching from StyleGuide                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI OUTPUT                                 │
│                   ✨ IMPROVED ✨                            │
│                                                              │
│  ✅ Matches YOUR specific voice                             │
│  ✅ Uses YOUR phrases and patterns                          │
│  ✅ Mirrors YOUR structure and tone                         │
│  ✅ Zero robotic phrases                                    │
│  ✅ Indistinguishable from human-written                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   USAGE TRACKING                             │
│                   ✨ NEW STEP ✨                            │
│                                                              │
│  UPDATE "StyleGuide"                                        │
│  SET "usageCount" = "usageCount" + 1                        │
│  WHERE id IN (used_example_ids)                             │
│                                                              │
│  → Tracks which examples are most effective                 │
│  → Enables continuous improvement                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### StyleGuide Table

```sql
CREATE TABLE "StyleGuide" (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- 'email', 'proposal', 'marketing'
  subcategory TEXT,               -- 'cold_outreach', 'follow_up', etc.
  content TEXT NOT NULL,          -- The actual example text
  tone TEXT,                      -- 'professional-casual', 'direct', etc.
  author TEXT,                    -- 'Bill', 'Drew', 'Team'
  context TEXT,                   -- When/why to use this example
  embedding vector(1024),         -- Vector for semantic search
  vectorized BOOLEAN DEFAULT false,
  "usageCount" INTEGER DEFAULT 0, -- Track which examples work best
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX "StyleGuide_category_idx" ON "StyleGuide"(category);
CREATE INDEX "StyleGuide_subcategory_idx" ON "StyleGuide"(subcategory);
CREATE INDEX "StyleGuide_embedding_idx" ON "StyleGuide" 
  USING ivfflat (embedding vector_cosine_ops);
```

### Example Data

```sql
-- Example 1: Follow-up email
INSERT INTO "StyleGuide" (category, subcategory, content, tone, author, context)
VALUES (
  'email',
  'follow_up',
  'Hey [Name],

Just wanted to circle back on our conversation from last week about the data infrastructure project.

I''ve been thinking about what you mentioned regarding the integration challenges. Here''s what I''d recommend:

1. Start with a pilot on one property
2. Use that data to build the business case
3. We can have this up and running in 30-45 days

Does that align with what you were thinking? Happy to jump on a call this week.

Bill',
  'professional-casual',
  'Bill',
  'Follow-up after discovery call, technical project discussion'
);

-- Example 2: Cold outreach
INSERT INTO "StyleGuide" (category, subcategory, content, tone, author, context)
VALUES (
  'email',
  'cold_outreach',
  'Hi [Name],

I came across [Company] and noticed you''re managing [X properties/portfolio].

We work with commercial real estate operators to consolidate their digital infrastructure and turn it into a revenue stream. Most of our clients see $8-12K/month in new recurring revenue once deployed.

Would it make sense to have a quick 15-minute call to see if there''s a fit?

Bill',
  'professional-direct',
  'Bill',
  'First contact with potential client, value-focused'
);
```

---

## 🔄 Data Flow Diagram

### Style Example Retrieval Process

```
User Query
    │
    ▼
┌───────────────────────┐
│ Classify Context      │
│ - Email type?         │
│ - Stage in funnel?    │
│ - Technical level?    │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Determine Subcategory │
│                       │
│ IF first_contact:     │
│   → cold_outreach     │
│ IF existing_thread:   │
│   → follow_up         │
│ IF pricing_mentioned: │
│   → proposal          │
│ IF technical_question:│
│   → technical         │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Query StyleGuide      │
│                       │
│ SELECT content        │
│ WHERE category = X    │
│   AND subcategory = Y │
│ ORDER BY usageCount   │
│ LIMIT 3               │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Format Examples       │
│                       │
│ [Bill - casual]       │
│ Example 1 text...     │
│                       │
│ [Bill - direct]       │
│ Example 2 text...     │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Inject into Prompt    │
│                       │
│ System: "Match these  │
│ examples..."          │
│                       │
│ Examples: [formatted] │
│                       │
│ User: [original query]│
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Generate Response     │
│ (LLM with examples)   │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Track Usage           │
│ usageCount++          │
└───────────────────────┘
```

---

## 🎨 Style Matching Algorithm

### Option 1: Category-Based (Simple)

```typescript
async function getStyleExamples(
  category: string,      // 'email'
  subcategory: string,   // 'follow_up'
  limit: number = 3
): Promise<string[]> {
  
  const result = await db.query(`
    SELECT content, tone, author
    FROM "StyleGuide"
    WHERE category = $1
      AND subcategory = $2
      AND vectorized = true
    ORDER BY "usageCount" DESC, RANDOM()
    LIMIT $3
  `, [category, subcategory, limit]);
  
  return result.rows.map(row => 
    `[${row.author} - ${row.tone}]\n${row.content}`
  );
}
```

**Pros:**
- Fast (indexed query)
- Predictable results
- Easy to debug

**Cons:**
- Requires manual categorization
- Less flexible

---

### Option 2: Semantic Similarity (Advanced)

```typescript
async function getStyleExamplesBySimilarity(
  query: string,
  category: string,
  limit: number = 3
): Promise<string[]> {
  
  // Generate embedding for the query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
    dimensions: 1024,
  });
  
  const queryVector = embedding.data[0].embedding;
  
  // Find most similar style examples
  const result = await db.query(`
    SELECT content, tone, author,
           embedding <=> $1::vector as similarity
    FROM "StyleGuide"
    WHERE category = $2
      AND vectorized = true
    ORDER BY similarity ASC
    LIMIT $3
  `, [`[${queryVector.join(',')}]`, category, limit]);
  
  return result.rows.map(row => 
    `[${row.author} - ${row.tone}]\n${row.content}`
  );
}
```

**Pros:**
- Automatically finds most relevant examples
- Adapts to query context
- No manual categorization needed

**Cons:**
- Slower (vector search)
- Less predictable
- Requires embeddings

---

## 🔍 Example Comparison

### Query: "Draft a follow-up email about pricing"

#### Without Style Examples:
```
Subject: Following Up on Our Discussion

Dear [Name],

I hope this email finds you well. I wanted to follow up on our 
conversation from last week regarding the pricing for our services.

Based on your requirements, I have prepared a detailed proposal 
that I believe will meet your needs. Please let me know if you 
have any questions or would like to schedule a call to discuss 
further.

I look forward to hearing from you.

Best regards,
Bill
```

**Issues:**
- ❌ "I hope this email finds you well" (robotic)
- ❌ "Based on your requirements" (formal)
- ❌ "I look forward to hearing from you" (generic)
- ❌ Overly formal tone
- ❌ Doesn't sound like Bill

---

#### With Style Examples:
```
Hey [Name],

Just wanted to circle back on the pricing we discussed last week.

Here's what I'm thinking for the pilot:
- Setup: $50K one-time
- Monthly: $12K recurring
- Timeline: 30-45 days to launch

The way I see it, you'll hit breakeven in about 4 months once 
the recurring revenue kicks in. After that, you're looking at 
$8-12K/month in pure profit.

Does that align with what you were thinking? Happy to jump on 
a call this week to walk through the details.

Bill
```

**Improvements:**
- ✅ Natural opening ("Just wanted to circle back")
- ✅ Direct structure (bullet points)
- ✅ Conversational tone ("The way I see it")
- ✅ Specific numbers and timeline
- ✅ Clear next step
- ✅ Sounds like Bill!

---

## 📊 Performance Metrics

### Query Performance

```
Category-Based Retrieval:
┌─────────────────────┬──────────┐
│ Operation           │ Time     │
├─────────────────────┼──────────┤
│ Query StyleGuide    │ 5-10ms   │
│ Format examples     │ <1ms     │
│ Total overhead      │ ~10ms    │
└─────────────────────┴──────────┘

Semantic Similarity Retrieval:
┌─────────────────────┬──────────┐
│ Operation           │ Time     │
├─────────────────────┼──────────┤
│ Generate embedding  │ 100-200ms│
│ Vector search       │ 20-50ms  │
│ Format examples     │ <1ms     │
│ Total overhead      │ ~150ms   │
└─────────────────────┴──────────┘
```

**Recommendation:** Start with category-based (faster), upgrade to semantic if needed.

---

### Token Usage

```
Without Style Examples:
┌─────────────────────┬──────────┐
│ Component           │ Tokens   │
├─────────────────────┼──────────┤
│ System prompt       │ 150      │
│ Context             │ 500      │
│ User query          │ 50       │
│ Total input         │ 700      │
└─────────────────────┴──────────┘

With Style Examples (3 examples):
┌─────────────────────┬──────────┐
│ Component           │ Tokens   │
├─────────────────────┼──────────┤
│ System prompt       │ 200      │
│ Style examples      │ 600      │ ← Added
│ Context             │ 500      │
│ User query          │ 50       │
│ Total input         │ 1,350    │
└─────────────────────┴──────────┘

Cost Impact: ~$0.002 per query (negligible)
```

---

## 🔐 Security & Privacy

### Data Protection

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────┘

1. Database Level
   ├─ SSL connections enforced
   ├─ Row-level security (if needed)
   └─ Encrypted at rest

2. Application Level
   ├─ Authentication required for all endpoints
   ├─ User-specific style examples (if multi-tenant)
   └─ Rate limiting on API calls

3. Content Level
   ├─ Curate examples to exclude sensitive info
   ├─ Redact client names/details if needed
   └─ Review before adding to StyleGuide

4. API Level
   ├─ OpenAI: Zero data retention (enterprise)
   ├─ Anthropic: No training on your data
   └─ Pinecone: Encrypted vectors
```

---

## 🚀 Deployment Strategy

### Phase 1: Pilot (Week 1)
```
┌─────────────────────────────────────────────────────────────┐
│ PILOT DEPLOYMENT                                             │
└─────────────────────────────────────────────────────────────┘

Target: Sales Inbox AI Reply only
Users: Internal team only
Volume: ~10-20 emails/day
Monitoring: Manual review of all outputs

Success Criteria:
✅ Zero robotic phrases
✅ Team approves voice match (8+/10)
✅ No performance issues
```

### Phase 2: Expand (Week 2)
```
┌─────────────────────────────────────────────────────────────┐
│ EXPANDED DEPLOYMENT                                          │
└─────────────────────────────────────────────────────────────┘

Target: OWnet Agent + Sales Inbox
Users: All internal users
Volume: ~50-100 queries/day
Monitoring: Automated + spot checks

Success Criteria:
✅ 95%+ voice consistency score
✅ No client complaints
✅ Response times <2s
```

### Phase 3: Full Production (Week 3+)
```
┌─────────────────────────────────────────────────────────────┐
│ FULL PRODUCTION                                              │
└─────────────────────────────────────────────────────────────┘

Target: All AI endpoints
Users: All users (internal + external if applicable)
Volume: Unlimited
Monitoring: Automated dashboards

Success Criteria:
✅ Continuous improvement via usage tracking
✅ Expansion to new content types
✅ Client satisfaction maintained
```

---

## 🎯 Success Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                   VOICE CONSISTENCY METRICS                  │
└─────────────────────────────────────────────────────────────┘

Robotic Phrase Detection:
  ┌────────────────────────────────────────────┐
  │ ████████████████████████████████████  95%  │ ← Target: 95%+
  └────────────────────────────────────────────┘

Style Example Usage:
  ┌────────────────────────────────────────────┐
  │ cold_outreach:  ████████████  120 uses     │
  │ follow_up:      ████████████████  180 uses │
  │ proposal:       ████████  80 uses          │
  │ technical:      ██████  60 uses            │
  │ relationship:   ████  40 uses              │
  └────────────────────────────────────────────┘

Voice Match Score (1-10):
  ┌────────────────────────────────────────────┐
  │ ████████████████████████████████  8.5/10   │ ← Target: 8+
  └────────────────────────────────────────────┘

Response Time Impact:
  ┌────────────────────────────────────────────┐
  │ Before: 1.2s  │ After: 1.3s  │ +0.1s       │ ← Acceptable
  └────────────────────────────────────────────┘
```

---

## 🔄 Continuous Improvement Loop

```
┌─────────────────────────────────────────────────────────────┐
│                   IMPROVEMENT CYCLE                          │
└─────────────────────────────────────────────────────────────┘

1. GENERATE
   │ AI creates output using style examples
   │
   ▼
2. TRACK
   │ Log which examples were used
   │ Track usageCount for each
   │
   ▼
3. MEASURE
   │ User accepts/edits output
   │ Calculate edit distance
   │ Collect feedback ratings
   │
   ▼
4. ANALYZE
   │ Which examples lead to best outputs?
   │ Which need improvement?
   │ What patterns emerge?
   │
   ▼
5. OPTIMIZE
   │ Promote high-performing examples
   │ Retire low-performing ones
   │ Add new examples based on learnings
   │
   └──────> Back to GENERATE (improved)
```

---

**This architecture enables authentic, brand-consistent AI outputs at scale! 🎯**
