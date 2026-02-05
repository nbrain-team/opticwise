# Agent Testing Quick Start Guide

**Document:** AGENT_BULK_TESTING_FEEDBACK_SHEET.md  
**Purpose:** Evaluate OWnet agent responses for brand voice, accuracy, and effectiveness  
**Time Required:** ~2-3 hours for complete testing

---

## What You're Testing

We've created 25 carefully selected questions across 8 categories that represent real customer objections, concerns, and information needs. Your goal is to:

1. **Test the agent** against these questions
2. **Evaluate responses** using specific criteria
3. **Provide feedback** for agent training improvements

---

## Setup (5 minutes)

### Step 1: Open the Agent
Go to: `https://opticwise-frontend.onrender.com/ownet-agent`

### Step 2: Open the Feedback Sheet
Open `AGENT_BULK_TESTING_FEEDBACK_SHEET.md` in a text editor or markdown viewer

### Step 3: Prepare Your Workspace
- **Tab 1:** OWnet agent (for testing)
- **Tab 2:** Feedback sheet (for recording)
- **Tab 3:** This quick start guide (for reference)

---

## Testing Process (Per Question)

### 1. Copy the Question
From the feedback sheet, copy the exact question text.

Example:
```
We're spending $180K annually on managed Wi-Fi across our portfolio. 
How would OpticWise's approach be different from what we have now, 
and would it actually save us money?
```

### 2. Paste into Agent
- Paste the question into the OWnet agent chat
- Wait for the complete response
- Check that sources appear in collapsible dropdowns (not expanded)

### 3. Copy the Response
- Select and copy the **entire agent response**
- Include all text, but note if sources are formatted correctly

### 4. Paste into Feedback Sheet
Replace `[PASTE RESPONSE HERE]` with the actual response.

### 5. Evaluate (5 criteria, 1-5 scale each)

#### Brand Voice Adherence (1-5)
**Ask yourself:**
- Does it sound like a trusted guide (not a salesperson)?
- Does it use "you" language focused on the owner?
- Does it say "digital infrastructure" (not just "infrastructure")?
- Does it position OpticWise as THE solution to vendor dependency?

**Scoring:**
- **5:** Perfect brand voice - sounds exactly like StoryBrand framework
- **4:** Strong - minor tweaks needed
- **3:** Good - some voice issues but mostly on-brand
- **2:** Weak - sounds too vendor-like or uses wrong terminology
- **1:** Poor - completely off-brand

#### Content Quality (1-5)
**Ask yourself:**
- Does it actually answer the question asked?
- Does it provide specific, actionable information?
- Does it tie features to outcomes (NOI, control, retention)?
- Is the depth appropriate (not too shallow, not overwhelming)?

**Scoring:**
- **5:** Perfect answer - specific, actionable, outcome-focused
- **4:** Strong - minor gaps in detail
- **3:** Good - answers the question but could be more specific
- **2:** Weak - vague or misses key points
- **1:** Poor - doesn't answer the question

#### Formatting & Scannability (1-5)
**Ask yourself:**
- Can I skim this and get the key points in 10 seconds?
- Does it use headers, bullets, bold effectively?
- Are there any emoji icons? (should be NONE)
- Are sources in collapsible dropdowns?

**Scoring:**
- **5:** Perfect formatting - scannable, professional, no emojis
- **4:** Strong - well formatted, minor improvements possible
- **3:** Good - formatted but could be more scannable
- **2:** Weak - poor structure or hard to skim
- **1:** Poor - wall of text or has emojis

#### Objection Handling (1-5)
**Ask yourself:**
- Does it address potential concerns proactively?
- Does it validate concerns before reframing?
- Does it sound defensive or dismissive?
- Does it build trust through transparency?

**Scoring:**
- **5:** Perfect handling - validates, reframes, builds trust
- **4:** Strong - addresses concerns well
- **3:** Good - acknowledges but could reframe better
- **2:** Weak - sounds defensive or dismissive
- **1:** Poor - ignores or invalidates concerns

#### Call to Action (1-5)
**Ask yourself:**
- Is there a clear next step?
- Does it mention PPP Audit or similar entry point?
- Does it feel natural (not forced)?
- Is it easy for the prospect to take action?

**Scoring:**
- **5:** Perfect CTA - natural, clear, aligned with message
- **4:** Strong - good CTA, minor improvements possible
- **3:** Good - CTA present but could be stronger
- **2:** Weak - vague or too salesy
- **1:** Poor - no CTA or completely off

### 6. Record Scores
Check the boxes for each criterion (1-5).

### 7. Add Qualitative Feedback

**What Worked Well:** (2-3 specific positives)
Example:
- "Great use of the reframing line about vendor ownership"
- "Specific NOI examples tied to outcomes"
- "Professional formatting with good visual hierarchy"

**Needs Improvement:** (2-3 specific issues)
Example:
- "Used 'infrastructure' alone without 'digital' modifier"
- "Didn't mention PPP Audit as entry point"
- "Too technical - not enough plain language"

**Training Notes for Agent:** (Specific instructions for improvement)
Example:
- "Always say 'digital infrastructure' not just 'infrastructure'"
- "When discussing cost, lead with outcome and P&L impact before pricing"
- "Include PPP Audit as the first step for discovering specific value"

---

## Special Focus Areas

As you test, pay extra attention to these common issues:

### ❌ Brand Voice Red Flags
- Using "infrastructure" without "digital"
- Sounding like a vendor instead of a guide
- PropTech jargon without translation
- "We" language instead of "you" language

