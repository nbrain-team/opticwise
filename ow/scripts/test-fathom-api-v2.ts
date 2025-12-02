/**
 * Test script to verify Fathom.ai API access and fetch transcripts
 * Based on Fathom API documentation
 * Run with: npx tsx scripts/test-fathom-api-v2.ts
 */

const FATHOM_API_KEY = 'P-7I-RQkIVapQivlY4V4Q.pCnEO1zRbVl0HPw4PlWKtMYi01jeV7sNKBvEcj7cpUM';

// Based on Fathom documentation, the base URL should be:
const FATHOM_API_BASE = 'https://api.us.fathom.video';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Test a specific endpoint
 */
async function testEndpoint(
  path: string,
  method: string = 'GET',
  body?: any
): Promise<TestResult> {
  const url = `${FATHOM_API_BASE}${path}`;
  
  try {
    console.log(`\n🧪 Testing: ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const status = response.status;
    
    console.log(`   Status: ${status} ${response.statusText}`);
    
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`   Response type: JSON`);
      
      if (status === 200) {
        console.log(`   ✅ Success!`);
        console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`   ⚠️  Error response:`, data);
      }
    } else {
      const text = await response.text();
      console.log(`   Response type: ${contentType || 'text'}`);
      console.log(`   Response preview: ${text.substring(0, 200)}`);
      data = text;
    }

    return {
      endpoint: url,
      method,
      status,
      success: status >= 200 && status < 300,
      data,
    };
  } catch (error) {
    console.log(`   ❌ Request failed:`, error instanceof Error ? error.message : error);
    return {
      endpoint: url,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('=================================================');
  console.log('🎯 Fathom.ai API Comprehensive Test');
  console.log('=================================================');
  console.log(`API Key: ${FATHOM_API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${FATHOM_API_BASE}\n`);

  const results: TestResult[] = [];

  // Test different possible endpoints based on common API patterns
  const endpointsToTest = [
    // Calls endpoints
    { path: '/v1/calls', method: 'GET', description: 'List all calls' },
    { path: '/api/calls', method: 'GET', description: 'List all calls (alt)' },
    { path: '/calls', method: 'GET', description: 'List all calls (simple)' },
    
    // User/Account endpoints
    { path: '/v1/user', method: 'GET', description: 'Get user info' },
    { path: '/api/user', method: 'GET', description: 'Get user info (alt)' },
    { path: '/v1/me', method: 'GET', description: 'Get current user' },
    
    // Recordings/Meetings endpoints
    { path: '/v1/recordings', method: 'GET', description: 'List recordings' },
    { path: '/api/recordings', method: 'GET', description: 'List recordings (alt)' },
    { path: '/v1/meetings', method: 'GET', description: 'List meetings' },
  ];

  console.log('📋 Testing Endpoints:');
  console.log('─────────────────────────────────────────────');

  for (const { path, method, description } of endpointsToTest) {
    console.log(`\n${description}`);
    const result = await testEndpoint(path, method);
    results.push(result);
    
    // If we find a successful endpoint, try to get more details
    if (result.success && result.data) {
      console.log('\n   📊 Sample data structure:');
      console.log('   ' + JSON.stringify(result.data, null, 2).split('\n').slice(0, 20).join('\n   '));
      
      // If this is a list of items, try to fetch details of the first item
      if (Array.isArray(result.data)) {
        console.log(`\n   Found ${result.data.length} items in the list`);
        
        if (result.data.length > 0 && result.data[0].id) {
          console.log(`\n   🔍 Fetching details for first item...`);
          const itemId = result.data[0].id;
          const detailPath = `${path}/${itemId}`;
          const detailResult = await testEndpoint(detailPath, 'GET');
          
          if (detailResult.success) {
            console.log('\n   📊 Detail data structure:');
            console.log('   ' + JSON.stringify(detailResult.data, null, 2).split('\n').slice(0, 30).join('\n   '));
            
            // Try to fetch transcript
            const transcriptPath = `${path}/${itemId}/transcript`;
            console.log(`\n   📝 Trying to fetch transcript...`);
            const transcriptResult = await testEndpoint(transcriptPath, 'GET');
            
            if (transcriptResult.success) {
              console.log('\n   ✅ TRANSCRIPT FOUND!');
              console.log('   ' + JSON.stringify(transcriptResult.data, null, 2).split('\n').slice(0, 20).join('\n   '));
            }
          }
        }
      } else if (result.data && typeof result.data === 'object') {
        // Single object response
        const keys = Object.keys(result.data);
        console.log(`\n   Object has ${keys.length} properties`);
      }
      
      break; // Found working endpoint, no need to test others
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n=================================================');
  console.log('📊 Test Summary');
  console.log('=================================================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('✅ Working Endpoints:');
    successful.forEach(r => {
      console.log(`   - ${r.method} ${r.endpoint} (${r.status})`);
    });
  }

  if (successful.length === 0) {
    console.log('\n⚠️  No working endpoints found!\n');
    console.log('Possible issues:');
    console.log('1. API key may be invalid or expired');
    console.log('2. API base URL might be different (try: api.fathom.video, api.eu.fathom.video)');
    console.log('3. API might require different authentication method');
    console.log('4. Account might not have API access enabled\n');
    console.log('💡 Suggestions:');
    console.log('- Check Fathom dashboard for API documentation');
    console.log('- Verify API key in account settings');
    console.log('- Check if there\'s a different API region (US/EU)');
    console.log('- Contact Fathom support for API access details\n');
  } else {
    console.log('\n✅ Success! The Fathom API is accessible.');
    console.log('Next steps:');
    console.log('1. Integrate the working endpoints into the platform');
    console.log('2. Create API routes to fetch and store transcripts');
    console.log('3. Set up webhook handler for real-time updates\n');
  }
}

// Run the test
main().catch(console.error);



