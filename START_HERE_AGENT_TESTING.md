# START HERE: Agent Bulk Testing

**Created:** February 5, 2026  
**For:** Client Testing & Feedback  
**Status:** ✅ Ready to Use

---

## What Was Delivered

I've created a complete agent testing framework with 25 carefully selected customer questions and a structured evaluation system. The client can now systematically test the OWnet agent and provide actionable feedback for improvements.

---

## 📋 Quick Access

### For the Client (Testing)
1. **Read First:** `AGENT_TESTING_QUICK_START.md` (step-by-step instructions)
2. **Use This:** `AGENT_BULK_TESTING_FEEDBACK_SHEET.md` (main testing document)
3. **Reference:** `AGENT_TESTING_SUMMARY.md` (overview and framework details)

### For You (Review)
1. **Summary:** `AGENT_TESTING_SUMMARY.md` (what was created and why)
2. **Changes:** `AGENT_OUTPUT_FORMATTING_UPDATE.md` (recent improvements)
3. **Scripts:** `ow/scripts/test-agent-bulk.ts` and `generate-test-responses.ts`

---

## ✅ What's Included

### 1. Testing Documents (3 files)

#### AGENT_BULK_TESTING_FEEDBACK_SHEET.md
- **25 customer questions** across 8 categories
- **Evaluation rubric** for each question (5 criteria, 1-5 scale)
- **Structured feedback** sections (What Worked / Needs Improvement / Training Notes)
- **Summary tables** for category analysis
- **Training recommendations** template

#### AGENT_TESTING_QUICK_START.md
- **Setup instructions** (5 minutes)
- **Step-by-step testing process** (per question)
- **Detailed scoring criteria** with examples
- **Red flags and wins** to watch for
- **Common questions** and troubleshooting
- **Post-testing analysis** instructions

#### AGENT_TESTING_SUMMARY.md
- **Executive overview** of testing framework
- **Question categories** explained
- **Evaluation framework** detailed
- **Success criteria** defined
- **Next steps** outlined

### 2. Testing Scripts (2 files)

#### test-agent-bulk.ts
- Automated bulk testing against production API
- Saves responses to JSON for analysis
- (Note: Requires authentication for production use)

#### generate-test-responses.ts
- Generates responses using brandscript locally
- For development/testing purposes

---

## 🎯 The 25 Questions

### Category 1: Financial / ROI (4 questions)
1. Cost comparison ($180K annual spend)
2. NOI increase specifics
3. Revenue share concerns (bulk ISP agreements)
4. ROI timeline expectations

### Category 2: Technical / Infrastructure (5 questions)
1. Wi-Fi dead zones & connectivity issues
2. "Digital infrastructure" vs "good internet" definition
3. ElasticISP explanation
4. 5S User Experience vs "good Wi-Fi"

### Category 3: PPP / Framework (3 questions)
1. PPP Audit explanation
2. Building of Things (BoT) concept
3. PPP 5C Framework breakdown

### Category 4: Vendor Management (3 questions)
1. 8 vendors - how to get control
2. Vendor lock-in concerns
3. Existing contract handling

### Category 5: Data / AI (3 questions)
1. Data ownership importance
2. "AI-ready" building meaning
3. Future-proofing specifics

### Category 6: Security / Privacy (1 question)
1. Cybersecurity & resident privacy handling

### Category 7: Tenant Experience (1 question)
1. Infrastructure → retention connection

### Category 8: Implementation / Operations (5 questions)
1. "Free equipment" objection
2. 250-unit multifamily implementation details
3. Property management team burden
4. OpticWise vs typical PropTech vendor
5. ESG & sustainability reporting
6. Multi-tenant complexity (Class B office)

---

## 📊 Evaluation Framework

Each question scored on 5 criteria (1-5 scale):

### 1. Brand Voice Adherence
- "You" language (owner POV)
- Trusted guide (not vendor) positioning
- "Digital infrastructure" terminology
- Reframing line usage
- No PropTech jargon

### 2. Content Quality
- Actually answers the question
- Specific and actionable
- Features → outcomes
- Appropriate depth
- Real examples

### 3. Formatting & Scannability
- **NO emoji icons**
- Sources in collapsible dropdowns
- Clean markdown structure
- Skimmable in 10 seconds
- Professional appearance

### 4. Objection Handling
- Addresses concerns proactively
- Validates before reframing
- Not defensive
- Builds trust
- Turns objection into opportunity

### 5. Call to Action
- Clear next step
- PPP Audit or entry point
- Natural (not forced)
- Easy to act on
- Infinite game framing

---

## ⚙️ Recent Agent Updates

Before testing, implemented two critical improvements:

### 1. ✅ Collapsible Sources
Sources now appear in HTML `<details>` dropdowns (collapsed by default):

```html
<details>
<summary><strong>Call Transcripts (3)</strong></summary>
[source details here]
</details>
```

**Client should verify:** Sources are collapsed and clickable

### 2. ✅ No Emoji Icons
Removed ALL emojis from agent output:

**Before:** 📚 Sources | 📧 Emails | 🟢 High  
**After:** Sources | Emails | High (95%)

**Client should verify:** Zero emojis anywhere in responses

---

## 🚀 How Client Should Use This

### Step 1: Setup (5 minutes)
1. Go to `https://opticwise-frontend.onrender.com/ownet-agent`
2. Open `AGENT_BULK_TESTING_FEEDBACK_SHEET.md` in editor
3. Open `AGENT_TESTING_QUICK_START.md` for reference

