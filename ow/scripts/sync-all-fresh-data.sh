#!/bin/bash
# Master Sync Script - Updates all data sources
# Run in Render shell: bash scripts/sync-all-fresh-data.sh

set -e

echo "🚀 OpticWise Data Sync - Full Refresh"
echo "======================================"
echo ""

cd /opt/render/project/src/ow || cd ~/project/src/ow || cd ow

# Check last sync dates
echo "📊 Current data status:"
psql $DATABASE_URL -c "
  SELECT 'Gmail' as source, MAX(date)::date as last_sync, COUNT(*) as total FROM \"GmailMessage\"
  UNION ALL
  SELECT 'Fathom', MAX(\"startTime\")::date, COUNT(*) FROM \"CallTranscript\"
  UNION ALL
  SELECT 'Drive', MAX(\"modifiedTime\")::date, COUNT(*) FROM \"DriveFile\";
"

echo ""
echo "🔄 Starting sync process..."
echo ""

# 1. Sync Gmail (last 30 days)
echo "📧 Step 1: Syncing Gmail (last 30 days)..."
npx tsx scripts/sync-gmail-30days.ts
echo "✅ Gmail sync complete"
echo ""

# 2. Fetch Fathom transcripts
echo "🎙️ Step 2: Fetching Fathom transcripts..."
npx tsx scripts/fetch-fathom-transcripts.ts
echo "✅ Fathom sync complete"
echo ""

# 3. Chunk new transcripts
echo "📝 Step 3: Chunking new transcripts..."
npx tsx scripts/chunk-and-vectorize-transcripts.ts
echo "✅ Transcript chunking complete"
echo ""

# 4. Sync Google Drive (optional, can be slow)
read -p "📁 Sync Google Drive? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx tsx scripts/sync-drive.ts
  echo "✅ Drive sync complete"
  
  echo "📄 Chunking large documents..."
  npx tsx scripts/chunk-and-vectorize-docs.ts
  echo "✅ Document chunking complete"
fi
echo ""

# 5. Sync Sales Inbox
echo "💼 Step 4: Syncing Sales Inbox..."
npx tsx scripts/sync-sales-inbox.ts
echo "✅ Sales Inbox sync complete"
echo ""

# 6. Vectorize new sales inbox emails
echo "✉️ Step 5: Vectorizing sales inbox..."
npx tsx scripts/vectorize-sales-inbox-emails.ts
echo "✅ Sales inbox vectorization complete"
echo ""

# 7. Clear semantic cache
echo "🧹 Step 6: Clearing semantic cache..."
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
echo "✅ Cache cleared"
echo ""

# Final status
echo "📊 Final status:"
psql $DATABASE_URL -c "
  SELECT 'Gmail' as source, MAX(date)::date as last_sync, COUNT(*) as total FROM \"GmailMessage\"
  UNION ALL
  SELECT 'Fathom', MAX(\"startTime\")::date, COUNT(*) FROM \"CallTranscript\"
  UNION ALL
  SELECT 'TranscriptChunks', MAX(\"createdAt\")::date, COUNT(*) FROM \"CallTranscriptChunk\"
  UNION ALL
  SELECT 'Drive', MAX(\"modifiedTime\")::date, COUNT(*) FROM \"DriveFile\"
  UNION ALL
  SELECT 'SalesInbox', MAX(\"sentAt\")::date, COUNT(*) FROM \"EmailMessage\";
"

echo ""
echo "✅ ✅ ✅ ALL SYNC COMPLETE! ✅ ✅ ✅"
echo ""
echo "Agent now has latest data and should perform much better!"
echo ""
