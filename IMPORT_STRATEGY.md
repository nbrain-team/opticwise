# Data Import Strategy - Pipedrive to OpticWise

## Overview
Importing 3 Excel files with proper relationship mapping:
- **Organizations**: 4,859 records
- **People**: 11,568 records  
- **Deals**: 175 records

## Import Order (Critical for Foreign Key Relationships)

### 1. ORGANIZATIONS FIRST
Organizations must be imported first because People and Deals reference them.

### 2. PEOPLE SECOND
People must be imported after Organizations (they reference org IDs) but before Deals.

### 3. DEALS LAST
Deals reference both Organizations and People, so they must be imported last.

## Relationship Mapping

### Key Relationships Identified:

1. **People → Organizations**
   - Excel Column: `Organization ID` (number)
   - Maps to: Organization's Pipedrive `ID` field
   - Database: `Person.organizationId` → `Organization.id`

2. **Deals → Organizations**
   - Excel Column: `Organization ID` (number)
   - Maps to: Organization's Pipedrive `ID` field
   - Database: `Deal.organizationId` → `Organization.id`

3. **Deals → People**
   - Excel Column: `Contact person` (name string)
   - Must match: Person's `Name` field
   - Database: `Deal.personId` → `Person.id`

## Field Mapping Details

### ORGANIZATIONS (35 columns → Prisma Organization model)

| Excel Column | Prisma Field | Type | Notes |
|--------------|--------------|------|-------|
| ID | *stored for mapping* | number | Pipedrive ID, not our DB ID |
| Name | name | string | Required, unique |
| Owner | *skip* | string | Will use default user |
| Website | websiteUrl | string | Optional |
| LinkedIn profile | linkedInProfile | string | Optional |
| Address | address | string | Legacy full address |
| Apartment/suite no | apartmentSuite | string | Detailed address |
| House number | houseNumber | string | Detailed address |
| Street/road name | streetAddress | string | Detailed address |
| District/sublocality | district | string | Detailed address |
| City/town/village/locality | city | string | Detailed address |
| State/county | state | string | Detailed address |
| Region | region | string | Detailed address |
| Country | country | string | Detailed address |
| ZIP/Postal code | zipCode | string | Detailed address |
| Full/combined address | fullAddress | string | Detailed address |
| Label | label | string | Optional |
| Labels | labels | string | Optional |
| Open deals | openDeals | number | Activity tracking |
| Won deals | wonDeals | number | Activity tracking |
| Lost deals | lostDeals | number | Activity tracking |
| Closed deals | closedDeals | number | Activity tracking |
| Total activities | totalActivities | number | Activity tracking |
| Done activities | doneActivities | number | Activity tracking |
| Activities to do | activitiesToDo | number | Activity tracking |
| Email messages count | emailMessagesCount | number | Activity tracking |
| Next activity date | nextActivityDate | DateTime | Activity tracking |
| Last activity date | lastActivityDate | DateTime | Activity tracking |
| Organization created | createdAt | DateTime | Timestamp |
| Update time | updatedAt | DateTime | Timestamp |

### PEOPLE (51 columns → Prisma Person model)

