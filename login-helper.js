#!/usr/bin/env node

/**
 * MANUAL LOGIN HELPER WITH SESSION STORAGE
 * Simplifies the daily login process
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.KITE_API_KEY;
const apiSecret = process.env.KITE_API_SECRET;

const SESSION_FILE = path.join(__dirname, '.kite-session.json');

async function loginHelper() {
  console.log('🔐 Kite Connect Login Helper');
  console.log('═══════════════════════════════');
  
  // Check for existing session
  if (fs.existsSync(SESSION_FILE)) {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    const today = new Date().toDateString();
    
    if (session.date === today && session.access_token) {
      console.log('✅ Found today\'s session');
      console.log('🔑 Access token:', session.access_token);
      
      // Update .env file
      updateEnvToken(session.access_token);
      console.log('✅ Token updated in .env file');
      console.log('🚀 Ready to run analysis!');
      return;
    } else {
      console.log('⏰ Session expired, need fresh login');
    }
  }
  
  // Generate new login
  const kc = new KiteConnect({ api_key: apiKey });
  const loginUrl = kc.getLoginURL();
  
  console.log('\n🌐 Login URL:');
  console.log(loginUrl);
  console.log('\n📋 Quick Steps:');
  console.log('1. Click the URL above');
  console.log('2. Login to Zerodha');
  console.log('3. Copy the request_token from redirect URL');
  console.log('4. Run: node login-helper.js <request_token>');
  
  // Handle request token if provided
  const requestToken = process.argv[2];
  if (requestToken) {
    try {
      console.log('\n🔄 Processing request token...');
      const response = await kc.generateSession(requestToken, apiSecret);
      
      // Save session
      const sessionData = {
        date: new Date().toDateString(),
        access_token: response.access_token,
        user_name: response.user_name,
        user_id: response.user_id
      };
      
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
      
      // Update .env
      updateEnvToken(response.access_token);
      
      console.log('✅ Login successful!');
      console.log('👤 User:', response.user_name);
      console.log('🔑 Token saved for today');
      console.log('🚀 Ready to run analysis!');
      
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('💡 Make sure request token is fresh');
    }
  }
}

function updateEnvToken(accessToken) {
  let envContent = fs.readFileSync('.env', 'utf8');
  
  if (envContent.includes('KITE_ACCESS_TOKEN=')) {
    envContent = envContent.replace(/KITE_ACCESS_TOKEN=.*/, `KITE_ACCESS_TOKEN=${accessToken}`);
  } else {
    envContent += `\nKITE_ACCESS_TOKEN=${accessToken}`;
  }
  
  fs.writeFileSync('.env', envContent);
}

loginHelper();