### ✅ Brand Voice Wins
- Uses reframing line: "If you don't own your digital infrastructure, your vendors do"
- Ties everything to outcomes (NOI, control, retention, future-proofing)
- Uses PPP 5C framework appropriately
- Infinite game framing ("build for the next decade")

### ❌ Content Red Flags
- Vague answers without specifics
- Features without outcomes
- Doesn't address the actual question
- Too technical without translation

### ✅ Content Wins
- Specific examples and numbers
- Clear "Here's what happens when..." scenarios
- Directly answers the question
- Appropriate depth for complexity

### ❌ Formatting Red Flags
- **ANY emoji icons** (should be completely removed)
- Wall of text without structure
- Sources expanded by default
- Hard to skim

### ✅ Formatting Wins
- Clean, professional markdown
- Good use of headers and bullets
- Scannable in 10 seconds
- Sources in collapsible dropdowns

---

## Question Categories Explained

### 1. Financial / ROI (4 questions)
**Focus:** Cost, savings, ROI, revenue
**Key Test:** Does agent tie OpticWise value to P&L and avoid sounding defensive about cost?

### 2. Technical / Infrastructure (5 questions)
**Focus:** How it works, technical differentiation
**Key Test:** Does agent translate tech into business outcomes and avoid jargon?

### 3. PPP / Framework (3 questions)
**Focus:** PPP Audit, BoT, 5C Framework
**Key Test:** Does agent explain concepts in plain English with clear value?

### 4. Vendor Management (3 questions)
**Focus:** Contracts, lock-in, vendor control
**Key Test:** Does agent reframe vendor dependency as the core problem OpticWise solves?

### 5. Data / AI (3 questions)
**Focus:** Data ownership, AI readiness, future-proofing
**Key Test:** Does agent connect data ownership to real business value (not just "nice to have")?

### 6. Security / Privacy (1 question)
**Focus:** Cybersecurity, tenant privacy
**Key Test:** Does agent position security as differentiator and trust-builder?

### 7. Tenant Experience (1 question)
**Focus:** Retention, tenant satisfaction
**Key Test:** Does agent connect infrastructure to NOI through retention and satisfaction?

### 8. Implementation / Operations (5 questions)
**Focus:** Timeline, disruption, team burden, contracts
**Key Test:** Does agent address operational concerns with reassurance and specifics?

---

## After Testing All 25 Questions

### 1. Calculate Category Averages
For each category, average the scores across all 5 criteria.

### 2. Identify Patterns
Look for:
- **Categories with low scores** (need targeted training)
- **Consistent issues across questions** (systemic problems)
- **Surprisingly strong areas** (what's working well?)

### 3. Compile Top Issues
In the "Top Issues to Address" section, list:
- **Critical (Must Fix Before Launch):** Score < 3.0 on any criterion
- **Important (Should Fix Soon):** Score 3.0-3.9, affects multiple questions
- **Nice to Have (Future Improvements):** Score 4.0+, minor refinements

### 4. Write Training Recommendations
Based on patterns, write specific instructions for:
- **Brand Voice Updates:** Terminology, positioning, tone adjustments
- **Content Additions:** Missing information, new scenarios, better examples
- **Objection Handling Scripts:** Better reframes, stronger reassurance
- **Messaging Refinements:** Clearer CTAs, stronger differentiators

---

## Common Questions

**Q: What if the agent response is super long?**
A: That's fine - paste the whole thing. In "Needs Improvement," you might note "Too lengthy - could be more concise" if it's overwhelming.

**Q: What if I see emojis?**
A: This is a CRITICAL issue. Mark Formatting as 1 and note in "Needs Improvement": "EMOJIS PRESENT - must be removed completely."

**Q: What if sources don't appear in dropdowns?**
A: Mark Formatting as 1-2 and note: "Sources not collapsible - should appear in <details> dropdowns."

**Q: How long should this take?**
A: About 5-7 minutes per question. Budget 2-3 hours total.

**Q: Can I test questions out of order?**
A: Yes! The categories are organized but questions are independent.

**Q: What if the agent says it doesn't have enough data?**
A: Note in "Needs Improvement": "Agent should provide general guidance even without specific customer data."

---

## Tips for Effective Testing

1. **Test in one sitting if possible** - Maintains consistency in evaluation
2. **Take breaks every 5-10 questions** - Prevents evaluation fatigue
3. **Don't overthink scores** - Trust your first impression
4. **Be specific in feedback** - "Used wrong terminology" > "Not on brand"
5. **Note pleasant surprises** - What worked better than expected?
6. **Flag showstoppers immediately** - Critical issues need immediate attention

---

## What Happens Next?

1. **You complete testing** - Fill out all 25 question evaluations
2. **Compile feedback** - Summarize top issues and recommendations
3. **Share with development team** - We review and prioritize improvements
4. **Agent training updates** - We adjust prompts, add examples, refine messaging
5. **Retest problem areas** - Verify improvements on lowest-scoring questions
6. **Final validation** - Confirm agent is ready for customer use

---

## Need Help?

If you encounter issues or have questions:
- Check the evaluation criteria again
- Review the BrandScript document for voice guidelines
- Flag the question for discussion
- Add notes in "Additional Feedback" section

---

**Ready to start?**

1. Open https://opticwise-frontend.onrender.com/ownet-agent
2. Open AGENT_BULK_TESTING_FEEDBACK_SHEET.md
3. Start with Question #1
4. Work through systematically

**Good luck! Your feedback will directly improve the agent's effectiveness.**
