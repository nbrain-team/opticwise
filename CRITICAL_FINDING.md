# CRITICAL FINDING: Why Newbury Works Better

## The Key Difference

**Newbury uses CHUNKED transcripts** - not full transcripts!

### Newbury Architecture:
```sql
meeting_transcript_chunks:
- transcript_id
- chunk_index
- chunk_text (500 words each)
- embedding vector(1536)
```

**Result:** When searching, finds specific 500-word segments that are relevant

### OpticWise Architecture (Current):
```sql
CallTranscript:
- id  
- transcript (15,000 - 110,000 characters - FULL TEXT)
- embedding vector(1024)
```

**Result:** When searching, finds full transcript matches which are less precise

## Why This Matters

**Example Query:** "What questions do customers ask about pricing?"

**Newbury (Chunked):**
- Searches 500-word chunks
- Finds specific conversation segment about pricing
- Returns exact relevant portion
- ✅ High quality, focused results

**OpticWise (Full):**
- Searches full 50,000-char transcripts
- Matches entire call that mentions pricing somewhere
- Returns summary or truncated transcript
- ❌ Less precise, misses specific questions

## Why Pinecone "Worked Better"

**Pinecone WAS chunking the transcripts!**

Looking at `ow/scripts/vectorize-all-transcripts.ts`:
- Line 19: `const CHUNK_SIZE = 500;` (words per chunk)
- Lines 64-108: Chunks transcripts before uploading to Pinecone
- Each 500-word chunk stored separately with metadata

**When we moved to PostgreSQL, we stored FULL transcripts instead of chunks!**

## The Solution

Create `CallTranscriptChunk` table:
```sql
CREATE TABLE "CallTranscriptChunk" (
  id TEXT PRIMARY KEY,
  "transcriptId" TEXT REFERENCES "CallTranscript"(id),
  "chunkIndex" INT,
  "chunkText" TEXT,
  embedding vector(1024),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

Then:
1. Chunk the 142 transcripts into ~500-word pieces
2. Vectorize each chunk
3. Search chunks instead of full transcripts
4. **Exactly like Newbury Partners!**

## Immediate Action

This explains EVERYTHING:
- Why Pinecone worked better (it had chunks)
- Why PostgreSQL seems worse (we're storing full docs)
- Why responses are poor quality (matching full transcripts not specific parts)

**We need to implement chunking for OpticWise!**
