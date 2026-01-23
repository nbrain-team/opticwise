# OWnet Token Orchestration System - Complete Guide

## Overview

The OWnet agent uses intelligent token orchestration to provide optimal responses while managing Claude's context window efficiently.

## 🚀 NEW: Maximum Detail Command

**Use any of these keywords to get MAXIMUM tokens:**
- `max_tokens`
- `max`
- `maximum`
- `exhaustive`
- `ultra-detailed`

**What it gives you:**
- **Output tokens: 32,768** (8x more than quick answer!)
- **Context window: 200,000** (Claude's full capacity)
- **Temperature: 0.7** (balanced)

**Examples:**
- "max_tokens: list customer questions"
- "Give me an exhaustive analysis of pipeline"
- "Show me maximum detail on Mass Equities"
- "Ultra-detailed breakdown of Q4 activity"

**Perfect for:** When you need the most comprehensive response possible!

---

## Query Classification System

The agent automatically classifies your query into one of 5 types and adjusts its behavior accordingly:

### 1. Deep Analysis (16,384 output tokens)

**Triggers:**
- Keywords: "deep dive", "comprehensive", "detailed analysis", "thorough", "complete report", "full breakdown", "analyze everything", "walk me through", "explain in detail"
- **Context Window**: 180,000 tokens
- **Temperature**: 0.7 (balanced)
- **Use Case**: Comprehensive reports, detailed breakdowns, extensive analysis

**Examples:**
- "Give me a deep dive on all Mass Equities deals"
- "Provide a comprehensive analysis of Q4 pipeline activity"
- "Walk me through everything about the Cardone acquisition"
- "Give me a thorough breakdown of email engagement trends"

### 2. Research (12,288 output tokens)

**Triggers:**
- Keywords: "research", "find all", "show me everything", "tell me about", "what do we know", "history of", "background on", "full context", "catch me up"
- **Auto-upgrade**: "list/show/find" + multiple items + context words
- **Context Window**: 150,000 tokens
- **Temperature**: 0.6 (focused)
- **Use Case**: Information gathering, historical research, comprehensive lists

**Examples:**
- "Find all emails from John Smith"
- "Show me everything about the Riley project"
- "What do we know about competitor mentions?"
- "List 5 real questions with full context" ← Auto-upgraded from quick_answer
- "Give me detailed examples of customer questions" ← Auto-upgraded

**Auto-Upgrade Logic:**
If your query contains "list", "show", "find" BUT also includes:
- Numbers ("5 questions", "10 examples")
- Multiple/several/variety/bunch
- Context words ("realistic", "detailed", "specific", "actual", "real", "with context")
- Query length > 50 characters

→ Automatically upgraded to RESEARCH mode with 12,288 tokens

### 3. Creative (8,192 output tokens)

**Triggers:**
- Keywords: "write", "draft", "compose", "generate", "suggest", "brainstorm", "come up with", "ideas for", "help me write"
- **Context Window**: 100,000 tokens
- **Temperature**: 0.8 (more creative)
- **Use Case**: Content creation, email drafting, brainstorming

**Examples:**
- "Draft an email to Mass Equities about pricing"
- "Write a proposal for the Koelbel deal"
- "Suggest follow-up strategies for cold leads"
- "Help me brainstorm talking points for the Riley meeting"

### 4. Action (4,096 output tokens)

**Triggers:**
- Keywords: "create", "send", "schedule", "update", "delete", "add", "remove", "modify", "set", "change"
- **Context Window**: 100,000 tokens
- **Temperature**: 0.4 (precise)
- **Use Case**: Executing commands, making changes

**Examples:**
- "Create a new deal for Cardone"
- "Schedule a meeting with John"
- "Update the Mass Equities stage to Proposal"
- "Add a note to the Koelbel deal"

### 5. Quick Answer (4,096 output tokens, 8,192 for follow-ups)

**Triggers:**
- Keywords: "what is", "who is", "when", "where", "how many", "count", "status"
- **Default**: Used when no other patterns match
- **Context Window**: 100,000 tokens
- **Temperature**: 0.7 (balanced)
- **Use Case**: Simple factual queries, status checks

**Examples:**
- "What is the status of the Riley deal?"
- "Who is the owner of Mass Equities?"
- "How many open deals do we have?"
- "When was the last activity on Koelbel?"

**Follow-up Enhancement:**
If your query starts with "no", "not", "more", "better", "different", "instead", "actually":
- Recognized as follow-up to previous question
- Output tokens increased from 4,096 → 8,192
- Allows for better clarification responses

---

## Token Budget Breakdown

### Context Window Allocation

```
Total Context Window (varies by query type):
├── Quick Answer/Action/Creative: 100,000 tokens
├── Research: 150,000 tokens
└── Deep Analysis: 180,000 tokens

Budget Breakdown:
├── System Prompt: ~5,000 tokens
│   ├── Base instructions
│   ├── Style guide examples
│   ├── Current date/time context
│   └── Communication rules
│
├── User Query: ~40-200 tokens
│   └── Your actual question
│
├── Reserved for Output: 4,096 - 16,384 tokens
│   └── Claude's response (varies by type)
│
└── Available for Context: Remaining tokens
    └── Data loaded from various sources
```

### Context Loading Priority

The system loads context in this priority order until the budget is full:

**Priority 1: Chat History** (up to 50,000 tokens)
- Last 20 messages from current session
- Most recent first
- Critical for context continuity

**Priority 2: Call Transcripts** (up to 60,000 tokens)
- Top 10 most semantically similar transcripts
- Includes summaries and key discussions
- PostgreSQL pgvector search

**Priority 3: Emails** (up to 40,000 tokens)
- Top 15 most relevant emails
- Subject, sender, date, preview
- PostgreSQL pgvector search

**Priority 4: Calendar Events** (up to 20,000 tokens)
- Relevant meetings and events
- Attendees, dates, descriptions

**Priority 5: Drive Files** (up to 30,000 tokens)
- Relevant documents
- Content previews

**Priority 6: CRM Data** (remaining tokens)
- Deals, contacts, organizations
- Structured data from database

---

## Smart Intent Detection Examples

### Example 1: Simple List → Research Upgrade

**Query:** "list 5 real questions customers have asked"

**Detection:**
- ✅ Contains "list" (quick_answer keyword)
- ✅ Contains number "5" (needsMultipleItems = true)
- ✅ Contains "real" (needsDetailSignals = true)
- ✅ Query length 43 chars (borderline)

**Classification:** Quick Answer (should be Research)
**Suggested Improvement:** "Show me 5 detailed customer questions with full context"
- Now includes "detailed" + "full context" → Triggers Research mode

### Example 2: Natural Follow-up

**Query:** "no i need more realistic style questions that would be good to use to test the agent"

**Detection:**
- ✅ Starts with "no" (isFollowUp = true)
- ✅ Contains "more", "realistic", "good to use" (context signals)
- ✅ Length 83 chars

**Classification:** Quick Answer with 8,192 tokens (follow-up bonus)
**Better Classification:** Should be Research (12,288 tokens)

**Why:** The query asks for "realistic" examples "good to use" which signals need for quality and context

### Example 3: Comprehensive Request

**Query:** "Give me a comprehensive breakdown of all customer email questions with full context and examples"

**Detection:**
- ✅ "comprehensive" (deepAnalysisKeywords)
- ✅ "breakdown" (deepAnalysisKeywords)
- ✅ "full context" (needsDetailSignals)
- ✅ "examples" (needsDetailSignals)

**Classification:** Deep Analysis (16,384 tokens) ✅ Correct!

---

## Enhanced Classification Rules (NEW)

### Auto-Upgrade Logic

Your query gets **automatically upgraded** to Research mode (12,288 tokens) if:

1. Contains list/show/find keywords **AND**
2. Asks for multiple items (5 questions, several examples, bunch of deals) **AND**
3. Includes quality/context signals:
   - "realistic", "detailed", "specific", "actual", "real"
   - "with context", "with details", "with examples"
   - "good to use", "better", "more"
4. Query length > 50 characters

### Follow-up Detection (NEW)

Queries starting with these get 2x output tokens:
- "no", "not", "more", "better", "different"
- "instead", "actually", "i mean", "i need"
- Quick answers: 4,096 → 8,192 tokens
- Research: 12,288 → 16,384 tokens (if also matches upgrade criteria)

---

## How to Get Better Responses

### If You Want Detailed Analysis:

❌ **Don't say:** "list 5 questions"
✅ **Do say:** "Give me a detailed breakdown of 5 real customer questions with full context"

❌ **Don't say:** "show me deals"
✅ **Do say:** "Show me a comprehensive overview of all active deals"

❌ **Don't say:** "what's happening with Riley"
✅ **Do say:** "Walk me through everything about the Riley deal"

### Keywords That Maximize Token Allocation:

**Trigger Deep Analysis (16,384 tokens):**
- "comprehensive", "thorough", "deep dive", "complete report"
- "detailed analysis", "full breakdown", "analyze everything"
- "walk me through", "explain in detail"

**Trigger Research (12,288 tokens):**
- "show me everything", "find all", "tell me about"
- "what do we know", "full context", "catch me up"
- OR: "list/show/find" + numbers + "detailed/realistic/actual"

**Trigger Creative (8,192 tokens):**
- "write", "draft", "compose", "generate"
- "brainstorm", "suggest", "come up with"

### Query Length Matters:

- **Short queries** (< 50 chars): Usually quick_answer (4,096 tokens)
- **Medium queries** (50-150 chars): Can trigger research if has context signals
- **Long queries** (> 150 chars): Higher chance of deep_analysis classification

---

## Examples by Intent

### Deep Analysis Examples (16,384 tokens):

1. "Give me a comprehensive analysis of pipeline health"
2. "Provide a detailed breakdown of Q4 email engagement"
3. "Walk me through everything about our Mass Equities relationship"
4. "Deep dive into why deals are stalling in Discovery stage"
5. "Thorough analysis of competitor mentions in transcripts"

### Research Examples (12,288 tokens):

1. "Show me everything about John Smith's interactions"
2. "Find all emails mentioning pricing objections"
3. "What do we know about the Cardone acquisition timeline?"
4. "List 10 detailed customer questions with full context"
5. "Tell me about our relationship with Riley Companies"

### Creative Examples (8,192 tokens):

1. "Draft a follow-up email to Mass Equities about pricing"
2. "Write a proposal summary for the Koelbel deal"
3. "Suggest 5 talking points for the Riley technical review"
4. "Help me brainstorm next steps for stalled deals"
5. "Compose a re-engagement email for cold prospects"

### Quick Answer Examples (4,096 tokens):

1. "What's the status of the Riley deal?"
2. "How many deals are in Discovery stage?"
3. "When was the last Mass Equities activity?"
4. "Who owns the Koelbel deal?"
5. "List my top 3 deals by value"

### Follow-up Examples (8,192 tokens):

1. "No, I need more detail on those"
2. "Actually, show me realistic examples"
3. "Better question - what about closed-won deals?"
4. "More context please"
5. "Different format - with deal stages included"

---

## Current Configuration

Based on your logs:

```javascript
{
  maxTokens: 100,000,        // Context window (quick_answer)
  systemPromptTokens: 5,000, // Instructions
  queryTokens: 39,           // Your question
  historyTokens: 273,        // Chat history
  availableForContext: 78,577 // For data loading
}
```

**Output tokens:** 4,096 (quick_answer mode)

### Your Query Was Classified As:
- Type: `quick_answer`
- Confidence: 60%
- Output limit: 4,096 tokens

**Should have been:** `research` (12,288 tokens)
**Why:** Query asked for "realistic", "good to use", "more" which signals need for detailed context

---

## Recommendations

### For Your Use Case:

When asking for examples/questions to test with:

✅ **Best phrasing:**
"Give me a comprehensive list of 5-10 real customer questions with full context and details that would be good for testing"

This triggers:
- Classification: deep_analysis or research
- Output tokens: 12,288-16,384
- Context window: 150,000-180,000
- Better quality, more detailed responses

### General Tips:

1. **Use "comprehensive", "detailed", "thorough"** for long-form responses
2. **Add "with context", "with examples", "specific"** to upgrade classification
3. **Follow-ups work better** if you add "more detail", "be specific", "expand on that"
4. **Natural language works** - the system is smart about intent

---

## After This Update

Your queries will now:
- ✅ Auto-upgrade "list X items" to research mode when asking for details
- ✅ Give follow-ups 2x more tokens automatically
- ✅ Better detect when you need comprehensive vs quick responses
- ✅ Match natural conversation patterns better

**Test with:** "Show me 5 realistic customer questions with full context"
- Should classify as: research (12,288 tokens)
- Will provide much better detail!
