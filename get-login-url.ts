/**
 * Get Kite Connect Login URL
 */

import { config } from 'dotenv';
config(); // Load .env file

import { KiteConnect } from 'kiteconnect';

const apiKey = process.env.KITE_API_KEY;

if (!apiKey || apiKey === 'your_kite_api_key_here') {
  console.log('❌ Please set your KITE_API_KEY in .env file');
  process.exit(1);
}

const kc = new KiteConnect({ api_key: apiKey });

console.log('🔗 Your Kite Connect Login URL:');
console.log(kc.getLoginURL());
console.log('');
console.log('📋 Copy this URL and paste it in your browser to authenticate');
