# Agent Evaluation Feedback Guide
## How to Fill Out Columns I-Q

This guide explains how to evaluate and provide feedback on your AI agent's responses using the evaluation CSV.

---

## 📊 Feedback Columns Overview

After running a question through your OWnet agent, you'll fill out these 10 feedback columns:

| Column | Name | Type | Purpose |
|--------|------|------|---------|
| **I** | Agent_Response | Text | The full response from the AI agent |
| **J** | Response_Accuracy | 1-5 | How factually correct was the response? |
| **K** | Response_Completeness | 1-5 | Did it answer all parts of the question? |
| **L** | Response_Relevance | 1-5 | Was the response on-topic and useful? |
| **M** | Data_Sources_Used_Correctly | Yes/No/Partial | Did the agent use the right data sources? |
| **N** | Missing_Information | Text | What important information was left out? |
| **O** | Incorrect_Information | Text | What facts or details were wrong? |
| **P** | Suggested_Improvements | Text | Specific guidance on how to improve |
| **Q** | Overall_Rating | 1-5 | Overall quality assessment |
| **R** | Training_Notes | Text | Technical notes for agent training/tuning |

---

## 📝 Column-by-Column Instructions

### Column I: Agent_Response
**What to do:** Copy and paste the FULL response from your OWnet agent exactly as it appeared.

**Example:**
```
Based on recent meetings with Koelbel Co, here are the open action items from the last 30 days:

**From Meeting on Dec 15, 2025:**
- Bill to send updated proposal with revised timeline by Dec 20 (Owner: Bill Smith)
- Technical team to schedule architecture review call (Owner: Tech Team)
...
```

**Tips:**
- Include all formatting (bullets, bold, etc.)
- Don't edit or clean up the response
- Capture the complete response, not just a summary

---

### Column J: Response_Accuracy (1-5 Scale)

**Rating Scale:**
- **5 = Perfect** - All facts are 100% correct, no errors
- **4 = Mostly Accurate** - Minor factual errors that don't significantly impact usefulness
- **3 = Somewhat Accurate** - Some notable errors but core information is correct
- **2 = Mostly Inaccurate** - Significant errors that undermine the response
- **1 = Completely Wrong** - Fundamentally incorrect or fabricated information

**What to check:**
- ✅ Are client names spelled correctly?
- ✅ Are dates accurate?
- ✅ Are dollar amounts correct?
- ✅ Are deal stages/statuses accurate?
- ✅ Are participant names correct?
- ✅ Are facts verifiable against actual data?

**Example Rating:**
- **5/5**: "Koelbel Co deal is $50,000 in DDI Review Proposed stage" ✅ (verified in CRM)
- **3/5**: "Last meeting was Dec 15" but it was actually Dec 18 ❌ (date error)

---

### Column K: Response_Completeness (1-5 Scale)

**Rating Scale:**
- **5 = Complete** - Answered every part of the question thoroughly
- **4 = Mostly Complete** - Answered main parts but missed minor details
- **3 = Partially Complete** - Answered some parts but left out important information
- **2 = Incomplete** - Only answered a small portion of the question
- **1 = Barely Answered** - Didn't really address the question

**What to check:**
- ✅ Did it answer ALL parts of a multi-part question?
- ✅ Did it provide the level of detail requested?
- ✅ Did it include examples when asked?
- ✅ Did it cover the full time range specified?
- ✅ Did it address implicit aspects of the question?

**Example:**
- Question: "What are the open action items AND who owns them AND what are the deadlines?"
- **5/5**: Provided items, owners, AND deadlines ✅
- **3/5**: Provided items and owners but missed deadlines ❌

---

### Column L: Response_Relevance (1-5 Scale)

**Rating Scale:**
- **5 = Highly Relevant** - Directly addresses the question with useful, actionable information
- **4 = Mostly Relevant** - On-topic with minor tangents or unnecessary details
- **3 = Somewhat Relevant** - Partially on-topic but includes irrelevant information
- **2 = Barely Relevant** - Mostly off-topic or not useful
- **1 = Irrelevant** - Completely off-topic or useless

