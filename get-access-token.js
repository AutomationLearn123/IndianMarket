#!/usr/bin/env node

/**
 * GET ACCESS TOKEN FROM REQUEST TOKEN
 * Usage: node get-access-token.js <request_token>
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');
const fs = require('fs');

const requestToken = process.argv[2];

if (!requestToken) {
  console.log('❌ Please provide request token');
  console.log('📝 Usage: node get-access-token.js <request_token>');
  console.log('\n📝 Steps:');
  console.log('1. First run: node get-login-url.js');
  console.log('2. Login and copy request_token from redirect URL');
  console.log('3. Run: node get-access-token.js <request_token>');
  process.exit(1);
}

const apiKey = process.env.KITE_API_KEY;
const apiSecret = process.env.KITE_API_SECRET;

if (!apiKey || !apiSecret) {
  console.log('❌ Please set KITE_API_KEY and KITE_API_SECRET in .env file');
  process.exit(1);
}

const kc = new KiteConnect({ api_key: apiKey });

async function getAccessToken() {
  try {
    console.log('🔄 Generating access token...');
    
    const response = await kc.generateSession(requestToken, apiSecret);
    
    console.log('✅ Success! Access token generated');
    console.log('📝 User:', response.user_name);
    console.log('🔑 Access Token:', response.access_token);
    
    // Update .env file
    let envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('KITE_ACCESS_TOKEN=')) {
      envContent = envContent.replace(/KITE_ACCESS_TOKEN=.*/, `KITE_ACCESS_TOKEN=${response.access_token}`);
    } else {
      envContent += `\nKITE_ACCESS_TOKEN=${response.access_token}`;
    }
    
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Access token saved to .env file');
    console.log('\n🚀 Now you can run: node analyze-real.js RELIANCE');
    
  } catch (error) {
    console.log('❌ Error generating access token:', error.message);
    console.log('💡 Make sure the request token is fresh (expires quickly)');
  }
}

getAccessToken();