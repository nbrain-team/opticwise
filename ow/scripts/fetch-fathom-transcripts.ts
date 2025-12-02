/**
 * Fetch all historic transcripts from Fathom.ai
 * Based on official API documentation at developers.fathom.ai
 * 
 * Run with: npx tsx scripts/fetch-fathom-transcripts.ts
 */

const FATHOM_API_KEY = 'P-7I-RQkIVapQivlY4V4Q.pCnEO1zRbVl0HPw4PlWKtMYi01jeV7sNKBvEcj7cpUM';
const FATHOM_API_BASE = 'https://api.fathom.ai/external/v1';

interface FathomSpeaker {
  display_name: string;
  matched_calendar_invitee_email?: string;
}

interface FathomTranscriptSegment {
  speaker: FathomSpeaker;
  text: string;
  timestamp: string;
}

interface FathomRecording {
  id: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  participants?: any[];
  [key: string]: any;
}

interface FathomTranscriptResponse {
  transcript: FathomTranscriptSegment[];
}

/**
 * Make authenticated request to Fathom API
 */
async function fathomRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FATHOM_API_BASE}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Api-Key': FATHOM_API_KEY,
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fathom API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * List all recordings
 * Note: The exact endpoint may vary - trying common patterns
 */
async function listRecordings(): Promise<FathomRecording[]> {
  console.log('📋 Fetching list of recordings...\n');
  
  // Try different possible endpoints for listing recordings
  const possibleEndpoints = [
    '/recordings',
    '/meetings',
    '/calls',
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      const data = await fathomRequest<any>(endpoint);
      
      // The response might be an array or an object with a data/recordings property
      const recordings = Array.isArray(data) ? data : 
                        data.recordings || data.data || data.meetings || [];
      
      if (recordings.length > 0) {
        console.log(`✅ Found ${recordings.length} recordings at ${endpoint}\n`);
        return recordings;
      }
    } catch (error) {
      console.log(`❌ ${endpoint} failed:`, error instanceof Error ? error.message : error);
    }
  }

  throw new Error('Could not find recordings endpoint. May need to check API documentation.');
}

/**
 * Fetch transcript for a specific recording
 */
async function fetchTranscript(recordingId: string): Promise<FathomTranscriptResponse> {
  console.log(`📝 Fetching transcript for recording: ${recordingId}`);
  
  try {
    const transcript = await fathomRequest<FathomTranscriptResponse>(
      `/recordings/${recordingId}/transcript`
    );
    
    console.log(`✅ Retrieved transcript with ${transcript.transcript?.length || 0} segments`);
    return transcript;
  } catch (error) {
    console.error(`❌ Failed to fetch transcript:`, error);
    throw error;
  }
}

/**
 * Convert transcript segments to plain text
 */
function transcriptToText(segments: FathomTranscriptSegment[]): string {
  return segments.map(segment => {
    const speaker = segment.speaker.display_name || 'Unknown Speaker';
    const timestamp = segment.timestamp || '';
    return `[${timestamp}] ${speaker}: ${segment.text}`;
  }).join('\n');
}

/**
 * Extract unique participants from transcript
 */
function extractParticipants(segments: FathomTranscriptSegment[]): Array<{name: string, email?: string}> {
  const participantsMap = new Map<string, {name: string, email?: string}>();
  
  segments.forEach(segment => {
    const speaker = segment.speaker;
    const key = speaker.matched_calendar_invitee_email || speaker.display_name;
    
    if (key && !participantsMap.has(key)) {
      participantsMap.set(key, {
        name: speaker.display_name,
        email: speaker.matched_calendar_invitee_email,
      });
    }
  });
  
  return Array.from(participantsMap.values());
}

/**
 * Main function to fetch all historic transcripts
 */
