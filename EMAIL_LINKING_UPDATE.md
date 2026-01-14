# Email Linking - Automatic Association

**Date:** January 14, 2026  
**Status:** ✅ Deployed

---

## What Changed

Updated deal, person, and organization detail pages to **automatically show emails** based on associated email addresses.

---

## How It Works

### For Deals 📊

Emails are shown if they match:
1. **Person's email address** (if deal has a linked person)
2. **Organization's domain** (if deal has a linked organization)

**Example:**
- Deal linked to: John Smith (john@acmecorp.com) at Acme Corp (domain: acmecorp.com)
- Shows emails:
  - From/To: john@acmecorp.com
  - From/To: anyone@acmecorp.com

### For People 👤

Emails are shown if they match:
- **Person's email address** in From, To, or CC fields

**Example:**
- Person: Jane Doe (jane@example.com)
- Shows emails:
  - From: jane@example.com
  - To: jane@example.com
  - CC: jane@example.com

### For Organizations 🏢

Emails are shown if they match:
1. **Organization's domain** (e.g., @acmecorp.com)
2. **Any person's email** in that organization

**Example:**
- Organization: Acme Corp (domain: acmecorp.com)
- People: John (john@acmecorp.com), Jane (jane@acmecorp.com)
- Shows emails:
  - From/To: anyone@acmecorp.com
  - From/To: john@acmecorp.com
  - From/To: jane@acmecorp.com

---

## Features

✅ **Automatic Linking** - No manual linking required  
✅ **Case Insensitive** - Matches emails regardless of case  
✅ **Multiple Sources** - Searches From, To, and CC fields  
✅ **Newest First** - Emails sorted by date (newest on top)  
✅ **Limit 50** - Shows up to 50 most recent emails  
✅ **Real-time** - Updates automatically when viewing the page

---

## Email Display

**In the Emails Tab:**
- ✅ Subject line
- ✅ Sender name and email
- ✅ Date
- ✅ Preview snippet
- ✅ Attachment count (if any)
- ✅ Expandable to show full email body
- ✅ Attachment details

**Empty State:**
If no emails found:
> "No emails found for this deal."
> "Emails are automatically linked when they match contacts in your CRM."

---

## Requirements

**For emails to show up:**

1. **Emails must be synced** from Gmail:
   ```bash
   cd ow
   npm run sync:gmail:30days
   ```

2. **Deal/Person/Organization must have:**
   - Person with email address, OR
   - Organization with domain

3. **Email addresses must match:**
   - Person's email in CRM matches email in Gmail
   - Organization's domain matches email domain in Gmail

---

## Example Scenarios

### Scenario 1: Deal with Person Only
**Deal:** Koelbel Project  
**Person:** Bill Smith (bill@koelbel.com)  
**Organization:** None  

**Result:** Shows emails from/to bill@koelbel.com

---

### Scenario 2: Deal with Organization Only
**Deal:** Mass Equities Project  
**Person:** None  
**Organization:** Mass Equities (domain: massequities.com)  

**Result:** Shows emails from/to anyone@massequities.com

---

### Scenario 3: Deal with Both
**Deal:** Cardone Acquisitions  
**Person:** John Doe (john@cardone.com)  
**Organization:** Cardone (domain: cardone.com)  

**Result:** Shows emails from/to:
- john@cardone.com (person)
- anyone@cardone.com (organization)

---

### Scenario 4: No Email Info
**Deal:** Generic Deal  
**Person:** None  
**Organization:** None  

**Result:** Shows empty state message

---

## Technical Details

**Database Queries:**

```typescript
// Deal emails
WHERE (
  from CONTAINS person.email OR
  to CONTAINS person.email OR
  from CONTAINS @organization.domain OR
  to CONTAINS @organization.domain
)
ORDER BY date DESC
LIMIT 50
```

**Performance:**
- Uses database indexes on `from`, `to`, `date` fields
- Case-insensitive search
- Limit 50 emails for fast loading

---

## Testing

**To test:**

1. **Sync some emails:**
   ```bash
   cd ow
   npm run sync:gmail:30days
   ```

2. **Open a deal:**
   - Go to https://ownet.opticwise.com/deals
   - Click on any deal
   - Click "Emails" tab

3. **Check results:**
   - If person/org has email: Should show matching emails
   - If no email info: Shows empty state

---

## Troubleshooting

**"No emails found" but should have emails:**

1. **Check if emails are synced:**
   - Run: `npm run sync:gmail:30days`
   - Wait for sync to complete

2. **Check email addresses:**
   - Person has valid email in CRM?
   - Organization has domain set?
   - Email addresses match exactly?

3. **Check email date range:**
   - Only shows emails from synced period
   - Default: last 30 days
   - Sync more if needed

**Emails not showing for organization:**

1. **Check organization domain:**
   - Go to organization detail page
   - Is domain field filled in?
   - Domain should be just: "example.com" (no @)

2. **Check people in organization:**
   - Do people have email addresses?
   - Are emails in the synced Gmail data?

---

## Future Enhancements

Possible improvements:

1. **Manual linking** - Allow manually linking specific emails
2. **Email threads** - Group related emails together
3. **Reply from CRM** - Send replies directly from deal page
4. **Email filters** - Filter by sender, date, etc.
5. **Search emails** - Search within deal emails
6. **Pagination** - Load more than 50 emails

---

## Files Modified

- `/ow/app/deal/[id]/page.tsx` - Deal email linking
- `/ow/app/person/[id]/page.tsx` - Person email linking
- `/ow/app/organization/[id]/page.tsx` - Organization email linking

---

**Status:** ✅ Live in Production  
**Deployment:** Automatic via Render

