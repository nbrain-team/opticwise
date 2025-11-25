/**
 * Test script to verify Fathom.ai API access and fetch transcripts
 * Run with: npx tsx scripts/test-fathom-api.ts
 */

const FATHOM_API_KEY = 'P-7I-RQkIVapQivlY4V4Q.pCnEO1zRbVl0HPw4PlWKtMYi01jeV7sNKBvEcj7cpUM';
// Try different possible API endpoints
const POSSIBLE_ENDPOINTS = [
  'https://api.fathom.video',
  'https://app.fathom.video/api',
  'https://fathom.video/api',
  'https://api.usefathom.com',
  'https://us.fathom.video/api',
];

let FATHOM_API_BASE = POSSIBLE_ENDPOINTS[1]; // Start with app.fathom.video/api

interface FathomCall {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration: number;
  participants: string[];
  recording_url?: string;
  transcript?: string;
}

/**
 * Test multiple endpoint possibilities
 */
async function findWorkingEndpoint(): Promise<string> {
  console.log('🔍 Testing different API endpoints...\n');
  
  for (const endpoint of POSSIBLE_ENDPOINTS) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      // Try different path variations
      const paths = ['/v1/calls', '/api/v1/calls', '/calls'];
      
      for (const path of paths) {
        try {
          const url = `${endpoint}${path}`;
          console.log(`  Trying: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${FATHOM_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`  Status: ${response.status}`);
          
          if (response.status === 200 || response.status === 401 || response.status === 403) {
            // 200 = success, 401/403 = auth issue but endpoint exists
            console.log(`  ✅ Found working endpoint: ${endpoint}${path}\n`);
            return endpoint;
          }
        } catch (err) {
          // Continue to next path
        }
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }
  
  throw new Error('Could not find working API endpoint');
}

/**
 * Fetch all calls from Fathom
 */
async function fetchCalls(): Promise<FathomCall[]> {
  try {
    console.log('🔍 Fetching calls from Fathom.ai...\n');
    
    const response = await fetch(`${FATHOM_API_BASE}/v1/calls`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fathom API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.calls?.length || 0} calls\n`);
    
    return data.calls || [];
  } catch (error) {
    console.error('❌ Error fetching calls:', error);
    throw error;
  }
}

/**
 * Fetch a specific call's details including transcript
 */
async function fetchCallDetails(callId: string): Promise<any> {
  try {
    console.log(`📄 Fetching details for call: ${callId}...\n`);
    
    const response = await fetch(`${FATHOM_API_BASE}/v1/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fathom API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching call details for ${callId}:`, error);
    throw error;
  }
}

/**
 * Fetch transcript for a specific call
 */
async function fetchTranscript(callId: string): Promise<string> {
  try {
    console.log(`📝 Fetching transcript for call: ${callId}...\n`);
    
    const response = await fetch(`${FATHOM_API_BASE}/v1/calls/${callId}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fathom API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.transcript || '';
  } catch (error) {
    console.error(`❌ Error fetching transcript for ${callId}:`, error);
    throw error;
  }
}

/**
 * Main test function
 */
async function testFathomAPI() {
  console.log('=================================================');
  console.log('🎯 Testing Fathom.ai API Access');
  console.log('=================================================\n');

  try {
    // Step 0: Find working endpoint
    FATHOM_API_BASE = await findWorkingEndpoint();
    
    // Step 1: Fetch all calls
    const calls = await fetchCalls();
    
    if (!calls || calls.length === 0) {
      console.log('ℹ️  No calls found in your Fathom account.');
      console.log('   This might mean:');
      console.log('   - No recordings have been made yet');
      console.log('   - The API key doesn\'t have access to calls');
      console.log('   - You need to make a test recording first\n');
      return;
    }

    // Display call summary
    console.log('📋 Call Summary:');
    console.log('─────────────────────────────────────────────\n');
    
    calls.slice(0, 5).forEach((call, index) => {
      console.log(`${index + 1}. ${call.title || 'Untitled'}`);
      console.log(`   ID: ${call.id}`);
      console.log(`   Date: ${call.start_time ? new Date(call.start_time).toLocaleString() : 'N/A'}`);
      console.log(`   Duration: ${call.duration ? Math.round(call.duration / 60) : 0} minutes`);
      console.log(`   Participants: ${call.participants?.length || 0}\n`);
    });

    if (calls.length > 5) {
      console.log(`   ... and ${calls.length - 5} more calls\n`);
    }

    // Step 2: Fetch details for the first call
    if (calls[0]?.id) {
      console.log('\n=================================================');
      console.log('📖 Testing Detailed Call Retrieval');
      console.log('=================================================\n');
      
      const callDetails = await fetchCallDetails(calls[0].id);
      
      console.log('Call Details:');
      console.log('─────────────────────────────────────────────');
      console.log(JSON.stringify(callDetails, null, 2));
      console.log('\n');

      // Step 3: Fetch transcript for the first call
      console.log('\n=================================================');
      console.log('📝 Testing Transcript Retrieval');
      console.log('=================================================\n');
      
      try {
        const transcript = await fetchTranscript(calls[0].id);
        
        if (transcript) {
          console.log('✅ Transcript retrieved successfully!');
          console.log('─────────────────────────────────────────────');
          console.log(`Length: ${transcript.length} characters`);
          console.log('\nPreview (first 500 characters):');
          console.log(transcript.substring(0, 500));
          console.log('\n...\n');
        } else {
          console.log('⚠️  Transcript is empty or not available for this call');
        }
      } catch (transcriptError) {
        console.log('⚠️  Could not fetch transcript (may not be ready yet)');
        console.log('   Error:', transcriptError);
      }
    }

    console.log('\n=================================================');
    console.log('✅ Fathom API Test Complete!');
    console.log('=================================================\n');
    console.log('Summary:');
    console.log(`- Total calls found: ${calls.length}`);
    console.log('- API authentication: ✅ Working');
    console.log('- Call retrieval: ✅ Working');
    console.log('- Next steps: Integrate into platform\n');

  } catch (error) {
    console.error('\n=================================================');
    console.error('❌ Test Failed');
    console.error('=================================================\n');
    console.error('Error:', error);
    console.error('\nPossible issues:');
    console.error('1. Invalid API key');
    console.error('2. Network connectivity issues');
    console.error('3. API endpoint has changed');
    console.error('4. Insufficient permissions on the API key\n');
    process.exit(1);
  }
}

// Run the test
testFathomAPI().catch(console.error);

