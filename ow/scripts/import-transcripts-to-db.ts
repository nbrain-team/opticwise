/**
 * Import Fathom transcripts from JSON export into the database
 * Run with: npx tsx scripts/import-transcripts-to-db.ts
 */

import { prisma } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

interface FathomTranscriptSegment {
  speaker: {
    display_name: string;
    matched_calendar_invitee_email?: string;
  };
  text: string;
  timestamp: string;
}

interface FathomMeeting {
  title: string;
  meeting_title: string;
  recording_id: number;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  recording_start_time: string;
  recording_end_time: string;
  transcript?: FathomTranscriptSegment[];
  default_summary?: {
    template_name: string;
    markdown_formatted: string;
  };
  action_items?: Array<{
    description: string;
    user_generated: boolean;
    completed: boolean;
    recording_timestamp?: string;
    recording_playback_url?: string;
    assignee?: {
      name: string;
      email?: string;
      team?: string;
    };
  }>;
  calendar_invitees?: Array<{
    name: string;
    matched_speaker_display_name?: string;
    email?: string;
    email_domain?: string;
    is_external?: boolean;
  }>;
  transcriptText?: string;
  [key: string]: any;
}

async function importTranscripts() {
  console.log('=================================================');
  console.log('📥 Importing Fathom Transcripts to Database');
  console.log('=================================================\n');

  try {
    // Load the export file
    const exportPath = path.join(__dirname, '../fathom-meetings-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.error('❌ Export file not found:', exportPath);
      console.error('Please run fetch-fathom-meetings.ts first to generate the export file.');
      process.exit(1);
    }

    console.log(`📂 Loading: ${exportPath}\n`);
    const rawData = fs.readFileSync(exportPath, 'utf-8');
    const meetings: FathomMeeting[] = JSON.parse(rawData);

    console.log(`✅ Loaded ${meetings.length} meetings\n`);

    // Import each meeting
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < meetings.length; i++) {
      const meeting = meetings[i];
      const progress = `[${i + 1}/${meetings.length}]`;

      console.log(`${progress} Processing: ${meeting.title || 'Untitled'}`);

      try {
        // Check if already exists
        const existing = await prisma.callTranscript.findUnique({
          where: { fathomCallId: meeting.recording_id.toString() },
        });

        if (existing) {
          console.log(`   ⏭️  Skipped - already in database`);
          skipCount++;
          continue;
        }

        // Find matching person by email
        let personId: string | null = null;
        let organizationId: string | null = null;

        if (meeting.calendar_invitees) {
          for (const invitee of meeting.calendar_invitees) {
            if (invitee.email) {
              const person = await prisma.person.findUnique({
                where: { email: invitee.email },
                select: { id: true, organizationId: true },
              });

              if (person) {
                personId = person.id;
                organizationId = person.organizationId;
                console.log(`   👤 Linked to: ${invitee.email}`);
                break;
              }
            }
          }
        }

        // Prepare transcript data
        const transcriptText = meeting.transcriptText || '';
        const transcriptJson = meeting.transcript || null;
        const summary = meeting.default_summary?.markdown_formatted || null;

        // Calculate duration in seconds
        let duration: number | null = null;
        if (meeting.recording_start_time && meeting.recording_end_time) {
          const start = new Date(meeting.recording_start_time).getTime();
          const end = new Date(meeting.recording_end_time).getTime();
          duration = Math.round((end - start) / 1000);
        }

        // Create the transcript record
        const created = await prisma.callTranscript.create({
          data: {
            fathomCallId: meeting.recording_id.toString(),
            title: meeting.title || meeting.meeting_title || 'Untitled Call',
            transcript: transcriptText,
            transcriptJson,
            summary,
            startTime: new Date(meeting.recording_start_time || meeting.scheduled_start_time || meeting.created_at),
            endTime: meeting.recording_end_time ? new Date(meeting.recording_end_time) : null,
            duration,
            participants: meeting.calendar_invitees || [],
            recordingUrl: meeting.url,
            personId,
            organizationId,
            metadata: meeting,
          },
        });

        console.log(`   ✅ Imported - ${transcriptText.length} chars`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n=================================================');
    console.log('📊 Import Summary');
    console.log('=================================================\n');
    console.log(`Total meetings: ${meetings.length}`);
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}\n`);

    if (successCount > 0) {
      console.log('✅ Import complete! Transcripts are now in the database.');
      console.log('\nNext steps:');
      console.log('1. View transcripts in the CRM');
      console.log('2. Vectorize for AI search');
      console.log('3. Set up webhooks for future transcripts\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
importTranscripts()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