### Step 2: Test Each Question (~5-7 min each)
1. Copy question from feedback sheet
2. Paste into agent
3. Wait for complete response
4. Copy entire response
5. Paste into feedback sheet
6. Score on 5 criteria (1-5)
7. Add qualitative feedback

### Step 3: Analyze Results (30 min)
1. Calculate category averages
2. Identify patterns and issues
3. Prioritize improvements
4. Write training recommendations

### Total Time: 2-3 hours

---

## 🎯 Success Criteria

Testing is successful when:

### Quantitative
- Average score: **4.0+ / 5.0** across all questions
- No question below **3.0** on any criterion
- Brand Voice: **4.5+ average**
- Formatting: **5.0 average** (must be perfect)

### Qualitative
- Feels like trusted advisor (not vendor)
- Objections reframed effectively
- Every response has clear next step
- Tech translated to business impact
- Client confident sharing with prospects

---

## ⚠️ Critical Items to Watch

### Must Be Fixed Immediately (Score as 1)
- Any emoji icons in responses
- Sources expanded by default
- "Infrastructure" without "digital"
- Vendor-speak instead of guide voice
- Missing or vague answers

### Should Be Fixed Soon (Score as 2-3)
- Overly technical without translation
- Weak objection handling
- Poor formatting/structure
- Missing outcome connections
- Inconsistent terminology

---

## 📝 What Happens Next

1. **Client completes testing** (2-3 hours)
2. **Client shares filled feedback sheet** with you
3. **You review and prioritize** improvements
4. **Agent training updated** based on feedback
5. **Retest problem areas** (lowest-scoring questions)
6. **Final validation** with stakeholders
7. **Launch** when success criteria met

---

## 💡 Why This Matters

This testing framework ensures:

- **Brand consistency:** Every response aligns with OpticWise voice
- **Message clarity:** Complex concepts explained in plain English
- **Objection handling:** Customer concerns addressed proactively
- **Professional appearance:** Clean formatting, no distractions
- **Actionable guidance:** Clear next steps for prospects
- **Continuous improvement:** Structured feedback loop for agent training

---

## 📂 File Locations

All in project root (`/Users/dannydemichele/Opticwise/`):

```
Testing Documents:
├── AGENT_BULK_TESTING_FEEDBACK_SHEET.md  ← Main testing doc
├── AGENT_TESTING_QUICK_START.md          ← Instructions
├── AGENT_TESTING_SUMMARY.md              ← Overview
└── START_HERE_AGENT_TESTING.md           ← This file

Recent Updates:
└── AGENT_OUTPUT_FORMATTING_UPDATE.md     ← Recent changes log

Scripts:
└── ow/scripts/
    ├── test-agent-bulk.ts                ← Bulk testing script
    └── generate-test-responses.ts        ← Response generator
```

---

## ✅ Deployment Status

- [x] Agent output formatting updated (sources collapsible, no emojis)
- [x] Changes committed to Git
- [x] Changes pushed to GitHub
- [x] Render auto-deployment in progress
- [x] Testing documents created and committed
- [ ] Client testing (next step)
- [ ] Feedback analysis (after client testing)
- [ ] Agent training improvements (based on feedback)

---

## 🎓 For Your Reference

### What the Agent Should Sound Like:
- **Trusted guide** helping owners reclaim control
- **Strategic advisor** focused on long-term value
- **Business partner** tying everything to NOI/outcomes
- **Plain English** translator of technical concepts
- **Reframer** of vendor dependency problems

### What to Look For in Responses:
- Uses "you" language consistently
- Says "digital infrastructure" (never standalone "infrastructure")
- Ties features to outcomes (NOI, control, retention, future-proofing)
- Uses PPP 5C framework appropriately
- Includes reframing line when discussing vendor relationships
- Mentions PPP Audit as entry point
- Infinite game framing ("build for next decade")

---

## 📞 Next Steps for You

1. **Share with client:**
   - Send link to `AGENT_TESTING_QUICK_START.md`
   - Point them to `AGENT_BULK_TESTING_FEEDBACK_SHEET.md`
   - Set expectation: 2-3 hours for complete testing

2. **Wait for client testing:**
   - They fill out all 25 question evaluations
   - They calculate scores and identify patterns
   - They write training recommendations

3. **Review feedback:**
   - Analyze scores by category
   - Identify critical issues (score < 3.0)
   - Prioritize improvements

4. **Implement improvements:**
   - Update brandscript-prompt.ts with new instructions
   - Add examples for weak areas
   - Refine objection handling scripts

5. **Retest:**
   - Run lowest-scoring questions again
   - Verify improvements
   - Validate success criteria met

---

## 🎉 Summary

**What was delivered:**
- Complete 25-question testing framework
- Structured evaluation system with 5 criteria
- Step-by-step instructions for client
- Analysis templates and success criteria
- Agent formatting improvements (collapsible sources, no emojis)

**What client needs to do:**
- Test all 25 questions against live agent (2-3 hours)
- Score and provide feedback for each
- Identify patterns and training needs

**What you get back:**
- Comprehensive evaluation scores
- Specific improvement recommendations
- Priority-ranked issues to address
- Clear roadmap for agent refinement

**End result:**
- Agent that consistently delivers on-brand, effective responses
- Confidence in sharing agent with prospects
- Structured process for ongoing improvement

---

**Ready to share with client! All documents are committed and pushed to GitHub.**