| Excel Column | Prisma Field | Type | Notes |
|--------------|--------------|------|-------|
| ID | *stored for mapping* | number | Pipedrive ID, not our DB ID |
| Name | name | string | Full name |
| First name | firstName | string | Required |
| Last name | lastName | string | Required |
| Email - Work | emailWork | string | Primary email |
| Email - Home | emailHome | string | Optional |
| Email - Other | emailOther | string | Optional |
| Phone - Work | phoneWork | string | Optional |
| Phone - Home | phoneHome | string | Optional |
| Phone - Mobile | phoneMobile | string | Optional |
| Phone - Other | phoneOther | string | Optional |
| Job title | title | string | Optional |
| Organization | *for reference* | string | Name only |
| Organization ID | organizationId | number | **KEY RELATIONSHIP** |
| Owner | *skip* | string | Will use default user |
| Postal address | postalAddress | string | Full address |
| Apartment/suite no | apartmentSuite | string | Detailed address |
| House number | houseNumber | string | Detailed address |
| Street/road name | streetAddress | string | Detailed address |
| District/sublocality | *skip* | string | Not in schema |
| City/town/village/locality | city | string | Detailed address |
| State/county | state | string | Detailed address |
| Region | region | string | Detailed address |
| Country | country | string | Detailed address |
| ZIP/Postal code | zipCode | string | Detailed address |
| Full/combined address | *skip* | string | Use postalAddress |
| Label | *skip* | string | Not used |
| Labels | labels | string | Optional |
| Notes | notes | string | Optional |
| Birthday | birthday | DateTime | Optional |
| LinkedIn profile | linkedInProfile | string | Optional |
| Qwilr Proposal | qwilrProposal | string | Custom field |
| Classification | classification | string | Custom field |
| Contact Type | contactType | string | Custom field |
| Instant messenger | instantMessenger | string | Optional |
| Open deals | openDeals | number | Activity tracking |
| Won deals | wonDeals | number | Activity tracking |
| Lost deals | lostDeals | number | Activity tracking |
| Closed deals | closedDeals | number | Activity tracking |
| Total activities | totalActivities | number | Activity tracking |
| Done activities | doneActivities | number | Activity tracking |
| Activities to do | activitiesToDo | number | Activity tracking |
| Email messages count | emailMessagesCount | number | Activity tracking |
| Next activity date | nextActivityDate | DateTime | Activity tracking |
| Last activity date | lastActivityDate | DateTime | Activity tracking |
| Last email received | lastEmailReceived | DateTime | Activity tracking |
| Last email sent | lastEmailSent | DateTime | Activity tracking |
| Person created | createdAt | DateTime | Timestamp |
| Update time | updatedAt | DateTime | Timestamp |

### DEALS (71 columns → Prisma Deal model)

| Excel Column | Prisma Field | Type | Notes |
|--------------|--------------|------|-------|
| ID | *stored for mapping* | number | Pipedrive ID, not our DB ID |
| Title | title | string | Required |
| Value | value | Decimal | Required |
| Currency of Value | currency | string | Default USD |
| Status | status | enum | open/won/lost |
| Pipeline | *lookup* | string | Must find/create pipeline |
| Stage | *lookup* | string | Must find/create stage |
| Owner | ownerId | string | **REQUIRED** - must map to User |
| Organization | *for reference* | string | Name only |
| Organization ID | organizationId | number | **KEY RELATIONSHIP** |
| Contact person | personId | string | **KEY RELATIONSHIP** - match by name |
| Expected close date | expectedCloseDate | DateTime | Optional |
| Won time | wonTime | DateTime | Optional |
| Lost time | lostTime | DateTime | Optional |
| Lost reason | lostReason | string | Optional |
| Label | label | string | Optional |
| Product name | productName | string | Optional |
| Source origin | sourceOrigin | string | Optional |
| Source origin ID | sourceOriginId | string | Optional |
| Source channel | sourceChannel | string | Optional |
| Source channel ID | sourceChannelId | string | Optional |
| Next activity date | nextActivityDate | DateTime | Activity tracking |
| Last activity date | lastActivityDate | DateTime | Activity tracking |
| Total activities | totalActivities | number | Activity tracking |
| Done activities | doneActivities | number | Activity tracking |
| Activities to do | activitiesToDo | number | Activity tracking |
| Email messages count | emailMessagesCount | number | Activity tracking |
| Last email received | lastEmailReceived | DateTime | Activity tracking |
| Last email sent | lastEmailSent | DateTime | Activity tracking |
| Go-Live Target | goLiveTarget | string | Custom field |
| Property Address | propertyAddress | string | Custom field |
| Property Type | propertyType | string | Custom field |
| Qty | qty | string | Custom field |
| ARR forecast | arrForecast | Decimal | Custom field |
| Currency of ARR forecast | arrForecastCurrency | string | Custom field |
| CapEx ROM | capexRom | Decimal | Custom field |
| Currency of CapEx ROM | capexRomCurrency | string | Custom field |
| ROI/NOI/BOM sheet | roiNoiBomSheet | string | Custom field |
| Prints/Plans External link | printsPlansExternal | string | Custom field |
| Prints/Plans OW DropBox Link | printsPlansDropbox | string | Custom field |
| Lead Source | leadSource | string | Custom field |
| Technical POC | technicalPOC | string | Custom field |
| ICP Segment | icpSegment | string | Custom field |
| Lead Source PPP | leadSourcePPP | string | Custom field |
| Readiness Score | readinessScore | string | Custom field |
| DDI Audit Status | ddiAuditStatus | string | Custom field |
| Audit Value | auditValue | Decimal | Custom field |
| Currency of Audit Value | auditValueCurrency | string | Custom field |
| ARR Expansion Potential | arrExpansionPotential | Decimal | Custom field |
| Currency of ARR Expansion Potential | arrExpansionCurrency | string | Custom field |
| Deal created | addTime | DateTime | Timestamp |
| Update time | updateTime | DateTime | Timestamp |
| Last stage change | stageChangeTime | DateTime | Timestamp |

