/**
 * Get Kite Connect Login URL
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');

const apiKey = process.env.KITE_API_KEY;

if (!apiKey || apiKey === 'your_kite_api_key_here') {
  console.log('❌ Please set your KITE_API_KEY in .env file');
  process.exit(1);
}

const kc = new KiteConnect({ api_key: apiKey });

console.log('🔗 Your Kite Connect Login URL:');
console.log(kc.getLoginURL());
console.log('\n📝 Steps:');
console.log('1. Click the URL above');
console.log('2. Login to Kite');
console.log('3. Copy the request_token from redirect URL');
console.log('4. Use it to get access token');