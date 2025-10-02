/**
 * Simple Kite Connect Test - Based on Official Documentation
 */

import { KiteConnect } from 'kiteconnect';

const apiKey = process.env.KITE_API_KEY || 'your_kite_api_key_here';
const apiSecret = process.env.KITE_API_SECRET || 'your_kite_api_secret_here';

console.log('🚀 Starting Kite Connect Test...');

// Step 1: Initialize KiteConnect (from official docs)
const kc = new KiteConnect({ 
  api_key: apiKey,
  debug: true  // Enable debugging to see API calls
});

async function testKiteConnection() {
  try {
    console.log('📍 Step 1: Getting login URL...');
    const loginUrl = kc.getLoginURL();
    console.log('✅ Login URL:', loginUrl);
    
    // The user would visit this URL and get a request_token
    console.log('\n📝 Next steps:');
    console.log('1. Visit the login URL above');
    console.log('2. Complete authentication');
    console.log('3. Get the request_token from callback');
    console.log('4. Use that token to generate session\n');
    
    // For demo purposes, let's show what the session generation would look like
    console.log('📍 Session generation example (when you have request_token):');
    console.log(`
    // After getting request_token from callback:
    const session = await kc.generateSession(request_token, '${apiSecret}');
    kc.setAccessToken(session.access_token);
    
    // Then you can make API calls:
    const profile = await kc.getProfile();
    const quotes = await kc.getLTP(['NSE:RELIANCE', 'NSE:TCS']);
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Function to test API calls (requires valid session)
async function testApiCalls() {
  try {
    console.log('📍 Testing API calls (requires authentication)...');
    
    // This will fail without authentication, but shows the API structure
    const instruments = await kc.getInstruments('NSE');
    console.log('✅ NSE Instruments count:', instruments.length);
    
  } catch (error) {
    console.log('❌ Expected error (no authentication):', (error as Error).message);
  }
}

// Run the test
testKiteConnection();
testApiCalls();

export { kc };
