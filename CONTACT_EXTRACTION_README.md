# Contact Extraction from Email Analysis

## Overview

This script analyzes Bill's sent emails from the last 6 months to build a clean contact list based on actual email behavior rather than imported CRM data.

## Qualification Criteria

A contact qualifies if they meet **either** of these conditions:

1. **2+ initiated emails** - Bill sent them 2 or more emails that were NOT replies
2. **1 initiated email + 4+ message thread** - Bill initiated at least 1 email AND they participated in a thread with 4 or more messages

## Exclusions

The script automatically excludes:
- Internal emails (@opticwise.com, @nbrain.team)
- No-reply addresses
- One-off replies to inbound emails

## Data Extracted

The script extracts the following data for each qualified contact:

### Basic Contact Info (from email signatures using AI)
- **Email** - Primary email address
- **Full Name** - Complete name if found in signature
- **First Name** - Extracted first name
- **Last Name** - Extracted last name
- **Company** - Company/organization name
- **Job Title** - Professional title/role
- **Phone** - Phone number from signature
- **LinkedIn** - LinkedIn profile URL
- **Address** - Physical address if available

### Engagement Metrics
- **Initiated Emails** - Count of emails Bill sent (not replies)
- **Reply Emails** - Count of replies Bill sent
- **Total Emails** - Total email exchanges
- **Thread Messages** - If in a qualifying thread, the thread message count
- **First Contact** - Date of first email to this contact
- **Last Contact** - Date of most recent email
- **Qualification Reason** - Why this contact qualified (e.g., "2 initiated emails" or "1 initiated email + 5 message thread")
- **Sample Email Subjects** - Up to 3 sample email subjects for context

## CSV Output

The script generates `extracted-contacts.csv` in the `/ow` directory with:
- Contacts sorted by engagement (most emails first)
- Clean column headers
- Proper CSV escaping for commas, quotes, etc.
- Date formatting (YYYY-MM-DD)

## Engagement Tiers

Contacts are categorized into engagement tiers for easy prioritization:

- **VIP**: 10+ total emails
- **Active**: 5-9 total emails  
- **Regular**: 2-4 total emails
- **Minimal**: 1 email (but met thread criteria)

## Statistics Provided

The script outputs detailed statistics including:
- Total emails analyzed
- Unique external recipients found
- Qualified contacts vs. unqualified
- Data completeness percentages (name, company, title, phone, LinkedIn)
- Breakdown by qualification type
- Breakdown by engagement tier

## Usage

```bash
cd ow
npx tsx scripts/extract-contacts-from-emails.ts
```

## Performance

The script:
1. Analyzes email threads to find qualifying conversations
2. Processes all sent emails from the last 6 months
3. Enriches contacts with AI-powered signature parsing
4. Generates a comprehensive CSV report

**Expected runtime**: 5-15 minutes depending on:
- Number of sent emails
- Number of qualifying contacts
- AI processing time for signature extraction

## Next Steps

After reviewing the CSV:

1. **Review data quality** - Check the completeness percentages and sample data
2. **Adjust criteria if needed** - We can modify the qualification thresholds
3. **Clean/edit manually** - Make any manual corrections in the CSV
4. **Import to CRM** - Once approved, we can import the clean contact list

## Technical Notes

- Uses Claude Sonnet 4.5 for signature parsing (high accuracy)
- Processes contacts in batches to respect API rate limits
- Properly handles multiple recipients (To, CC)
- Parses both "Name <email>" and plain email formats
- Thread analysis uses database queries for efficiency
- AI signature extraction is conservative (only extracts when confident)

## Sample Output Columns

```
Email,Full Name,First Name,Last Name,Company,Job Title,Phone,LinkedIn,Address,Initiated Emails,Reply Emails,Total Emails,Thread Messages,First Contact,Last Contact,Qualification Reason,Sample Email Subjects
john.doe@example.com,John Doe,John,Doe,Acme Corp,VP of Sales,(555) 123-4567,linkedin.com/in/johndoe,"123 Main St, City, ST 12345",5,2,7,0,2024-08-15,2024-01-28,"5 initiated emails","Q4 Planning | Follow-up on proposal | Meeting notes"
```

## Future Enhancements (Optional)

If this initial test looks good, we could add:
- Contact scoring/prioritization algorithm
- Automatic deduplication (same person, multiple emails)
- Company domain matching
- Social media profile enrichment
- Integration with external data sources
- Automated periodic refresh
