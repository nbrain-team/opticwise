# Client Review Instructions - Agent Response Evaluation

**File to Review:** `ow/bulk-test-results-for-review.csv`  
**Total Responses:** 25  
**Estimated Time:** 2-3 hours

---

## Overview

You're evaluating 25 agent responses to help improve the OWnet AI assistant. Each response has been tested against the live production system. Your feedback will directly train the agent to better serve customers.

---

## How to Use This CSV

### 1. Open the File
- Open `bulk-test-results-for-review.csv` in Excel, Google Sheets, or any spreadsheet app
- The file has 25 rows (one per question) plus a header row

### 2. Review Each Response
For each of the 25 questions:
1. Read the **Question** (Column C)
2. Read the full **Agent_Response** (Column D)
3. Fill in the **evaluation columns** (Columns G-O)

### 3. Save and Return
- Save the file when done
- Return the completed CSV for agent training analysis

---

## Evaluation Columns Explained

### SCORING COLUMNS (1-5 Scale)

#### Column G: Brand_Voice_Score (1-5)
**Question:** Does it sound like a trusted guide (not a vendor)?

**Scoring Guide:**
- **5 - Excellent:** Perfect brand voice - trusted advisor, uses "you" language, says "digital infrastructure", reframes vendor dependency
- **4 - Good:** Strong voice with minor issues (e.g., occasional wrong terminology)
- **3 - Fair:** Some brand voice but inconsistent or sounds vendor-like at times
- **2 - Poor:** Mostly sounds like a vendor, wrong terminology, no reframing
- **1 - Fail:** Completely off-brand, salesy, or uses competitor positioning

**Check for:**
- ✅ "You" language (owner perspective)
- ✅ "Digital infrastructure" (not just "infrastructure")
- ✅ Positions OpticWise as guide/partner (not vendor)
- ✅ Uses reframing: "If you don't own your digital infrastructure, your vendors do"
- ❌ No PropTech jargon without translation

---

#### Column H: Content_Quality_Score (1-5)
**Question:** Does it actually answer the question with useful specifics?

**Scoring Guide:**
- **5 - Excellent:** Specific, actionable, ties features to outcomes, perfect depth
- **4 - Good:** Answers well with minor gaps in detail
- **3 - Fair:** Answers but too vague or generic
- **2 - Poor:** Misses key points or too shallow
- **1 - Fail:** Doesn't answer the question

**Check for:**
- ✅ Actually addresses the question asked
- ✅ Provides specific examples (not vague generalities)
- ✅ Ties features to outcomes (NOI, control, retention, future-proofing)
- ✅ Appropriate depth (not too shallow, not overwhelming)
- ✅ Actionable information

---

#### Column I: Formatting_Score (1-5)
**Question:** Is it well-structured, scannable, and professional?

**Scoring Guide:**
- **5 - Excellent:** Perfect formatting - headers, bullets, bold, easy to skim, NO emojis
- **4 - Good:** Well formatted with minor issues
- **3 - Fair:** Some structure but hard to scan
- **2 - Poor:** Wall of text or emojis present
- **1 - Fail:** Unreadable or multiple formatting issues

