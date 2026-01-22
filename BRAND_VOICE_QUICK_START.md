# Brand Voice Enhancement - Quick Start Guide

**Goal:** Make your AI sound authentically like OpticWise by leveraging your vectorized content.

---

## 🎯 The Problem

Your AI agent has access to thousands of vectorized emails, documents, and transcripts, but it still sounds generic:
- ❌ "Based on my knowledge..."
- ❌ "According to my analysis..."
- ❌ Generic professional tone, not YOUR voice

**The StyleGuide table exists but is empty** - it was built but never populated with actual examples.

---

## ✅ The Solution (3 Simple Steps)

### Step 1: Extract Email Examples (30 minutes)

Run the extraction script to find candidate emails:

```bash
cd ow
npx tsx scripts/extract-email-examples.ts
```

This will:
- Query your database for 100 high-quality outgoing emails
- Generate review files in `./style-examples-review/`
- Categorize by length (short, medium, long)

**Output:** 3 markdown files + 1 CSV for easy review

---

### Step 2: Curate Examples (1-2 hours)

1. Open the files in `./style-examples-review/`
2. Review each email and mark the good ones with ✅
3. Categorize each selected email:
   - **cold_outreach** - First contact emails
   - **follow_up** - Check-ins and follow-ups
   - **proposal** - Pricing and proposal discussions
   - **technical** - Technical explanations
   - **relationship** - Casual, relationship-building

**Goal:** Select 30-50 best examples that represent your authentic voice

3. Copy selected examples into `scripts/populate-style-guide.ts`

---

### Step 3: Populate & Deploy (30 minutes)

Populate the StyleGuide table:

```bash
npx tsx scripts/populate-style-guide.ts
```

This will:
- Generate embeddings for each example
- Insert into StyleGuide table
- Show summary statistics

**Test it:**

```bash
npx tsx scripts/test-style-examples.ts
```

This generates sample emails WITH and WITHOUT style examples so you can see the difference.

---

## 📊 What Happens Next?

Once StyleGuide is populated, the AI will:

1. **Retrieve relevant style examples** based on context
2. **Inject them into the prompt** as reference material
3. **Generate outputs that match your voice** - tone, structure, language patterns

**Result:** AI outputs that sound like YOU, not a generic AI assistant.

---

## 🔧 Integration Points

The style examples will be used in:

1. **OWnet Agent** (`/api/ownet/chat`) - All conversational queries
2. **Sales Inbox AI Reply** (`/api/sales-inbox/ai-reply`) - Email responses
3. **Future endpoints** - Proposals, reports, etc.

---

## 📈 Success Metrics

After implementation, you should see:

- ✅ **Zero robotic phrases** ("Based on my knowledge...")
- ✅ **Authentic tone** - Sounds like your actual emails
- ✅ **Consistent voice** - Same style across all outputs
- ✅ **Higher engagement** - More responses to AI-generated emails

---

## 🚀 Ready to Start?

Run this command to begin:

```bash
cd ow
npx tsx scripts/extract-email-examples.ts
```

Then review the generated files in `./style-examples-review/`

---

## 💡 Pro Tips

### Tip 1: Quality Over Quantity
- 20 excellent examples > 50 mediocre ones
- Focus on emails that truly represent your voice

### Tip 2: Diverse Examples
- Include different lengths (short, medium, long)
- Cover different contexts (good news, bad news, neutral)
- Mix formal and casual as appropriate

### Tip 3: Recent Content
- Use emails from last 6-12 months
- Your voice evolves - use current examples

### Tip 4: Test Before Full Deployment
- Run `test-style-examples.ts` to see the difference
- Review outputs with your team
- Iterate on examples if needed

---

## 🔍 Troubleshooting

### "No emails found"
**Problem:** Database query returns 0 results  
**Solution:** 
- Check if GmailMessage table has data
- Adjust date range in extraction script
- Lower the minimum length requirement

### "StyleGuide table doesn't exist"
**Problem:** Migration not run  
**Solution:**
```bash
cd ow
npx prisma migrate deploy
```

### "Embeddings API error"
**Problem:** OpenAI API key issue  
**Solution:**
- Check `.env` file has `OPENAI_API_KEY`
- Verify API key is valid
- Check API quota/billing

### "Outputs still sound generic"
**Problem:** Style examples not being used  
**Solution:**
- Verify StyleGuide has data: `SELECT COUNT(*) FROM "StyleGuide";`
- Check integration in API endpoints
- Increase number of examples in prompt (3 → 5)

---

## 📞 Questions?

**Q: How many examples do I need?**  
A: Start with 30-50. You can always add more later.

**Q: Should I include emails from multiple people?**  
A: Start with one person (e.g., Bill). Expand later if needed.

**Q: What if I don't have enough good emails?**  
A: Supplement with:
- Transcript excerpts (how you speak in calls)
- Manually written "ideal" examples
- Edited versions of good-but-not-perfect emails

**Q: How often should I update examples?**  
A: Review quarterly. Add new examples as your voice evolves.

**Q: Will this slow down the AI?**  
A: Minimal impact (~100-200ms). Can be optimized with caching if needed.

---

## 📋 Full Workflow Summary

```
1. Extract candidates
   └─> npx tsx scripts/extract-email-examples.ts
   
2. Review & curate
   └─> Open ./style-examples-review/*.md
   └─> Select 30-50 best examples
   └─> Categorize each one
   
3. Populate StyleGuide
   └─> Add examples to populate-style-guide.ts
   └─> npx tsx scripts/populate-style-guide.ts
   
4. Test
   └─> npx tsx scripts/test-style-examples.ts
   └─> Review outputs
   
5. Deploy
   └─> Integration already in place
   └─> Just needs populated StyleGuide
   
6. Monitor
   └─> Check outputs for voice consistency
   └─> Iterate on examples as needed
```

---

## 🎉 Expected Timeline

- **Day 1:** Extract and review examples (2-3 hours)
- **Day 2:** Curate and populate StyleGuide (1-2 hours)
- **Day 3:** Test and deploy (1 hour)
- **Week 2:** Monitor and iterate

**Total effort:** ~5-7 hours spread over 1-2 weeks

---

## 🔗 Related Files

- **Full Proposal:** `BRAND_VOICE_ENHANCEMENT_PROPOSAL.md`
- **Extraction Script:** `ow/scripts/extract-email-examples.ts`
- **Population Script:** `ow/scripts/populate-style-guide.ts`
- **Test Script:** `ow/scripts/test-style-examples.ts`
- **Utility Functions:** `ow/lib/ai-agent-utils.ts` (getStyleExamples)

---

**Let's make your AI sound authentically like OpticWise! 🎯**