**What to check:**
- ✅ Does the response directly answer what was asked?
- ✅ Is the information actionable and useful?
- ✅ Does it stay focused on the topic?
- ✅ Does it avoid unnecessary tangents?

**Example:**
- Question: "What objections did prospects raise?"
- **5/5**: Lists specific objections with context ✅
- **2/5**: Talks about general sales process instead of objections ❌

---

### Column M: Data_Sources_Used_Correctly (Yes/No/Partial)

**Options:**
- **Yes** - Agent used the correct data sources and searched them properly
- **No** - Agent used wrong data sources or failed to search the right ones
- **Partial** - Agent used some correct sources but missed others

**What to check:**
- ✅ Did the agent search the data sources listed in column E?
- ✅ Did it combine multiple sources when needed?
- ✅ Did it miss any obvious data sources?
- ✅ Did it search the right date ranges?

**Example:**
- Question requires: "Call Transcripts + Gmail Messages"
- **Yes**: Response clearly references both transcripts and emails ✅
- **Partial**: Only searched transcripts, ignored emails ❌
- **No**: Only searched CRM, ignored transcripts and emails ❌

---

### Column N: Missing_Information (Text)

**What to do:** Describe what important information the agent LEFT OUT that should have been included.

**Be specific:**
- ❌ Bad: "Missing some details"
- ✅ Good: "Missed the action item from the Dec 22 meeting where we committed to sending integration documentation by Dec 30"

**Examples:**
```
"Missed the action item from the Dec 22 meeting where we committed to sending integration documentation by Dec 30. Also didn't specify exact deadlines for items that had them."

"Agent found the email threads but didn't extract the underlying concerns (budget anxiety, team readiness, data migration complexity). Only listed surface-level questions."

"Didn't include sentiment analysis or client satisfaction indicators, which would have provided context for the relationship health."
```

**If nothing is missing:**
```
"None - response was comprehensive"
```

---

### Column O: Incorrect_Information (Text)

**What to do:** Describe what facts or details were WRONG in the response.

**Be specific:**
- ❌ Bad: "Some errors"
- ✅ Good: "Stated that 'all prospects were satisfied with the 30-day timeline' but one prospect (TechStaff Solutions) actually expressed skepticism in their Dec 10 email"

**Examples:**
```
"Stated that 'all prospects were satisfied with the 30-day timeline' but one prospect (TechStaff Solutions) actually expressed skepticism in their Dec 10 email"

"Said last meeting was Dec 15 but it was actually Dec 18 according to the transcript"

"Claimed deal value is $75K but CRM shows $50K"
```

**If nothing is incorrect:**
```
"None - all information provided was accurate"
```

---

### Column P: Suggested_Improvements (Text)

**What to do:** Provide SPECIFIC, ACTIONABLE guidance on how the agent should improve this type of response.

**Be prescriptive:**
- ❌ Bad: "Be more accurate"
- ✅ Good: "Include action items from ALL meetings in the date range, not just the most recent ones. Make sure to capture implicit commitments (e.g., 'I'll look into that' should be flagged as a follow-up item)"

**Examples:**
```
"Include action items from ALL meetings in the date range, not just the most recent ones. Make sure to capture implicit commitments (e.g., 'I'll look into that' should be flagged as a follow-up item)"

"Go deeper into the 'why' behind questions. When prospects ask about timelines, identify the underlying concern (risk, budget, resources, etc.). Look for sentiment and tone, not just keywords."

"Cross-reference CRM data with actual conversation transcripts to validate information. Don't rely solely on CRM fields - check what was actually said in meetings."
```

---

### Column Q: Overall_Rating (1-5 Scale)