**Check for:**
- ✅ Headers (##, ###) to organize sections
- ✅ Bullet points for lists
- ✅ **Bold** for emphasis on key terms
- ✅ Scannable in 10 seconds
- ✅ Professional appearance
- ❌ **NO emoji icons** (this is critical!)
- ❌ Sources should be collapsed (not expanded)

---

#### Column J: Objection_Handling_Score (1-5)
**Question:** Does it handle concerns proactively and build trust?

**Scoring Guide:**
- **5 - Excellent:** Validates concerns, reframes positively, builds trust through transparency
- **4 - Good:** Addresses concerns well with minor missed opportunities
- **3 - Fair:** Acknowledges but doesn't reframe effectively
- **2 - Poor:** Defensive or dismissive tone
- **1 - Fail:** Ignores concerns or invalidates them

**Check for:**
- ✅ Validates concern before addressing it
- ✅ Reframes problem (e.g., "free" equipment = vendor lock-in)
- ✅ Not defensive or salesy
- ✅ Builds trust through transparency
- ✅ Turns objection into opportunity

---

#### Column K: CTA_Score (1-5)
**Question:** Is there a clear, natural next step?

**Scoring Guide:**
- **5 - Excellent:** Clear CTA, mentions PPP Audit, natural and actionable
- **4 - Good:** Good CTA with minor issues
- **3 - Fair:** CTA present but vague or weak
- **2 - Poor:** Forced or too salesy
- **1 - Fail:** No clear next step

**Check for:**
- ✅ Clear next step provided
- ✅ Mentions PPP Audit or similar entry point
- ✅ Feels natural (not forced)
- ✅ Easy to act on
- ✅ Aligned with "long game" positioning

---

### CALCULATED COLUMN

#### Column L: Overall_Score (Auto-calculated)
**Leave this blank** - You'll calculate it as the average of columns G-K.

Formula: `=(G2+H2+I2+J2+K2)/5`

---

### QUALITATIVE FEEDBACK COLUMNS

#### Column M: What_Worked_Well
**Instructions:** Write 2-3 specific things this response did well.

**Be specific!** Instead of "good answer," write:
- "Great use of the reframing line about vendor ownership"
- "Specific NOI examples tied to retention metrics"
- "Clear PPP 5C framework explanation with real scenarios"

---

#### Column N: Needs_Improvement
**Instructions:** Write 2-3 specific issues to address.

**Be specific!** Instead of "not great," write:
- "Used 'infrastructure' alone without 'digital' modifier in paragraph 3"
- "Didn't mention PPP Audit as entry point"
- "Too technical in section 2 - needs plain language translation"
- "Contains emoji icons (need to be removed)"

---

#### Column O: Training_Notes
**Instructions:** Specific instructions for how to improve this type of response.

**Examples:**
- "Always say 'digital infrastructure' not just 'infrastructure'"
- "When discussing cost, lead with P&L impact before pricing details"
- "Include PPP Audit as first step for discovering specific value"
- "Translate 'Building of Things' into plain English immediately"

---

### AUTO-POPULATED CHECK COLUMNS

These are already filled in - **review for accuracy:**

#### Column P: Has_Emojis (YES/NO)
- Should be **NO** for all responses (emojis = formatting issue)
- If YES, note in "Needs_Improvement"

#### Column Q: Sources_Collapsed (YES/NO)
- Should be **YES** for all responses (sources in dropdown)
- If NO, note in "Needs_Improvement"

#### Column R: Uses_Digital_Infrastructure (YES/NO)
- Should be **YES** for infrastructure-related questions
- Check that it says "digital infrastructure" not just "infrastructure"

#### Column S: Mentions_PPP_Audit (YES/NO)
- Should be **YES** for most responses
- PPP Audit = primary entry point/CTA

#### Column T: Includes_CTA (YES/NO)
- Should be **YES** for all responses
- Check that CTA is clear and actionable

---

### METADATA COLUMNS

#### Column V: Reviewer_Name
**Fill in:** Your name

#### Column W: Review_Date
**Fill in:** Today's date (MM/DD/YYYY)

---

## Scoring Quick Reference

### What Makes a "5" Response?

**Brand Voice (5):**
- Sounds like trusted advisor throughout
- Perfect terminology (digital infrastructure, PPP, 5S)
- Strong reframing of vendor dependency
- "You" language focused on owner outcomes

**Content (5):**
- Directly answers the question
- Specific examples and numbers
- Ties everything to NOI, control, retention, or future-proofing
- Perfect depth - thorough but not overwhelming

**Formatting (5):**
- Clean headers and structure
- Easy to skim in 10 seconds
- Professional markdown
- NO emojis anywhere
- Sources collapsed in dropdowns

**Objection Handling (5):**
- Validates concern first
- Reframes positively
- Builds trust through transparency
- Never defensive

**CTA (5):**
- Clear next step
- Mentions PPP Audit
- Natural and easy to act on
- Aligned with long-term value messaging

---

## Common Issues to Watch For

### ❌ Red Flags (Mark these!)
- Any emoji icons (🎙️, 📧, 📇, 🟢, etc.)
- "Infrastructure" without "digital"
- Vendor-speak instead of guide positioning
- Vague answers without specifics
- Missing CTA or PPP Audit mention
- Defensive tone when handling objections
- Sources expanded instead of collapsed

### ✅ Green Flags (Good examples!)
- "If you don't own your digital infrastructure, your vendors do"
- Specific NOI lift examples
- PPP 5C framework clearly explained
- Reframes "free" equipment as vendor lock-in
- Uses "you" language consistently
- Plain English explanations of technical concepts

---

## Tips for Efficient Review

### Time-Saving Strategies
1. **Skim first** - Read question, scan response structure
2. **Score quickly** - Trust your first impression
3. **Be specific in feedback** - More helpful than general comments
4. **Take breaks** - Review 5-10 at a time
5. **Look for patterns** - Same issues across multiple responses?

### If You're Unsure
- Score it as a **3** (fair) and explain why in "Needs_Improvement"
- Better to flag potential issues than miss them
- Your feedback is valuable - trust your judgment

---

## What Happens Next

### After You Complete the Review:
1. **Save the file** with your scores and feedback
2. **Return the CSV** to us
3. **We analyze the results:**
   - Calculate average scores by category
   - Identify patterns in issues
   - Prioritize improvements
4. **Agent training updates:**
   - Update brandscript prompts
   - Add examples for weak areas
   - Refine objection handling scripts
5. **Re-test and validate:**
   - Test improved agent
   - Confirm scores increase
   - Iterate until success criteria met

---

## Success Criteria

**Goal:** Average score of **4.0+** across all responses

**By Category:**
- Brand Voice: Target **4.5+** (most important)
- Content Quality: Target **4.0+**
- Formatting: Target **5.0** (should be perfect)
- Objection Handling: Target **4.0+**
- CTA: Target **4.0+**

---

## Questions?

**If you encounter:**
- **Unclear response** → Note in "Needs_Improvement"
- **Multiple issues** → Prioritize top 2-3 in feedback
- **Technical questions** → Flag for discussion
- **Formatting broken** → Mark Formatting_Score as 1-2

---

## Example Evaluation

Here's a sample of how to fill out one row:

**Question:** "What is a PPP Audit?"

**Agent Response:** "A PPP Audit is our comprehensive assessment of your property's digital infrastructure..."

**Your Scores:**
- Brand_Voice_Score: **4** (good voice, but missed reframing line)
- Content_Quality_Score: **5** (specific, clear examples)
- Formatting_Score: **5** (perfect structure, no emojis)
- Objection_Handling_Score: **N/A or 3** (no objection in this question)
- CTA_Score: **5** (clear call to book PPP Audit)
- Overall_Score: **4.5**

**What_Worked_Well:**
- Clear explanation of PPP Audit process
- Specific examples of what's found (vendor contracts, data blind spots)
- Good use of bullets and structure

**Needs_Improvement:**
- Could include the reframing line about vendor ownership
- Section 2 could tie findings to NOI impact more explicitly

**Training_Notes:**
- When explaining PPP Audit, always connect to outcome (reveals value leaks)
- Include reframing line in PPP-related responses

---

**Ready to start? Open `bulk-test-results-for-review.csv` and begin with Question 1!**

Estimated time: 5-7 minutes per question = 2-3 hours total.
