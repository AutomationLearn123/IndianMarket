/**
 * SIMPLE TEST FOR MANUAL ANALYSIS ENDPOINT
 * Using PowerShell-compatible request method
 */

// Using Node.js built-in modules for the request
const http = require('http');

const data = JSON.stringify({
  symbols: ["RELIANCE"]
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analyze-manual-stocks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🚀 Testing Manual Analysis Endpoint...');
console.log('📊 Testing with RELIANCE');
console.log('🎯 Sending POST request...');

const req = http.request(options, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('\n🎉 SUCCESS! Analysis completed:');
      console.log('='.repeat(60));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('\n📄 Raw Response:');
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

// Send the request
req.write(data);
req.end();

console.log('⏳ Waiting for response...');