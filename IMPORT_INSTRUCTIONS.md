# Pipedrive Data Import Instructions

## Overview

This document explains the data import process from Pipedrive Excel files into the OpticWise platform.

## Files Being Imported

1. **organizations-2029418-76.xlsx** - 4,859 organizations
2. **people-2029418-77.xlsx** - 11,568 people
3. **deals-2029418-75.xlsx** - 175 deals

## Import Strategy

### Critical Order of Operations

The import **MUST** happen in this exact order to maintain referential integrity:

1. **Organizations First** - No dependencies
2. **People Second** - Depends on Organizations
3. **Deals Last** - Depends on both Organizations and People

### Relationship Mapping

#### How Organizations Link to People
- Excel: `people-2029418-77.xlsx` → Column `Organization ID` (Pipedrive ID)
- Maps to: Organization's Pipedrive `ID` field
- Database: Creates foreign key `Person.organizationId` → `Organization.id`

#### How Organizations Link to Deals
- Excel: `deals-2029418-75.xlsx` → Column `Organization ID` (Pipedrive ID)
- Maps to: Organization's Pipedrive `ID` field
- Database: Creates foreign key `Deal.organizationId` → `Organization.id`

#### How People Link to Deals
- Excel: `deals-2029418-75.xlsx` → Column `Contact person` (name as string)
- Maps to: Person's `Name` field via fuzzy matching
- Database: Creates foreign key `Deal.personId` → `Person.id`

### ID Mapping System

Since Pipedrive uses its own ID system and our database generates new IDs, we maintain in-memory maps:

```typescript
orgIdMap: Pipedrive Org ID → Our Database Org ID
personIdMap: Pipedrive Person ID → Our Database Person ID
personNameMap: Person Name → Our Database Person ID (for deal lookup)
```

## Field Mappings

### Organizations (35 columns mapped)

**Identity & Basic Info:**
- `Name` → `name` (required, unique)
- `Website` → `websiteUrl`
- `LinkedIn profile` → `linkedInProfile`
- `Labels` → `labels`

**Address Fields:**
- `Address` → `address` (legacy full address)
- `Street/road name` → `streetAddress`
- `House number` → `houseNumber`
- `Apartment/suite no` → `apartmentSuite`
- `District/sublocality` → `district`
- `City/town/village/locality` → `city`
- `State/county` → `state`
- `Region` → `region`
- `Country` → `country`
- `ZIP/Postal code` → `zipCode`
- `Full/combined address` → `fullAddress`

**Activity Tracking:**
- `Open deals` → `openDeals`
- `Won deals` → `wonDeals`
- `Lost deals` → `lostDeals`
- `Closed deals` → `closedDeals`
- `Total activities` → `totalActivities`
- `Done activities` → `doneActivities`
- `Activities to do` → `activitiesToDo`
- `Email messages count` → `emailMessagesCount`
- `Next activity date` → `nextActivityDate`
- `Last activity date` → `lastActivityDate`

**Timestamps:**
- `Organization created` → `createdAt`
- `Update time` → `updatedAt`

### People (51 columns mapped)

**Identity & Contact:**
- `Name` → `name`
- `First name` → `firstName` (required)
- `Last name` → `lastName`
- `Email - Work` → `emailWork` AND `email` (primary, unique)
- `Email - Home` → `emailHome`
- `Email - Other` → `emailOther`
- `Phone - Work` → `phoneWork`
- `Phone - Home` → `phoneHome`
- `Phone - Mobile` → `phoneMobile`
- `Phone - Other` → `phoneOther`
- `Job title` → `title`

**Relationships:**
- `Organization ID` → `organizationId` (foreign key lookup)

**Address Fields:**
- `Postal address` → `postalAddress`
- `Street/road name of Postal address` → `streetAddress`
- `House number of Postal address` → `houseNumber`
- `Apartment/suite no of Postal address` → `apartmentSuite`
- `City/town/village/locality of Postal address` → `city`
- `State/county of Postal address` → `state`
- `Region of Postal address` → `region`
- `Country of Postal address` → `country`
- `ZIP/Postal code of Postal address` → `zipCode`

**Personal Info:**
- `Birthday` → `birthday`
- `Notes` → `notes`
- `LinkedIn profile` → `linkedInProfile`
- `Qwilr Proposal` → `qwilrProposal`
- `Classification` → `classification`
- `Instant messenger` → `instantMessenger`
- `Labels` → `labels`
- `Contact Type` → `contactType`

**Activity Tracking:**
- Same as Organizations (openDeals, wonDeals, etc.)
- Plus: `Last email received` → `lastEmailReceived`
- Plus: `Last email sent` → `lastEmailSent`

**Timestamps:**
- `Person created` → `createdAt`
- `Update time` → `updatedAt`

### Deals (71 columns mapped)

**Basic Deal Info:**
- `Title` → `title` (required)
- `Value` → `value` (Decimal)
- `Currency of Value` → `currency`
- `Status` → `status` (enum: open/won/lost)
- `Pipeline` → Lookup/create pipeline
- `Stage` → Lookup/create stage
- `Owner` → `ownerId` (maps to User)

**Relationships:**
- `Organization ID` → `organizationId` (foreign key lookup)
- `Contact person` → `personId` (name-based lookup)

**Dates & Timing:**
- `Expected close date` → `expectedCloseDate`
- `Won time` → `wonTime`
- `Lost time` → `lostTime`
- `Deal created` → `addTime`
- `Update time` → `updateTime`
- `Last stage change` → `stageChangeTime`

