# Bulk Agent Training Question Generation - Reusable Instructions

## 📋 Project Overview

This document provides step-by-step instructions for creating a comprehensive set of evaluation questions to test and train an AI agent's ability to mine and synthesize data from a Vector Database across multiple data sources.

## 🎯 Objective

Create real-world, specific questions that test the AI agent's ability to:
1. Mine data from multiple sources in the Vector Database
2. Apply appropriate orchestration rules (quick answer, standard, detailed, comprehensive)
3. Synthesize information across different data types
4. Generate accurate, contextual, and actionable responses

---

## 📊 Understanding the Data Sources

Before creating questions, identify what data sources the client's AI agent has access to. Common sources include:

### Typical Data Sources:
- **Meeting Transcripts** - Full transcript text, action items, participants, topics, key questions
- **Documents** - Proposals, SOPs, templates, training materials, marketing content
- **Email Threads** - Full email conversations with contact linking
- **Website Content** - Vectorized company website (services, case studies, testimonials)
- **CRM Data** - Contacts, companies, deals, engagement metrics
- **Other Sources** - Custom data specific to the client

### Document the Available Sources:
Before starting, create a list of:
1. What data sources exist?
2. What content is in each source?
3. How is the data structured?
4. What metadata is available?

---

## 🧠 Understanding Orchestration Rules

The agent typically uses dynamic token allocation based on query complexity:

| **Complexity Level** | **Max Tokens** | **Use Case** | **Example Query Type** |
|---------------------|---------------|--------------|----------------------|
| **Quick Answer** | 4,000 | Simple factual queries, single source | "What training materials do we have?" |
| **Standard** | 16,000 | Multi-source queries, moderate complexity | "What action items are open for Client X?" |
| **Detailed** | 32,000 | Deep analysis, pattern recognition | "Find all competitor mentions and comparison points" |
| **Comprehensive** | 64,000 | Full research mode, exhaustive synthesis | "Create quarterly business review with trends and recommendations" |

---

## 📁 Step-by-Step Instructions

### **Phase 1: Initial Question Set (5 Categories × 5 Questions = 25 Total)**

#### Step 1: Identify Business Categories

Work with the client to identify 5 main business categories that are most relevant to their operations. Common categories include:

1. **Client Engagement & Relationship Management**
   - Focus: Transcript analysis, email mining, CRM synthesis
   - Tests: Commitment tracking, follow-ups, relationship insights

2. **Sales & Business Development**
   - Focus: Proposal mining, pricing queries, competitive intelligence
   - Tests: Document search, pricing extraction, objection handling

3. **Technical Delivery & Project Management**
   - Focus: SOP retrieval, technical documentation, implementation tracking
   - Tests: Process extraction, issue tracking, project health

4. **Marketing & Content Generation**
   - Focus: Brand voice analysis, content creation, case study mining
   - Tests: Brand consistency, testimonial extraction, FAQ generation

5. **Strategic Insights & Analytics**
   - Focus: Cross-source analysis, trend identification, market intelligence
   - Tests: Sales cycle analytics, trend detection, strategic planning

**Customize these categories based on the client's business model and priorities.**

---

#### Step 2: Create 5 Questions Per Category

For each category, create 5 questions with the following distribution:
- **1 Quick Answer** (simple, single-source)
- **2 Standard** (moderate complexity, 2-3 sources)
- **1 Detailed** (deep analysis, pattern recognition)
- **1 Comprehensive** (full research mode, multi-source synthesis)

---

#### Step 3: Question Design Principles

Each question must meet these criteria:

✅ **Real-World Relevance**
- Based on actual business needs and use cases
- Reflects questions stakeholders would genuinely ask
- Provides actionable insights when answered

✅ **Data Specificity**
- Designed to have verifiable answers in the existing data
- References real clients, services, and scenarios (where applicable)
- Tests specific data source capabilities

✅ **Orchestration Diversity**
- Mix of quick answer, standard, detailed, and comprehensive queries
- Tests different token allocation strategies
- Validates dynamic complexity classification

✅ **Multi-Source Integration**
- Some questions require single-source retrieval (simple)
- Others require cross-referencing multiple sources (complex)
- Tests the agent's ability to synthesize disparate data

