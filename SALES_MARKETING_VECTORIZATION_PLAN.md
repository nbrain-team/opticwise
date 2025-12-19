# Sales & Marketing Drive Vectorization Plan

## Overview
Created a comprehensive script to vectorize ALL files from the OpticWise Sales & Marketing shared drive, including all subfolders and sub-subfolders recursively.

## What We Found

### Shared Drive Details
- **Drive Name:** OpticWise Sales & Marketing
- **Drive ID:** `0AMmNVvy1_Jb3Uk9PVA`
- **Total Folders:** 191 folders (including all nested subfolders)
- **Main Sections:**
  - 300 - Sales & Marketing (127 subfolders)
  - 400 - Proposals (61 subfolders)
  - Content Series (1 subfolder)
  - Drew Test Folder

## Script Created: `vectorize-sales-marketing-drive.ts`

### Supported File Types
The script will vectorize the following file types:
- ✅ PDF files (`application/pdf`)
- ✅ Google Docs (`application/vnd.google-apps.document`)
- ✅ Google Sheets (`application/vnd.google-apps.spreadsheet`)
- ✅ Google Slides (`application/vnd.google-apps.presentation`)
- ✅ Word documents (`.docx`, `.doc`)
- ✅ Excel spreadsheets (`.xlsx`)
- ✅ PowerPoint presentations (`.pptx`)
- ✅ Text files (`.txt`)
- ✅ Markdown files (`.md`)
- ✅ CSV files (`.csv`)
- ✅ HTML files (`.html`)

### Key Features
1. **Recursive Processing:** Searches ALL subfolders automatically
2. **Full Folder Paths:** Builds complete folder paths (e.g., "Sales & Marketing/OpticWise Awards/2024 CIO Bulletin")
3. **Smart Skip:** Avoids re-processing already vectorized files
4. **Progress Tracking:** Shows real-time progress with speed and time estimates
5. **Error Resilience:** Continues processing even if some files fail
6. **Rate Limiting:** Respects OpenAI and Google Drive API limits

### What Gets Extracted
For each file:
- File name and type
- Full folder path within the drive
- Description (if available)
- Text content (extracted from Google Docs, plain text, etc.)
- Metadata (size, creation date, modification date, owners)
- AI embedding (1024-dimension vector for semantic search)

## How to Run on Render

Since the script needs `OPENAI_API_KEY` and `DATABASE_URL`, it must run on Render where these are configured.

### Option 1: Run via Render Shell (Recommended)

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service: `opticwise-frontend`
3. Click **Shell** tab
4. Run the command:
   ```bash
   cd /opt/render/project/src/ow
   npx tsx scripts/vectorize-sales-marketing-drive.ts
   ```

### Option 2: SSH into Render (if enabled)

```bash
ssh <your-render-ssh-connection>
cd /opt/render/project/src/ow
npx tsx scripts/vectorize-sales-marketing-drive.ts
```

### Option 3: Create a One-Time Job

Create a one-time background job in Render with:
- **Command:** `cd ow && npx tsx scripts/vectorize-sales-marketing-drive.ts`
- **Environment:** Same as your web service

## Expected Results

Based on our shared drive check, we expect to find:
- **Hundreds of files** across 191 folders
- Many Google Docs, PDFs, Word documents
- Marketing materials, proposals, awards, team photos metadata
- Case studies, press releases, technical documentation

The script will:
1. Discover all vectorizable files (may take 1-2 minutes)
2. Show file type breakdown
3. Process each file (extract text → generate embedding → save to DB)
4. Show progress every 10 files
5. Display final summary with stats

## Estimated Time

Depends on file count, but roughly:
- **Discovery:** 1-2 minutes
- **Processing:** ~3-5 seconds per file (text extraction + AI embedding)
- **For 500 files:** ~25-40 minutes total
- **For 1000 files:** ~50-80 minutes total

## After Vectorization

Once complete, all files will be searchable via:
- `/app/api/ownet/chat/route.ts` - AI-powered semantic search
- Knowledge base queries in your CRM
- Deal context matching (e.g., "Find proposals similar to this deal")

## Monitoring Progress

The script outputs:
```
[1/500] 📄 Whitepaper - Future Ready Apartment Living 2024.pdf
   Type: application/pdf
   Path: Sales & Marketing/shared folder for OW timeline
   Extracting content...
      ℹ PDF detected (metadata only)
   Generating AI embedding...
   ✅ Created & vectorized

   📊 Progress: 10/500 files (2.3/sec, ~213s remaining)
```

## Database Schema

Files are stored in the `DriveFile` table with:
- `googleFileId` - Unique Google file ID
- `name` - File name
- `mimeType` - File type
- `folderPath` - Full path in drive
- `content` - Extracted text
- `embedding` - AI vector (1024 dimensions)
- `vectorized` - Boolean flag
- Relations to `Deal`, `Person`, `Organization`

## Next Steps After This

1. ✅ Vectorize Sales & Marketing drive (this script)
2. Create similar scripts for other shared drives:
   - Engineering & Client Support
   - Executives Only
   - Shared content on Web
3. Set up automatic sync (daily/weekly) for new/updated files
4. Link files to relevant deals and contacts automatically

