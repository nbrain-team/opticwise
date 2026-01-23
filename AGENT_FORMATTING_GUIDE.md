# OWnet Agent - Professional Formatting Guide

## What Changed

The agent now has **strict formatting requirements** to ensure all responses are clean, organized, and professional.

---

## Required Formatting Elements

### 1. Headers & Structure

**Use proper hierarchy:**
```markdown
## Main Section
### Subsection
#### Detail Level
```

**Example:**
```
## Top Priority Deals

### High Value Opportunities
Details here...

### Needs Immediate Attention
Details here...
```

### 2. Bold for Emphasis

**Always bold:**
- Names (people, companies, deals)
- Numbers (values, counts, dates)
- Key terms and status indicators
- Section headers within lists

**Example:**
```
**Koelbel Metropoint** - **$50K**
**Status:** Active
**Owner:** Bill Douglas
```

### 3. Bullet Points & Lists

**For any list of items:**
```
- Item 1
- Item 2
- Item 3
```

**For numbered sequences:**
```
1. First step
2. Second step
3. Third step
```

**For nested information:**
```
**1. Deal Name** - $Value
- Detail 1
- Detail 2
- Detail 3
```

### 4. Horizontal Rules

**Use `---` to separate major sections:**
```
## Section 1
Content here...

---

## Section 2
Content here...
```

### 5. Blockquotes for Callouts

**Use `>` for important information:**
```
> **Action Required:** Follow up with Mass Equities by Friday
```

### 6. Code Formatting

**Use backticks for:**
- IDs: `deal_abc123`
- Technical terms: `vectorized`
- Email addresses: `john@example.com`

---

## Response Templates

### Template 1: List of Items

```markdown
## [Topic]

**1. [Item Name]** - [Key Metric]
- **Detail Label:** Value
- **Detail Label:** Value
- **Detail Label:** Value

**2. [Item Name]** - [Key Metric]
- **Detail Label:** Value
- **Detail Label:** Value

---

### Summary
[Brief takeaway with bold key points]
```

**Example:**
```
## Customer Email Questions

**1. Pricing Model Question**
- **Question:** "What is your pricing model for enterprise clients?"
- **Context:** Asked by CFO during discovery call
- **Frequency:** High (15+ conversations)
- **Stage:** Discovery/Qualification

**2. Case Study Request**
- **Question:** "Can you provide case studies from similar companies?"
- **Context:** Requested during evaluation phase
- **Frequency:** Medium (8 conversations)
- **Stage:** Proposal

---

### Key Insights
- **Pricing** is the #1 question (appears in 60% of conversations)
- **Case studies** requested most in proposal stage
```

### Template 2: Analysis Report

```markdown
## Executive Summary
[2-3 sentences with **bold** key metrics]

---

## Detailed Findings

### [Category 1]

**Key Points:**
- Finding 1 with **bold numbers**
- Finding 2 with **bold names**
- Finding 3 with **bold dates**

**Examples:**
1. Specific example 1
2. Specific example 2

### [Category 2]

**Key Points:**
- Finding 1
- Finding 2

---

## Recommendations

**Immediate Actions:**
1. [Action] - [Reasoning]
2. [Action] - [Reasoning]

**Long-term Strategy:**
- Strategy point 1
- Strategy point 2

> **Priority:** [Most important action]
```

### Template 3: Deal/Contact Summary

```markdown
## [Entity Name]

**Overview:**
- **Value:** $XXX,XXX
- **Stage:** Stage Name
- **Owner:** Person Name
- **Last Activity:** Date (X days/weeks/months ago)

**Recent Activity:**
- Jan 15: Email exchange about pricing
- Jan 10: Technical review call
- Jan 5: Proposal sent

**Key Points:**
- Point 1 with **bold emphasis**
- Point 2 with **bold emphasis**
- Point 3 with **bold emphasis**

---

### Next Steps
1. [Action] by [Date]
2. [Action] by [Date]

> **Critical:** [Most important thing to know]
```

---

## Before vs After Examples

### ❌ BAD (Unformatted)

```
Here are some customer questions: What is your pricing model for enterprise clients? Can you provide case studies? What is your implementation timeline? How do you handle data migration? These are common questions we get.
```

**Problems:**
- No structure
- No bold emphasis
- No bullets
- Hard to scan
- Unprofessional

### ✅ GOOD (Well Formatted)

```
## Customer Questions

**1. Pricing Model**
- **Question:** "What is your pricing model for enterprise clients?"
- **Context:** Most common question - asked by CFOs and procurement
- **Frequency:** Very High (60% of discovery calls)

**2. Case Studies**
- **Question:** "Can you provide case studies from similar companies?"
- **Context:** Requested during evaluation/proposal stages
- **Frequency:** High (40% of qualified leads)

**3. Implementation Timeline**
- **Question:** "What is your typical implementation timeline?"
- **Context:** Asked when deal is advancing to technical review
- **Frequency:** Medium (30% of proposals)

**4. Data Migration**
- **Question:** "How do you handle data migration from our current system?"
- **Context:** Technical concern during implementation planning
- **Frequency:** Medium (25% of technical discussions)

---

### Key Insights
- **Pricing** is the #1 barrier - address early
- **Case studies** close deals faster (2x conversion)
- **Implementation concerns** appear late-stage
```

---

## Formatting Checklist

Every response should have:

- [ ] **Bold** used for names, numbers, key terms
- [ ] Bullet points for lists (never wall of text)
- [ ] Proper headers (##, ###) for organization
- [ ] Blank lines between sections
- [ ] Horizontal rules (---) between major parts
- [ ] Numbered lists for sequences/steps
- [ ] Blockquotes (>) for critical info
- [ ] Scannable structure (can understand by skimming)

---

## Impact

With proper formatting, responses will be:
- ✅ **Professional** - Looks like a business document
- ✅ **Scannable** - Can understand in 10 seconds
- ✅ **Actionable** - Clear next steps
- ✅ **Organized** - Logical flow
- ✅ **Readable** - Easy on the eyes

**After deployment, all agent responses will follow these formatting standards automatically!**