✅ **Implicit & Explicit Information**
- Tests both direct fact retrieval and contextual inference
- Requires sentiment analysis, pattern recognition, and trend identification
- Validates semantic understanding beyond keyword matching

---

#### Step 4: Question Template Structure

For each question, document:

```
Category: [Category Name]
Question_ID: [X.Y format, e.g., 1.1, 2.3]
Question_Text: [The actual question]
Complexity_Level: [Quick Answer | Standard | Detailed | Comprehensive]
Primary_Data_Sources: [List of data sources needed]
Orchestration_Test: [What technical capability this tests]
Why_This_Question: [Business rationale and learning objective]
```

---

#### Step 5: Example Questions (Template)

**Category 1: Client Engagement & Relationship Management**

**Question 1.1 (Standard)**
```
Question: What are all the open action items and commitments made by the [Company] team in meetings with [Client Name] over the last 30 days?

Complexity: Standard
Data Sources: Transcripts, Action Items
Orchestration Test: Transcript search → Action item extraction → Time filtering → Commitment tracking
Why: Tests ability to find specific client, filter by date range, extract commitments with owners and deadlines
```

**Question 1.2 (Standard)**
```
Question: Which prospects in our CRM have shown high engagement (opened 5+ emails, clicked links) but haven't had a meeting scheduled in the last 60 days?

Complexity: Standard
Data Sources: CRM, Transcripts
Orchestration Test: CRM engagement filtering → Cross-reference with transcript dates → Identify gaps
Why: Tests CRM data mining, engagement metrics, cross-referencing with meeting data, and opportunity identification
```

**Question 1.3 (Detailed)**
```
Question: Find all email threads where a prospect asked about [key service] timelines and we mentioned [unique value proposition]. What were their specific concerns?

Complexity: Detailed
Data Sources: Email Threads, Vector Search
Orchestration Test: Semantic email search → Context extraction → Concern identification → Pattern recognition
Why: Tests email mining, semantic understanding, extracting implicit concerns, and identifying sales objections
```

**Question 1.4 (Quick Answer)**
```
Question: What topics were discussed in the most recent meeting with [Client Name], and who from their team participated?

Complexity: Quick Answer
Data Sources: Transcripts
Orchestration Test: Simple transcript search → Date sorting → Participant extraction
Why: Tests basic transcript retrieval, recency filtering, and participant identification
```

**Question 1.5 (Comprehensive)**
```
Question: Analyze all client interactions (meetings, emails, CRM notes) with [industry vertical] companies in Q4 2025. What are the top 3 recurring pain points they mentioned?

Complexity: Comprehensive
Data Sources: Transcripts, Emails, CRM, Vector Search
Orchestration Test: Multi-source aggregation → Industry filtering → Pattern recognition → Frequency analysis → Insight synthesis
Why: Tests comprehensive research mode, cross-source synthesis, pattern detection, and strategic insight generation
```

**Repeat this pattern for all 5 categories.**

---

### **Phase 2: Client Review & Approval**

#### Step 6: Present Initial 25 Questions

Create a CSV file with these columns:
- Category
- Question_ID
- Question_Text
- Complexity_Level
- Primary_Data_Sources
- Orchestration_Test
- Why_This_Question

**Deliverable:** `AGENT-EVALUATION-QUESTIONS.csv`

#### Step 7: Gather Client Feedback

Ask the client to review and provide feedback on:
- ✅ Are these questions relevant to your business?
- ✅ Do they cover the right areas?
- ✅ Are they specific enough to have verifiable answers?
- ✅ Should we adjust the complexity distribution?
- ✅ Are there specific scenarios or use cases we should add?

#### Step 8: Iterate Based on Feedback

- Modify questions based on client input
- Add/remove questions as needed
- Adjust complexity levels if needed
- Ensure all questions are realistic and answerable

---

### **Phase 3: Expansion (After Approval)**

#### Step 9: Expand to Full Question Set

Once the initial 25 questions are approved, expand to the desired total:

**Expansion Options:**
- **50 questions** (10 per category) - Good for initial testing
- **125 questions** (25 per category) - Comprehensive coverage
- **250 questions** (50 per category) - Exhaustive testing