**Activity Tracking:**
- All standard activity fields (same as Organizations/People)

**Products & Financials:**
- `Product name` → `productName`
- `ARR forecast` → `arrForecast`
- `CapEx ROM` → `capexRom`
- `Audit Value` → `auditValue`
- `ARR Expansion Potential` → `arrExpansionPotential`

**Custom OpticWise Fields:**
- `Go-Live Target` → `goLiveTarget`
- `Property Address` → `propertyAddress`
- `Property Type` → `propertyType`
- `Qty (clarify; units, beds, sqft)` → `qty`
- `ROI/NOI/BOM sheet` → `roiNoiBomSheet`
- `Prints/Plans External link` → `printsPlansExternal`
- `Prints/Plans OW DropBox Link` → `printsPlansDropbox`
- `Lead Source` → `leadSource`
- `Technical POC` → `technicalPOC`
- `ICP Segment` → `icpSegment`
- `Lead Source PPP` → `leadSourcePPP`
- `Readiness Score` → `readinessScore`
- `DDI Audit Status` → `ddiAuditStatus`

**Source Tracking:**
- `Source origin` → `sourceOrigin`
- `Source origin ID` → `sourceOriginId`
- `Source channel` → `sourceChannel`
- `Source channel ID` → `sourceChannelId`

**Other:**
- `Lost reason` → `lostReason`
- `Label` → `label`

## Data Transformations

### Email Handling (People)
1. Try `Email - Work` first (most common)
2. If empty, try `Email - Other`
3. If empty, try `Email - Home`
4. If all empty, generate: `person_{pipedriveId}_noemail@placeholder.local`
5. If duplicate found, generate: `person_{pipedriveId}_{timestamp}@placeholder.local`

### Organization Name Deduplication
If organization name already exists:
- Append `(1)`, `(2)`, etc. until unique

### Status Mapping (Deals)
- `"Open"` → `open`
- `"Won"` → `won`
- `"Lost"` → `lost`
- `"Deleted"` → `deleted`
- Default → `open`

### Date Parsing
- Format: `"YYYY-MM-DD HH:MM:SS"` or `"YYYY-MM-DD"`
- Invalid dates → `null`

### Decimal Parsing
- Remove currency symbols
- Parse to float
- Invalid values → `0`

## Pipeline & Stage Handling

### Pipeline
- Creates "Sales Pipeline" if it doesn't exist
- All deals go into this pipeline

### Stages
- Extracts all unique stage names from deals
- Creates stages in order discovered
- Assigns sequential `orderIndex` values

## User/Owner Handling

- Default user: `bill@opticwise.com` (Bill Douglas)
- If user doesn't exist, creates it with placeholder password
- All deals assigned to this owner

## Error Handling

### Non-Fatal Errors (Continue Import)
- Missing optional fields
- Invalid dates/numbers (use defaults)
- Missing relationships (set to null)

### Fatal Errors (Stop Import)
- Database connection failure
- File not found
- Invalid file format

### Error Logging
- All errors logged with:
  - Type (organization/person/deal)
  - Row number
  - Error message
  - Sample data

## Verification After Import

The script automatically verifies:

1. **Record Counts:**
   - Organizations imported
   - People imported
   - Deals imported

2. **Relationship Integrity:**
   - People linked to organizations
   - Deals linked to organizations
   - Deals linked to people

3. **Success Rates:**
   - Overall success percentage
   - Failed records by type

## Running the Import

```bash
cd /Users/dannydemichele/Opticwise/ow
DATABASE_URL="postgresql://..." npx tsx scripts/import-pipedrive-data.ts
```

## Expected Results

- **Organizations**: ~4,859 imported
- **People**: ~11,568 imported
- **Deals**: ~175 imported
- **Success Rate**: >99% (some records may fail due to data quality issues)

## Post-Import Validation

Run these queries to verify data integrity:

```sql
-- Check counts
SELECT 'Organizations' as type, COUNT(*) as count FROM "Organization"
UNION ALL
SELECT 'People', COUNT(*) FROM "Person"
UNION ALL
SELECT 'Deals', COUNT(*) FROM "Deal";

-- Check relationships
SELECT 
  'People with Orgs' as type,
  COUNT(*) as count 
FROM "Person" 
WHERE "organizationId" IS NOT NULL;

SELECT 
  'Deals with Orgs' as type,
  COUNT(*) as count 
FROM "Deal" 
WHERE "organizationId" IS NOT NULL;

SELECT 
  'Deals with People' as type,
  COUNT(*) as count 
FROM "Deal" 
WHERE "personId" IS NOT NULL;

-- Check for orphaned records (should be 0)
SELECT COUNT(*) as orphaned_people
FROM "Person" 
WHERE "organizationId" IS NOT NULL 
  AND "organizationId" NOT IN (SELECT id FROM "Organization");
```

## Troubleshooting

### Issue: "Email already exists"
- Script automatically handles by generating unique placeholder email

### Issue: "Organization not found"
- Check that organizations imported successfully first
- Verify Pipedrive ID mapping

### Issue: "Stage not found"
- Script automatically creates all stages from deals file

### Issue: "User not found"
- Script automatically creates default user

## Safety Features

1. **No Data Loss**: Original Excel files remain untouched
2. **Error Logging**: All errors captured with context
3. **Relationship Validation**: Automatic verification after import
4. **Duplicate Handling**: Automatic deduplication for names/emails
5. **Graceful Degradation**: Continues on non-fatal errors

