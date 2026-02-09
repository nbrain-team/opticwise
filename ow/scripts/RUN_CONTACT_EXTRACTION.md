# How to Run Contact Extraction

## Quick Start

```bash
cd /Users/dannydemichele/Opticwise/ow
export $(cat "../Opticwise-Backend (1).env" | xargs)
npx tsx scripts/extract-contacts-from-emails.ts
```

## What It Does

1. Analyzes sent emails from the last 6 months
2. Identifies contacts based on:
   - 2+ initiated emails, OR
   - 1 initiated email + 4+ message thread
3. Excludes internal emails (opticwise.com, nbrain.team)
4. Extracts contact info from email signatures using AI
5. Generates CSV report: `extracted-contacts.csv`

## Output

- **CSV File**: `/ow/extracted-contacts.csv`
- **Log File**: Console output (can pipe to file)
- **Processing Time**: ~2 minutes for 167 contacts

## Customizing the Script

### Change Time Range

Edit line 22 in `extract-contacts-from-emails.ts`:

```typescript
// Current: 6 months
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);

// For 12 months:
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 12);

// For 24 months:
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 24);

// Or use setFullYear for years:
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setFullYear(SIX_MONTHS_AGO.getFullYear() - 2);
```

### Add Internal Domains to Exclude

Edit lines 16-19:

```typescript
const INTERNAL_DOMAINS = [
  'opticwise.com',
  'nbrain.team',
  'yourdomain.com',  // Add more here
];
```

### Adjust Qualification Criteria

Edit lines 233-253 for different thresholds:

```typescript
// Current: 2+ initiated emails
if (contact.initiatedEmailCount >= 2) {

// Change to 3+ initiated:
if (contact.initiatedEmailCount >= 3) {

// Current: 1 initiated + 4+ thread
if (thread && thread.hasInitiated && thread.messageCount >= 4) {

// Change to 1 initiated + 5+ thread:
if (thread && thread.hasInitiated && thread.messageCount >= 5) {
```

### Change Batch Size (AI Processing Speed)

Edit line 261:

```typescript
// Current: 5 contacts at a time
const batchSize = 5;

// Faster (but may hit rate limits):
const batchSize = 10;

// Slower (more conservative):
const batchSize = 3;
```

## Common Issues

### Database Connection Error
```
Environment variable not found: DATABASE_URL
```

**Fix**: Make sure to run `export $(cat "../Opticwise-Backend (1).env" | xargs)` first

### Vector Column Error
```
Column type 'vector' could not be deserialized
```

**Fix**: Already handled in script - we exclude the embedding column in queries

### Rate Limit Error (Anthropic API)
```
429 Too Many Requests
```

**Fix**: Reduce `batchSize` to 3 or add longer delays between batches

## Running Different Time Periods

### Last 3 Months Only
```typescript
const THREE_MONTHS_AGO = new Date();
THREE_MONTHS_AGO.setMonth(THREE_MONTHS_AGO.getMonth() - 3);
```

### Year-to-Date
```typescript
const YEAR_START = new Date(new Date().getFullYear(), 0, 1);
```

### All Time
```typescript
const ALL_TIME = new Date('2020-01-01'); // Or earliest relevant date
```

## Output Files

After running, you'll have:

1. **extracted-contacts.csv** - Main output with all qualified contacts
2. **contact-extraction.log** - If you pipe output with `| tee contact-extraction.log`

## Data Fields in CSV

1. Email (required)
2. Full Name (88% populated)
3. First Name (88%)
4. Last Name (88%)
5. Company (93%)
6. Job Title (40%)
7. Phone (73%)
8. LinkedIn (66%)
9. Address (varies)
10. Initiated Emails (count)
11. Reply Emails (count)
12. Total Emails (count)
13. Thread Messages (if applicable)
14. First Contact (date)
15. Last Contact (date)
16. Qualification Reason (why they qualified)
17. Sample Email Subjects (context)

## Performance Tips

1. **Run during off-hours** - Less database load
2. **Monitor progress** - Check console output for stuck batches
3. **Save logs** - Pipe output to file for review
4. **Test first** - Run on 3 months before full historical

## Re-running the Script

The script can be run multiple times safely:
- It reads data (doesn't modify database)
- It overwrites the CSV each time
- Previous CSV is lost (save a copy if needed)

## Saving Multiple Runs

```bash
# Run and save with date
npx tsx scripts/extract-contacts-from-emails.ts
mv extracted-contacts.csv extracted-contacts-$(date +%Y%m%d).csv

# Or rename first
mv extracted-contacts.csv extracted-contacts-6mo.csv
npx tsx scripts/extract-contacts-from-emails.ts
# New file: extracted-contacts.csv
```

## Full Historical Extraction

For a comprehensive contact list from all emails:

1. Edit the date range (see "Customizing" above)
2. Run: `npx tsx scripts/extract-contacts-from-emails.ts`
3. Expect 300-500+ contacts
4. Processing time: 5-10 minutes
5. Higher API costs: ~$1-2

## Support

For issues or questions:
1. Check this guide first
2. Review `/CONTACT_EXTRACTION_README.md`
3. Check `/CONTACT_EXTRACTION_RESULTS.md` for sample output
4. Contact development team