**Rating Scale:**
- **5 = Excellent** - This is the quality standard we want; use as benchmark
- **4 = Good** - Solid response with minor improvements needed
- **3 = Acceptable** - Usable but needs significant improvements
- **2 = Poor** - Major issues that make it barely usable
- **1 = Unacceptable** - Completely unusable response

**Consider:**
- Accuracy + Completeness + Relevance
- Usefulness and actionability
- Whether you'd be comfortable sharing this response with a client

**Examples:**
- **5/5**: Perfect response - accurate, complete, relevant, actionable
- **4/5**: Good response with minor gaps but still very useful
- **3/5**: Acceptable but missing key information or has notable errors
- **2/5**: Significant issues that require major rework
- **1/5**: Completely wrong or useless

---

### Column R: Training_Notes (Text)

**What to do:** Write technical notes for how to train/tune the agent to improve performance.

**Focus on:**
- What the agent did well (to reinforce)
- What specific capability needs improvement
- Technical suggestions (prompt changes, search strategies, etc.)
- Whether this should be a training benchmark

**Examples:**
```
"Agent correctly identified most action items but needs to scan ALL transcripts in date range, not just recent ones. Training: Emphasize exhaustive search within time boundaries."

"Excellent example of cross-source data correlation. Agent properly filtered CRM engagement metrics and cross-referenced with meeting transcripts. Use as training benchmark."

"Agent needs training on implicit concern extraction. It found the right emails but didn't analyze the subtext. Training: Add examples of surface questions vs. underlying concerns (e.g., 'How many resources do we need?' = concern about internal capacity/disruption)."
```

---

## 🎯 Evaluation Best Practices

### 1. Be Objective
- Rate based on facts, not feelings
- Verify claims against actual data
- Don't let one error bias the entire rating

### 2. Be Specific
- Vague feedback doesn't help: "needs improvement" ❌
- Specific feedback helps: "missed Dec 22 meeting action items" ✅

### 3. Be Constructive
- Focus on how to improve, not just what's wrong
- Provide examples of what good looks like
- Suggest specific changes

### 4. Be Consistent
- Use the same standards across all questions
- Don't rate harder/easier as you go
- Refer back to previous ratings for consistency

### 5. Document Everything
- If you mark something as incorrect, note what the correct answer is
- If something is missing, specify exactly what should have been included
- Save examples of excellent responses as benchmarks

---

## 📈 Using the Feedback

After completing evaluations:

1. **Calculate Metrics:**
   - Average accuracy score across all questions
   - Percentage of questions with 4+ overall rating
   - Common patterns in missing/incorrect information

2. **Identify Patterns:**
   - Which question types work best?
   - Which data sources are most/least effective?
   - What are common failure modes?

3. **Prioritize Improvements:**
   - Focus on high-frequency issues first
   - Address critical accuracy problems immediately
   - Optimize for most common question types

4. **Create Training Examples:**
   - Save all 5/5 responses as benchmarks
   - Use 1-2 rated responses as "what not to do" examples
   - Document specific improvements that worked

---

## 🔄 Iterative Improvement Process

1. **Evaluate** → Fill out all feedback columns
2. **Analyze** → Look for patterns in the feedback
3. **Tune** → Adjust prompts, search strategies, orchestration
4. **Re-test** → Run failed questions again
5. **Validate** → Verify improvements worked
6. **Document** → Update training benchmarks

---

## ✅ Quality Checklist

Before submitting your evaluation, verify:

- [ ] Agent_Response is complete and unedited
- [ ] All numeric ratings (J, K, L, Q) are filled in
- [ ] Data_Sources_Used_Correctly (M) is Yes/No/Partial
- [ ] Missing_Information (N) is specific or says "None"
- [ ] Incorrect_Information (O) is specific or says "None"
- [ ] Suggested_Improvements (P) is actionable and specific
- [ ] Training_Notes (R) includes technical guidance
- [ ] Ratings are consistent with feedback text
- [ ] You can defend your ratings with evidence

---

**Remember:** The goal is to make the agent better through specific, actionable feedback. Every evaluation is a training opportunity!