**Maintain the same quality standards:**
- Real-world scenarios
- Diverse complexity levels
- Multi-source integration
- Actionable insights

#### Step 10: Add Feedback Columns

Create an enhanced CSV with feedback columns for training:

**Additional Columns:**
1. **Agent_Response** - Where the AI agent's actual response will be inserted
2. **Response_Accuracy** (1-5 scale) - How factually correct was the response?
3. **Response_Completeness** (1-5 scale) - Did it answer all parts of the question?
4. **Response_Relevance** (1-5 scale) - Was the response on-topic and useful?
5. **Data_Sources_Used_Correctly** (Yes/No/Partial) - Did the agent use the right data sources?
6. **Missing_Information** - What important information was left out?
7. **Incorrect_Information** - What facts or details were wrong?
8. **Suggested_Improvements** - Specific guidance on how to improve this type of response
9. **Overall_Rating** (1-5 scale) - Overall quality assessment
10. **Training_Notes** - Technical notes for agent training/tuning

**Deliverable:** `AGENT-EVALUATION-QUESTIONS-[NUMBER]-WITH-FEEDBACK.csv`

---

### **Phase 4: Execution & Training**

#### Step 11: Run Questions Through Agent

1. Take each question from the CSV
2. Input it into the AI agent
3. Capture the full response
4. Insert response into the `Agent_Response` column
5. Note: token usage, execution time, data sources accessed

#### Step 12: Client Reviews Responses

Client fills out the feedback columns:
- Rates accuracy, completeness, relevance (1-5)
- Identifies missing or incorrect information
- Provides specific improvement suggestions
- Gives overall rating
- Adds training notes

#### Step 13: Analyze Patterns

Look for patterns in the feedback:
- Which question types work best?
- Which data sources are most/least effective?
- Which complexity levels need tuning?
- What are common failure modes?

#### Step 14: Tune the Agent

Based on feedback patterns:
- Adjust prompts for better accuracy
- Optimize data retrieval strategies
- Refine orchestration rules
- Improve error handling
- Update system prompts

#### Step 15: Re-test & Validate

- Re-run failed questions after improvements
- Validate that changes improved performance
- Document what worked and what didn't
- Create training benchmarks from successful responses

---

## 📝 Example Feedback (First 3 Rows)

### Row 1: Good but Incomplete (Rating: 4/5)
```
Question: What are all the open action items and commitments made by the team in meetings with Seagate Technology over the last 30 days?

Agent Response: [Response here]

Response_Accuracy: 5
Response_Completeness: 4
Response_Relevance: 5
Data_Sources_Used_Correctly: Yes
Missing_Information: Missed the action item from the Dec 15 meeting where Chris committed to sending the integration spec by Dec 20
Incorrect_Information: None - all information provided was accurate
Suggested_Improvements: Include action items from ALL meetings in the date range, not just the most recent ones. Make sure to capture implicit commitments (e.g., "I'll look into that" should be flagged as a follow-up item)
Overall_Rating: 4
Training_Notes: Agent correctly identified most action items but needs to scan ALL transcripts in date range, not just recent ones. Training: Emphasize exhaustive search within time boundaries.
```

### Row 2: Perfect Response (Rating: 5/5)
```
Question: Which prospects in our CRM have shown high engagement (opened 5+ emails, clicked links) but haven't had a meeting scheduled in the last 60 days?

Agent Response: [Response here]

Response_Accuracy: 5
Response_Completeness: 5
Response_Relevance: 5
Data_Sources_Used_Correctly: Yes
Missing_Information: None - response was comprehensive
Incorrect_Information: None
Suggested_Improvements: Perfect response. This is the quality standard we want.
Overall_Rating: 5
Training_Notes: Excellent example of cross-source data correlation. Agent properly filtered CRM engagement metrics and cross-referenced with meeting transcripts. Use as training benchmark.
```