## Critical Implementation Details

### 1. ID Mapping Strategy
We need to maintain a mapping between Pipedrive IDs and our database IDs:

```typescript
const orgIdMap = new Map<number, string>(); // Pipedrive ID → DB ID
const personIdMap = new Map<number, string>(); // Pipedrive ID → DB ID
```

### 2. Organization Import
- Create organizations first
- Store mapping: `orgIdMap.set(pipedriveId, dbId)`
- Handle duplicate names by appending number

### 3. People Import
- Look up organization using: `orgIdMap.get(row['Organization ID'])`
- Store mapping: `personIdMap.set(pipedriveId, dbId)`
- Use Email - Work as primary email (set as `email` field for uniqueness)
- Handle missing emails by generating placeholder

### 4. Deals Import
- Look up organization: `orgIdMap.get(row['Organization ID'])`
- Look up person by name matching (fuzzy match if needed)
- Must have valid pipeline and stage (create if missing)
- Must have valid owner (map to existing user or create default)

### 5. User/Owner Handling
We need to handle the "Owner" field in deals. Options:
- Map to existing user (bill@opticwise.com)
- Create placeholder users for each unique owner name
- Use single default user for all

### 6. Pipeline/Stage Handling
- Create "Sales Pipeline" if it doesn't exist
- Create all unique stages found in deals
- Maintain proper stage ordering

### 7. Data Validation
- Required fields must have values
- Email uniqueness for People
- Organization name uniqueness
- Date parsing (format: "YYYY-MM-DD HH:MM:SS")
- Decimal parsing for currency values
- Status enum validation (Open → open, Won → won, Lost → lost)

### 8. Error Handling
- Log all errors with row numbers
- Continue on non-critical errors
- Rollback on critical errors
- Generate detailed import report

## Import Script Flow

```
1. Connect to database
2. Get or create default user
3. Get or create "Sales Pipeline" pipeline
4. Import Organizations
   - Read Excel file
   - For each row:
     - Transform data
     - Create organization
     - Store ID mapping
   - Report results
5. Import People
   - Read Excel file
   - For each row:
     - Transform data
     - Look up organization ID
     - Create person
     - Store ID mapping
   - Report results
6. Import Deals
   - Read Excel file
   - Get all unique stages, create them
   - For each row:
     - Transform data
     - Look up organization ID
     - Look up person ID by name
     - Look up stage ID
     - Create deal
   - Report results
7. Generate final report
8. Disconnect from database
```

## Expected Results

- **Organizations**: ~4,859 imported
- **People**: ~11,568 imported
- **Deals**: ~175 imported
- **Relationships**: All properly linked via foreign keys

## Validation Queries

After import, run these to verify:

```sql
-- Check organization count
SELECT COUNT(*) FROM "Organization";

-- Check people count and org relationships
SELECT COUNT(*) FROM "Person";
SELECT COUNT(*) FROM "Person" WHERE "organizationId" IS NOT NULL;

-- Check deals count and relationships
SELECT COUNT(*) FROM "Deal";
SELECT COUNT(*) FROM "Deal" WHERE "organizationId" IS NOT NULL;
SELECT COUNT(*) FROM "Deal" WHERE "personId" IS NOT NULL;

-- Check orphaned records
SELECT COUNT(*) FROM "Person" WHERE "organizationId" IS NOT NULL 
  AND "organizationId" NOT IN (SELECT id FROM "Organization");
```

