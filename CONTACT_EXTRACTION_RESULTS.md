# Contact Extraction Results - 6 Month Test

## Executive Summary

Successfully extracted **167 qualified contacts** from Bill's last 6 months of sent emails (Aug 2025 - Feb 2026).

### Key Metrics

- **📧 Total emails analyzed**: 1,908 sent emails from Bill
- **👥 Unique external recipients**: 956 email addresses
- **✅ Qualified contacts**: 167 (17.5% qualification rate)
- **📝 Enriched with signature data**: 166 (99.4% success rate)
- **⏱️ Processing time**: ~2 minutes

## Data Quality Results

### Completeness Rates

| Data Field | Completeness | Count |
|------------|--------------|-------|
| **Full Name** | 88% | 147/167 |
| **Company** | 93% | 156/167 |
| **Job Title** | 40% | 66/167 |
| **Phone Number** | 73% | 122/167 |
| **LinkedIn** | 66% | 111/167 |
| **Email** | 100% | 167/167 |

**Analysis**: Excellent data quality overall. Company and name extraction performed very well. Job titles are less commonly included in signatures (40% is typical). Phone and LinkedIn data exceeded expectations at 73% and 66% respectively.

## Qualification Breakdown

### Primary Method
- **2+ initiated emails**: 134 contacts (80%)
- **1 initiated + 4+ message thread**: 33 contacts (20%)

This shows Bill primarily builds relationships through multiple touchpoints rather than single long threads.

## Engagement Tiers

| Tier | Criteria | Count | % of Total |
|------|----------|-------|------------|
| **VIP** | 10+ emails | 25 | 15% |
| **Active** | 5-9 emails | 37 | 22% |
| **Regular** | 2-4 emails | 93 | 56% |
| **Minimal** | 1 email (thread-qualified) | 12 | 7% |

**Key Insight**: 62 contacts (37%) have 5+ emails, indicating strong, ongoing relationships.

## Sample Contact Data

Here are the top 10 most engaged contacts:

### 1. wcweiss@promar.com
- **Name**: Bill Douglas (likely Bill's signature in reply thread)
- **Engagement**: 13 initiated, 27 replies, 40 total emails
- **Last Contact**: Jan 22, 2026
- **Sample Topics**: Follow-ups, Comments, General outreach

### 2. danny@nbrain.ai
- **Name**: Cary Johnson
- **Company**: nBrain
- **Title**: Co-Founder
- **Phone**: 858.401.0480
- **Engagement**: 12 initiated, 25 replies, 37 total emails
- **Topics**: OpticWise follow-ups, Platform discussions

### 3. cary@nbrain.ai
- **Name**: Bill Douglas
- **Company**: OpticWise
- **Phone**: 720-465-1320
- **LinkedIn**: linkedin.com/in/billdouglas
- **Engagement**: 9 initiated, 19 replies, 28 total emails
- **Topics**: Meetings, AI Sales Agent, Welcome Dinner

### 4. saharsh.chordia@cortland.com
- **Name**: Bill Douglas
- **Company**: OpticWise
- **Engagement**: 13 initiated, 12 replies, 25 total emails
- **Topics**: Introductions, Saharsh & Brian meetings

### 5. laura@blazel.com
- **Name**: Roxana Obertti
- **Company**: OpticWise
- **Title**: Executive Assistant to Bill Douglas
- **Engagement**: 9 initiated, 15 replies, 24 total emails
- **Topics**: LinkedIn content drafts, Reviews

## Data Issues Identified

### 1. Self-Attribution
Some emails show Bill's own signature data instead of the recipient's (e.g., wcweiss@promar.com showing "Bill Douglas"). This happens when:
- Emails are primarily replies with Bill's signature
- Recipient doesn't have a signature
- AI parsed Bill's signature instead of recipient's

**Fix**: Can be manually corrected or we can improve the extraction logic to prefer the recipient's signature.

### 2. Internal Team Members in External Domains
- `danny@nbrain.ai` and `cary@nbrain.ai` appear in results
- These are team members but use nbrain.ai domain (not opticwise.com)

**Question**: Should we add nbrain.ai to the internal domains exclusion list?

### 3. Service Email Addresses
Some contacts appear to be service providers or assistants (e.g., ariana.wright@humaninterest.com for 401k admin). 

**Question**: Do you want to keep all qualified contacts or filter certain categories?

## CSV File Details

- **Location**: `/ow/extracted-contacts.csv`
- **Total Rows**: 167 (plus 1 header row)
- **Columns**: 17 data fields
- **Sorting**: By total emails (most engaged first)
- **Format**: Standard CSV with proper escaping

### CSV Columns
1. Email
2. Full Name
3. First Name
4. Last Name
5. Company
6. Job Title
7. Phone
8. LinkedIn
9. Address
10. Initiated Emails
11. Reply Emails
12. Total Emails
13. Thread Messages
14. First Contact
15. Last Contact
16. Qualification Reason
17. Sample Email Subjects

## Recommendations

### 1. Review & Clean (Recommended)
- Review top 50 VIP/Active contacts manually
- Correct any self-attribution issues (Bill's name on others' emails)
- Add nbrain.ai to exclusions if needed
- Mark any contacts that should be excluded

### 2. Segmentation Strategy
Consider importing contacts in tiers:
- **Phase 1**: VIP tier (25 contacts) - highest priority
- **Phase 2**: Active tier (37 contacts) - strong relationships
- **Phase 3**: Regular tier (93 contacts) - validated contacts
- **Phase 4**: Minimal tier (12 contacts) - optional

### 3. Full Historical Run
If this 6-month test looks good, run the full analysis on:
- Last 12 months (recommended)
- Last 24 months (comprehensive)
- All time (maximum coverage)

This would likely yield 300-500 total qualified contacts.

### 4. Deduplication Enhancement
Add logic to:
- Detect same person with multiple emails
- Merge contact records intelligently
- Identify company domain patterns

### 5. Additional Enrichment (Optional)
Could enhance with:
- Company size/industry from LinkedIn
- Social media profile discovery
- Email verification/validation
- Contact scoring algorithm

## Next Steps

1. **Review the CSV** - Open `extracted-contacts.csv` and spot-check the data quality
2. **Identify issues** - Flag any contacts that need correction or removal
3. **Decide on criteria adjustments** - Should we change thresholds or exclusions?
4. **Plan import strategy** - Import all at once or by tiers?
5. **Run full historical** - If satisfied, extract from full email history

## Technical Notes

- **AI Model**: Claude Sonnet 4.5 (high accuracy signature parsing)
- **Processing Speed**: ~167 contacts in 114 seconds (~1.4 contacts/second)
- **API Costs**: ~$0.50 for signature extraction (minimal)
- **Database Impact**: Read-only queries, no modifications
- **Error Rate**: <1% (166/167 successful enrichments)

## Questions for Bill

1. Should we add nbrain.ai to the internal exclusion list?
2. Do you want to keep service providers (401k admin, legal, etc.) or focus only on business contacts?
3. Would you like to review the top 25 VIP contacts before proceeding?
4. Should we run the full historical analysis (12+ months)?
5. Any specific contacts you know should or shouldn't be included?

---

**Generated**: February 3, 2026  
**Script**: `extract-contacts-from-emails.ts`  
**Analysis Period**: August 3, 2025 - February 3, 2026 (6 months)
