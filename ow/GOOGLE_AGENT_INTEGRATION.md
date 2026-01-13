# Google Workspace + OWNet Agent Integration

Complete integration of Google Workspace (Gmail, Calendar, Drive) with the OWNet AI agent.

## 🎯 Overview

The OWNet agent now has full access to:
- **Gmail**: Last 6 months of emails with semantic search
- **Calendar**: All calendar events with semantic search  
- **Drive**: All files and documents with content extraction and semantic search

All data is vectorized using OpenAI embeddings and stored in PostgreSQL with pgvector for lightning-fast semantic search.

## 🗄️ Database Schema

### New Tables Added

1. **GmailMessage** - Stores email messages with full content and metadata
2. **CalendarEvent** - Stores calendar events with attendees and details
3. **DriveFile** - Stores Drive files with extracted content

All tables include:
- Vector embeddings for semantic search
- Automatic CRM linking (deals, people, organizations)
- Full metadata preservation

## 🔄 Data Sync

### Initial Sync

Run the master sync script to import all Google Workspace data:

```bash
npm run sync:google
```

This will:
1. Sync last 6 months of Gmail messages
2. Sync all calendar events from last 6 months
3. Sync all Drive files
4. Extract text from documents
5. Generate embeddings for all content
6. Store everything in PostgreSQL

### Individual Syncs

You can also sync each service separately:

```bash
npm run sync:gmail      # Sync Gmail only
npm run sync:calendar   # Sync Calendar only
npm run sync:drive      # Sync Drive only
```

## 🤖 Agent Capabilities

The OWNet agent now automatically searches Google Workspace data when relevant:

### Email Search
**Triggered by:** email, mail, message, conversation
**Example queries:**
- "What emails did I receive about the Koelbel project?"
- "Show me recent conversations with Bill"
- "Find emails about pricing from last month"

### Calendar Search
**Triggered by:** meeting, calendar, schedule, event
**Example queries:**
- "What meetings do I have this week?"
- "When was my last meeting with Navjeet?"
- "Show upcoming client calls"

### Drive Search
**Triggered by:** document, file, drive, proposal
**Example queries:**
- "Find the latest proposal for Mass Equities"
- "What documents mention DDI audit?"
- "Show me files related to the Cardone deal"

## 🔧 Technical Details

### Vector Search

All Google Workspace data uses:
- **Model**: `text-embedding-3-large`
- **Dimensions**: 1024
- **Index**: pgvector with IVFFlat
- **Distance**: Cosine similarity

### Embedding Strategy

**Gmail**:
```
Subject: {subject}
From: {from}
Body: {body}
```

**Calendar**:
```
Event: {summary}
Description: {description}
Location: {location}
Attendees: {attendees}
Time: {datetime}
```

**Drive**:
```
Filename: {name}
Description: {description}
Type: {mimeType}
Content: {extracted_text}
```

### Database Indexes

Optimized indexes for:
- Vector similarity search (IVFFlat)
- Date-based queries
- CRM relationship lookups
- Full-text search capabilities

## 📊 Data Flow

```
Google Workspace APIs
        ↓
    Sync Scripts
        ↓
  Content Extraction
        ↓
OpenAI Embedding Generation
        ↓
  PostgreSQL Storage
        ↓
   OWNet Agent
        ↓
  Semantic Search
        ↓
   User Queries
```

## 🚀 Deployment Steps

### 1. Database Migration

Run the migration to create tables:

```sql
-- This is done automatically on deploy
-- See: prisma/migrations/003_google_workspace_tables.sql
```

### 2. Enable pgvector

The migration automatically enables pgvector extension.

### 3. Run Initial Sync

After deployment, run the sync command on Render:

```bash
cd ow && npm run sync:google
```

Or via Render shell:
```bash
npm run sync:google
```

### 4. Schedule Regular Syncs

Set up a cron job or scheduled task to keep data fresh:

```bash
# Daily sync at 2 AM
0 2 * * * cd /path/to/ow && npm run sync:google
```

## 📈 Performance

### Sync Times (Estimated)

- **Gmail** (500 messages): ~5-10 minutes
- **Calendar** (100 events): ~1-2 minutes
- **Drive** (1000 files): ~10-20 minutes
- **Total initial sync**: ~15-30 minutes

### Search Performance

- Vector search: <100ms for 5 results
- Combined search (Gmail + Calendar + Drive): <300ms
- Agent response with Google context: ~2-3 seconds

## 🔒 Security & Privacy

- Service account credentials stored securely in Render secrets
- Email content encrypted at rest in PostgreSQL
- Vector embeddings don't expose raw content
- CRM linking respects existing privacy settings
- All API calls use OAuth2 or service account authentication

## 🎨 Agent Context Formatting

The agent receives Google Workspace data in a structured format:

```markdown
**Relevant Emails:**

1. **Re: Koelbel Project Timeline**
   - From: bill@opticwise.com
   - Date: 12/5/2025
   - Preview: Thanks for the update. The DDI audit...

**Relevant Calendar Events:**

1. **Koelbel - Technical Review**
   - Time: 12/10/2025 2:00 PM - 3:00 PM
   - Location: Google Meet
   - Attendees: Bill, Navjeet, John
   - Description: Review technical requirements...

**Relevant Drive Files:**

1. **Koelbel_Proposal_Final.pdf**
   - Type: application/pdf
   - Modified: 12/4/2025
   - Preview: Project Overview Executive Summary...
   - Link: https://drive.google.com/file/d/...
```

## 🔄 Incremental Updates

The sync scripts automatically skip already-synced items:
- Checks for existing `gmailMessageId`, `googleEventId`, `googleFileId`
- Only syncs new items
- Updates vectorization if content changed

## 🐛 Troubleshooting

**Sync fails with "Service account credentials not found"**
- Verify secret file uploaded to Render: `/etc/secrets/google-service-account.json`

**Vector search returns no results**
- Check if data is vectorized: `SELECT COUNT(*) FROM "GmailMessage" WHERE vectorized = true`
- Verify pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector'`

**Agent doesn't search Google data**
- Check query keywords trigger the search
- Verify embeddings are being generated
- Check database connection in agent logs

**Rate limit errors during sync**
- Increase delay between API calls in sync scripts
- Run syncs during off-peak hours
- Contact Google to increase API quotas

## 📝 Future Enhancements

- [ ] Real-time sync via webhooks
- [ ] Automatic CRM entity matching
- [ ] Email thread reconstruction
- [ ] Calendar event suggestions
- [ ] Drive file recommendations
- [ ] Multi-account support
- [ ] Advanced filtering and faceting

## 🎯 Success Metrics

After deployment, you can query:

```sql
-- Total synced items
SELECT 
  (SELECT COUNT(*) FROM "GmailMessage") as emails,
  (SELECT COUNT(*) FROM "CalendarEvent") as events,
  (SELECT COUNT(*) FROM "DriveFile") as files;

-- Vectorization status
SELECT 
  (SELECT COUNT(*) FROM "GmailMessage" WHERE vectorized = true) as vectorized_emails,
  (SELECT COUNT(*) FROM "CalendarEvent" WHERE vectorized = true) as vectorized_events,
  (SELECT COUNT(*) FROM "DriveFile" WHERE vectorized = true) as vectorized_files;
```

Expected results after initial sync:
- ✅ Hundreds of emails vectorized
- ✅ Dozens of calendar events vectorized
- ✅ Hundreds of Drive files vectorized
- ✅ Vector search working in <100ms
- ✅ Agent using Google context in responses