async function fetchAllTranscripts() {
  console.log('=================================================');
  console.log('🎯 Fetching All Historic Fathom Transcripts');
  console.log('=================================================\n');
  console.log(`API Key: ${FATHOM_API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${FATHOM_API_BASE}\n`);

  try {
    // Step 1: Get list of all recordings
    const recordings = await listRecordings();
    
    if (recordings.length === 0) {
      console.log('ℹ️  No recordings found in your Fathom account.');
      return;
    }

    console.log('📊 Recording Summary:');
    console.log('─────────────────────────────────────────────');
    console.log(`Total recordings found: ${recordings.length}\n`);

    // Display first few recordings
    recordings.slice(0, 5).forEach((recording, index) => {
      console.log(`${index + 1}. ${recording.title || 'Untitled'}`);
      console.log(`   ID: ${recording.id}`);
      if (recording.start_time) {
        console.log(`   Date: ${new Date(recording.start_time).toLocaleString()}`);
      }
      console.log('');
    });

    if (recordings.length > 5) {
      console.log(`   ... and ${recordings.length - 5} more\n`);
    }

    // Step 2: Fetch transcripts for each recording
    console.log('\n=================================================');
    console.log('📥 Fetching Transcripts');
    console.log('=================================================\n');

    const transcripts: Array<{
      recording: FathomRecording;
      transcript: FathomTranscriptResponse;
      fullText: string;
      participants: Array<{name: string, email?: string}>;
    }> = [];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recordings.length; i++) {
      const recording = recordings[i];
      console.log(`\n[${i + 1}/${recordings.length}] ${recording.title || 'Untitled'}`);
      
      try {
        const transcript = await fetchTranscript(recording.id);
        
        if (transcript.transcript && transcript.transcript.length > 0) {
          const fullText = transcriptToText(transcript.transcript);
          const participants = extractParticipants(transcript.transcript);
          
          transcripts.push({
            recording,
            transcript,
            fullText,
            participants,
          });
          
          successCount++;
          console.log(`   ✅ Success - ${transcript.transcript.length} segments, ${fullText.length} chars`);
          console.log(`   Participants: ${participants.map(p => p.name).join(', ')}`);
        } else {
          failCount++;
          console.log(`   ⚠️  No transcript available`);
        }
        
        // Rate limiting - be nice to the API
        if (i < recordings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        failCount++;
        console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
      }
    }

    // Step 3: Summary and export
    console.log('\n\n=================================================');
    console.log('📊 Final Summary');
    console.log('=================================================\n');
    console.log(`Total recordings: ${recordings.length}`);
    console.log(`Transcripts fetched: ${successCount}`);
    console.log(`Failed/Missing: ${failCount}\n`);

    if (transcripts.length > 0) {
      // Calculate statistics
      const totalSegments = transcripts.reduce((sum, t) => sum + t.transcript.transcript.length, 0);
      const totalChars = transcripts.reduce((sum, t) => sum + t.fullText.length, 0);
      const avgSegments = Math.round(totalSegments / transcripts.length);
      const avgChars = Math.round(totalChars / transcripts.length);

      console.log('📈 Statistics:');
      console.log(`   Total transcript segments: ${totalSegments.toLocaleString()}`);
      console.log(`   Total characters: ${totalChars.toLocaleString()}`);
      console.log(`   Average segments per call: ${avgSegments}`);
      console.log(`   Average characters per call: ${avgChars.toLocaleString()}\n`);

      // Save to JSON file for inspection
      const fs = require('fs');
      const outputPath = './fathom-transcripts-export.json';
      
      fs.writeFileSync(
        outputPath,
        JSON.stringify(transcripts, null, 2),
        'utf-8'
      );
      
      console.log(`💾 Data exported to: ${outputPath}`);
      console.log('\n✅ Next steps:');
      console.log('   1. Review the exported JSON file');
      console.log('   2. Import transcripts into database');
      console.log('   3. Vectorize transcripts for AI/search');
      console.log('   4. Link transcripts to deals/contacts\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error('\nPossible issues:');
    console.error('1. Invalid API key');
    console.error('2. Incorrect API endpoint');
    console.error('3. Network connectivity issues');
    console.error('4. API access not enabled on your plan\n');
    process.exit(1);
  }
}

// Run the script
fetchAllTranscripts().catch(console.error);



