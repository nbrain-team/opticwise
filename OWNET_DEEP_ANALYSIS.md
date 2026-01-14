# OWnet Agent - Deep Analysis Mode

**Date:** January 14, 2026  
**Feature:** Intelligent Deep Analysis Detection  
**Status:** ✅ Deployed

---

## What Is Deep Analysis Mode?

When you ask the OWnet Agent for a "deep dive" or "deep analysis," it automatically switches to a more sophisticated mode that provides:

- ✅ **2x More Tokens** - 8,000 tokens instead of 4,096 (longer, more detailed responses)
- ✅ **Higher Creativity** - Temperature 0.8 instead of 0.7 (more nuanced analysis)
- ✅ **Comprehensive Coverage** - Detailed breakdown of all relevant aspects
- ✅ **Strategic Insights** - Patterns, trends, and actionable recommendations
- ✅ **Specific Examples** - Real names, dates, numbers from your data

---

## Trigger Keywords

The agent automatically detects these phrases and activates deep analysis mode:

- **"deep dive"**
- **"deep analysis"**
- **"detailed analysis"**
- **"comprehensive analysis"**
- **"in-depth"**
- **"thorough analysis"**
- **"detailed report"**
- **"comprehensive report"**
- **"activity report"**
- **"full analysis"**

---

## Example Queries

### Standard Mode (4K tokens)
```
"What are my top deals?"
"Show me recent emails"
"Who should I follow up with?"
```

**Response:** Quick, concise answer with key highlights

---

### Deep Analysis Mode (8K tokens)
```
"Please do a deep dive of activity report of my last month of emails"
"Give me a comprehensive analysis of the Koelbel deal"
"I need a detailed report on Q4 pipeline performance"
"Do an in-depth analysis of our sales conversations"
```

**Response:** Extensive, detailed report with:
- Executive summary
- Multiple sections with deep detail
- Specific examples and data points
- Pattern analysis
- Trend identification
- Strategic recommendations
- Prioritized next steps

---

## What You Get in Deep Analysis Mode

### 1. **Executive Summary**
High-level overview of key findings

### 2. **Detailed Breakdown**
Multiple sections covering different aspects:
- Deal Activity Patterns
- Content Strategy Shifts
- Engagement Quality
- Workflow Improvements
- Timeline Analysis

### 3. **Specific Data Points**
- Actual names (Connor, Bill, Laura, Zain)
- Real dates and timeframes
- Specific numbers and metrics
- Direct quotes from emails/calls

### 4. **Pattern Recognition**
- What's working well
- What's changed over time
- Emerging trends
- Anomalies or concerns

### 5. **Comparative Analysis**
- Week vs. weekend activity
- This month vs. last month
- Different deal stages
- Various contact types

### 6. **Strategic Recommendations**
- What to do next
- Why it matters
- Priority order
- Expected impact

---

## Example: Email Activity Report

### Standard Query:
> "What's been happening with emails?"

**Standard Response (Quick):**
> "You've sent about 45 emails this month, mostly to existing deals. Connor and Bill have been your main contacts. Engagement looks good."

---

### Deep Analysis Query:
> "Please do a deep dive of activity report of my last month of emails"

**Deep Analysis Response (Comprehensive):**
> **Email Activity - Last 30 Days: Comprehensive Analysis**
>
> You've been pretty active on the email front this past month! Let me break down what's been happening:
>
> **Deal Activity Patterns**
> Your email mapping has gotten way more consistent - Connor mentioned you're now mapping every first email you send out, which is paying off. The workflow's getting quicker as you build that habit. Bill noted that once those initial emails are mapped, all the back-and-forth stays connected automatically, so you're only having to manually handle new contacts now.
>
> **Content Strategy Shifts**
> There's been a clear evolution in your posting approach. You've started experimenting with weekend content - more personal management style stuff and resilience coaching snippets on Saturdays and Sundays. Laura and her team noticed this shift and seem supportive of trying different posting days beyond the usual Tuesday-Wednesday-Thursday routine.
>
> **Engagement Quality**
> The audience analysis Zain did shows you're hitting the right people - lots of senior executives and decision makers engaging with your content. Your posts with images, videos, or documents are significantly outperforming text-only ones, which is worth keeping in mind for future content planning.
>
> **Workflow Improvements**
> The CRM mapping process has become more streamlined. You mentioned that important emails get mapped right away now, and the system's accuracy has improved once those initial contacts are properly connected to deals.
>
> What's interesting is how you've started balancing industry topics during the week with more personal leadership content on weekends. That Saturday post about building in public seems to be resonating well with your audience.
>
> Any particular email threads or conversations from this month that you want to dig deeper into?

---

## Technical Details

### Token Allocation

**Standard Mode:**
- Max Tokens: 4,096
- Temperature: 0.7
- Best for: Quick questions, simple lookups, brief summaries

