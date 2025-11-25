/**
 * Fetch all historic meetings and transcripts from Fathom.ai
 * Using the correct /meetings endpoint from official API documentation
 * 
 * Run with: npx tsx scripts/fetch-fathom-meetings.ts
 */

const FATHOM_API_KEY = process.env.FATHOM_API_KEY || '8fuLKlIsTp5Jbi0bb_ETXw.dnF6flqP82lAvS4-0o25q3-KYQ6IYrenl7VXhLgcCa4';
const FATHOM_API_BASE = 'https://api.fathom.ai/external/v1';

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
  transcript?: Array<{
    speaker: {
      display_name: string;
      matched_calendar_invitee_email?: string;
    };
    text: string;
    timestamp: string;
  }>;
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
  [key: string]: any;
}

interface FathomMeetingsResponse {
  limit: number | null;
  next_cursor: string | null;
  items: FathomMeeting[];
}

/**
 * Make authenticated request to Fathom API
 */
async function fathomRequest<T>(
  path: string,
  queryParams?: Record<string, string>
): Promise<T> {
  const url = new URL(`${FATHOM_API_BASE}${path}`);
  
  // Add query parameters
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  console.log(`🌐 Request: ${url.toString()}`);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Api-Key': FATHOM_API_KEY,
      'Accept': 'application/json',
    },
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Error response body:`, errorText.substring(0, 500));
    throw new Error(`Fathom API error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch all meetings with transcripts
 */
async function fetchAllMeetings(): Promise<FathomMeeting[]> {
  console.log('📋 Fetching all meetings from Fathom...\n');
  
  const allMeetings: FathomMeeting[] = [];
  let cursor: string | null = null;
  let pageNum = 1;
  
  try {
    do {
      console.log(`\n📄 Fetching page ${pageNum}...`);
      
      const queryParams: Record<string, string> = {
        include_transcript: 'true',
        include_summary: 'true',
        include_action_items: 'true',
      };
      
      if (cursor) {
        queryParams.cursor = cursor;
      }
      
      const response = await fathomRequest<FathomMeetingsResponse>(
        '/meetings',
        queryParams
      );
      
      console.log(`✅ Received ${response.items.length} meetings`);
      console.log(`   Next cursor: ${response.next_cursor || 'none (last page)'}`);
      
      allMeetings.push(...response.items);
      cursor = response.next_cursor;
      pageNum++;
      
      // Safety limit to prevent infinite loops during testing
      if (pageNum > 100) {
        console.warn('⚠️  Reached safety limit of 100 pages. Stopping.');
        break;
      }
      
      // Rate limiting - be nice to the API
      if (cursor) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } while (cursor);
    
    return allMeetings;
    
  } catch (error) {
    console.error('\n❌ Error fetching meetings:', error);
    
    if (error instanceof Error && error.message.includes('503')) {
      console.error('\n⚠️  503 Service Unavailable - Possible causes:');
      console.error('1. API key may not be activated in Fathom settings');
      console.error('2. You may not have any recordings yet');
      console.error('3. API service may be temporarily down');
      console.error('4. Your account may not have API access enabled\n');
      console.error('📝 Action items:');
      console.error('- Log into https://app.fathom.ai');
      console.error('- Go to User Settings → API Access');
      console.error('- Verify your API key is active');
      console.error('- Check if you have recorded any meetings');
      console.error('- Try regenerating the API key if needed\n');
    }
    
    throw error;
  }
}

/**
 * Convert transcript array to plain text
 */
function transcriptToText(transcript: FathomMeeting['transcript']): string {
  if (!transcript || !Array.isArray(transcript)) return '';
  
  return transcript.map(segment => {
    const speaker = segment.speaker.display_name || 'Unknown Speaker';
    const timestamp = segment.timestamp || '';
    return `[${timestamp}] ${speaker}: ${segment.text}`;
  }).join('\n');
}

/**
 * Main function
 */
async function main() {
  console.log('=================================================');
  console.log('🎯 Fathom.ai Historic Meetings & Transcripts Fetcher');
  console.log('=================================================\n');
  console.log(`API Key: ${FATHOM_API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${FATHOM_API_BASE}\n`);

  try {
    // Fetch all meetings
    const meetings = await fetchAllMeetings();
    
    if (meetings.length === 0) {
      console.log('\n📭 No meetings found.');
      console.log('\nThis could mean:');
      console.log('1. No meetings have been recorded yet');
      console.log('2. API key only has access to your own recordings');
      console.log('3. No meetings have been shared with your team\n');
      return;
    }

    // Display results
    console.log('\n\n=================================================');
    console.log('📊 Results Summary');
    console.log('=================================================\n');
    console.log(`Total meetings fetched: ${meetings.length}\n`);

    // Statistics
    const withTranscript = meetings.filter(m => m.transcript && m.transcript.length > 0);
    const withSummary = meetings.filter(m => m.default_summary);
    const withActionItems = meetings.filter(m => m.action_items && m.action_items.length > 0);

    console.log('📈 Statistics:');
    console.log(`   Meetings with transcripts: ${withTranscript.length}`);
    console.log(`   Meetings with summaries: ${withSummary.length}`);
    console.log(`   Meetings with action items: ${withActionItems.length}\n`);

    // Show first few meetings
    console.log('📋 First 5 meetings:\n');
    meetings.slice(0, 5).forEach((meeting, index) => {
      console.log(`${index + 1}. ${meeting.title || meeting.meeting_title || 'Untitled'}`);
      console.log(`   Recording ID: ${meeting.recording_id}`);
      console.log(`   Date: ${new Date(meeting.created_at).toLocaleString()}`);
      console.log(`   URL: ${meeting.url}`);
      
      if (meeting.transcript) {
        const transcriptText = transcriptToText(meeting.transcript);
        console.log(`   Transcript: ${meeting.transcript.length} segments, ${transcriptText.length} chars`);
      }
      
      if (meeting.calendar_invitees) {
        const participants = meeting.calendar_invitees.map(p => p.name || p.email).filter(Boolean);
        console.log(`   Participants: ${participants.join(', ')}`);
      }
      
      console.log('');
    });

    if (meetings.length > 5) {
      console.log(`   ... and ${meetings.length - 5} more meetings\n`);
    }

    // Export to JSON
    const fs = require('fs');
    const outputPath = './fathom-meetings-export.json';
    
    const exportData = meetings.map(meeting => ({
      ...meeting,
      transcriptText: transcriptToText(meeting.transcript),
    }));
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(exportData, null, 2),
      'utf-8'
    );
    
    console.log(`\n💾 Full data exported to: ${outputPath}`);
    console.log('\n✅ Success! Next steps:');
    console.log('   1. Review the exported JSON file');
    console.log('   2. Import into database using the webhook handler or bulk import script');
    console.log('   3. Set up webhooks for future meetings\n');

  } catch (error) {
    console.error('\n=================================================');
    console.error('❌ Failed to fetch meetings');
    console.error('=================================================\n');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