### Row 3: Needs Improvement (Rating: 3/5)
```
Question: Find all email threads where a prospect asked about implementation timelines and we mentioned the 30-day guarantee. What were their specific concerns?

Agent Response: [Response here]

Response_Accuracy: 3
Response_Completeness: 3
Response_Relevance: 4
Data_Sources_Used_Correctly: Partial
Missing_Information: Agent found the email threads but didn't extract the underlying concerns (budget anxiety, team readiness, data migration complexity). Only listed surface-level questions.
Incorrect_Information: Stated that "all prospects were satisfied with the 30-day timeline" but one prospect (TechStaff Solutions) actually expressed skepticism in their Dec 10 email
Suggested_Improvements: Go deeper into the "why" behind questions. When prospects ask about timelines, identify the underlying concern (risk, budget, resources, etc.). Look for sentiment and tone, not just keywords.
Overall_Rating: 3
Training_Notes: Agent needs training on implicit concern extraction. It found the right emails but didn't analyze the subtext. Training: Add examples of surface questions vs. underlying concerns (e.g., "How many resources do we need?" = concern about internal capacity/disruption).
```

---

## ✅ Quality Checklist

Before finalizing questions, verify:

- [ ] All questions are based on real business needs
- [ ] Questions are specific enough to have verifiable answers
- [ ] Complexity distribution is appropriate (mix of quick/standard/detailed/comprehensive)
- [ ] All major data sources are tested
- [ ] Questions cover tactical to strategic levels
- [ ] Both explicit and implicit information retrieval is tested
- [ ] Multi-source synthesis is tested
- [ ] Pattern recognition and trend analysis is tested
- [ ] Questions are realistic (stakeholders would actually ask them)
- [ ] Each question has clear success criteria

---

## 🎯 Success Criteria

The evaluation will be successful if:

1. ✅ 80%+ of questions produce accurate, relevant responses
2. ✅ Orchestration rules correctly classify query complexity
3. ✅ Multi-source synthesis works seamlessly
4. ✅ Response times are acceptable (<30s for standard, <60s for comprehensive)
5. ✅ Agent identifies gaps in data and communicates them clearly
6. ✅ Brand voice and tone remain consistent across responses
7. ✅ Citations and confidence scores are accurate

---

## 📂 Deliverables Summary

### Phase 1: Initial Set
- `AGENT-EVALUATION-QUESTIONS.csv` (25 questions)

### Phase 2: After Approval
- `AGENT-EVALUATION-QUESTIONS-FULL.csv` (expanded set)
- `AGENT-EVALUATION-QUESTIONS-[NUMBER]-WITH-FEEDBACK.csv` (with feedback columns)

### Phase 3: After Execution
- Completed CSV with agent responses and client feedback
- Training analysis document
- Agent tuning recommendations
- Performance benchmarks

---

## 🔄 Reusable Process

To use this for another client:

1. **Understand their data sources** - What do they have access to?
2. **Identify their business categories** - What are their key functions?
3. **Create 5 questions per category** (25 total) - Follow the template
4. **Get client approval** - Review and iterate
5. **Expand to full set** - Scale to desired number
6. **Add feedback columns** - Prepare for training
7. **Execute and analyze** - Run through agent and gather feedback
8. **Tune and improve** - Use feedback to optimize agent
9. **Re-test and validate** - Verify improvements

---

## 📞 Tips for Success

**DO:**
- ✅ Start small (25 questions) and expand after approval
- ✅ Use real client/project names where possible
- ✅ Test both successful and edge cases
- ✅ Include questions that test error handling
- ✅ Make questions specific and verifiable
- ✅ Focus on actionable insights, not just data retrieval

**DON'T:**
- ❌ Create generic, vague questions
- ❌ Skip the client review phase
- ❌ Make up data or scenarios that don't exist
- ❌ Focus only on easy questions
- ❌ Ignore the orchestration complexity levels
- ❌ Forget to test multi-source synthesis

---

## 🔒 Security & Privacy

- Add sensitive environment files to `.gitignore`
- Keep all deliverables local (don't push to GitHub unless approved)
- Redact sensitive client information if sharing examples
- Follow client data handling policies

---

## 📚 Reference Example

See `AGENT-EVALUATION-QUESTIONS-250-WITH-FEEDBACK.csv` for a complete example of:
- Question structure and format
- Complexity distribution across categories
- Feedback column examples
- Training notes format

---

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Ready for reuse across clients