**Deep Analysis Mode:**
- Max Tokens: 8,000 (2x more)
- Temperature: 0.8 (more creative)
- Best for: Comprehensive reports, strategic analysis, detailed insights

### Detection Logic

```typescript
const deepAnalysisKeywords = [
  'deep dive', 'deep analysis', 'detailed analysis',
  'comprehensive analysis', 'in-depth', 'thorough analysis',
  'detailed report', 'comprehensive report', 'activity report',
  'full analysis'
];

const isDeepAnalysis = deepAnalysisKeywords.some(keyword => 
  message.toLowerCase().includes(keyword)
);
```

### System Prompt Enhancement

When deep analysis is detected, the agent receives additional instructions:

1. **Extensive Detail** - Go deep, don't summarize
2. **Multiple Perspectives** - Trends, patterns, anomalies, opportunities
3. **Specific Examples** - Use actual data from CRM/emails/calls
4. **Actionable Insights** - Strategic recommendations with reasoning
5. **Comprehensive Coverage** - Cover all relevant angles
6. **Data-Driven** - Reference specific sources
7. **Timeline Analysis** - Show progression over time
8. **Comparative Analysis** - Compare periods, entities, metrics

---

## Best Practices

### When to Use Deep Analysis

✅ **Good Use Cases:**
- Monthly/quarterly performance reviews
- Deal post-mortems
- Pipeline health checks
- Email activity reports
- Sales conversation analysis
- Strategic planning sessions
- Trend identification
- Problem diagnosis

❌ **Not Needed For:**
- Quick lookups ("What's John's email?")
- Simple questions ("How many deals do I have?")
- Basic status checks ("Is the Koelbel deal active?")
- Quick summaries ("Top 3 deals?")

### How to Ask

**Be Explicit:**
- ✅ "Do a deep dive on..."
- ✅ "Give me a comprehensive analysis of..."
- ✅ "I need a detailed report on..."

**Provide Context:**
- ✅ "...my last month of emails"
- ✅ "...the Q4 pipeline"
- ✅ "...all conversations with Acme Corp"

**Specify Focus (Optional):**
- ✅ "...focusing on engagement patterns"
- ✅ "...with emphasis on decision makers"
- ✅ "...looking at conversion rates"

---

## Response Time

**Standard Mode:** 5-10 seconds  
**Deep Analysis Mode:** 15-30 seconds

Deep analysis takes longer because:
- More tokens to generate (8K vs 4K)
- More complex reasoning required
- More data to process and synthesize

---

## Examples by Use Case

### 1. Email Activity Analysis
**Query:** "Deep dive on my email activity this month"

**Covers:**
- Volume and frequency patterns
- Key contacts and conversations
- Response rates and timing
- Content themes
- Engagement quality
- Workflow improvements
- Strategic recommendations

---

### 2. Deal Performance Review
**Query:** "Comprehensive analysis of the Koelbel deal"

**Covers:**
- Deal history and timeline
- All stakeholders involved
- Email and call history
- Stage progression
- Key decision points
- Blockers and risks
- Win probability
- Next steps with priorities

---

### 3. Pipeline Health Check
**Query:** "In-depth analysis of my current pipeline"

**Covers:**
- Deal distribution by stage
- Value concentration
- Activity patterns
- Stalled deals
- Hot opportunities
- Historical trends
- Conversion rates
- Strategic recommendations

---

### 4. Sales Conversation Analysis
**Query:** "Detailed report on sales calls from last quarter"

**Covers:**
- Call volume and frequency
- Key themes and topics
- Customer pain points
- Objections and concerns
- Success patterns
- Competitive mentions
- Product feedback
- Strategic insights

---

## Monitoring

The agent logs when deep analysis mode is activated:

```
[OWnet] Analysis mode: DEEP ANALYSIS (8000 tokens)
```

This appears in the server logs for monitoring and debugging.

---

## Future Enhancements

Possible improvements:

1. **Custom Depth Levels** - "light", "medium", "deep", "comprehensive"
2. **Focus Areas** - Specify what to analyze in detail
3. **Export Options** - Download as PDF or document
4. **Scheduled Reports** - Automatic weekly/monthly deep dives
5. **Comparison Mode** - "Compare this month to last month"
6. **Visual Analytics** - Charts and graphs in responses

---

## Tips for Best Results

1. **Be Specific** - "Last 30 days" vs "recently"
2. **Use Trigger Words** - Include "deep dive" or "comprehensive"
3. **Provide Context** - What you want to understand and why
4. **Ask Follow-ups** - "Dig deeper into the engagement patterns"
5. **Combine Sources** - "Analyze emails AND call transcripts"

---

**Status:** ✅ Live in Production  
**Activation:** Automatic based on keywords  
**Token Limit:** 8,000 tokens (2x standard)  
**Temperature:** 0.8 (more creative)

