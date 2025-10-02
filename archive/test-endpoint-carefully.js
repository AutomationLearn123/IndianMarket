const http = require('http');

// Test data
const testData = JSON.stringify({
  symbols: ["RELIANCE"]
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analyze-manual-stocks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  },
  timeout: 10000
};

console.log('🧪 Testing Manual Analysis Endpoint');
console.log('📊 Request: POST /api/analyze-manual-stocks');
console.log('🎯 Symbol: RELIANCE');

const req = http.request(options, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response Body:');
    try {
      const parsed = JSON.parse(responseBody);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n🎉 SUCCESS: Manual analysis working!');
        console.log(`🔍 Analysis method: ${parsed.results.summary.analysisMethod}`);
        console.log(`📊 Signals: ${parsed.results.summary.buySignals} BUY, ${parsed.results.summary.sellSignals} SELL`);
      } else {
        console.log('\n❌ ERROR: Analysis failed');
        console.log(`❗ Error: ${parsed.error}`);
      }
    } catch (e) {
      console.log('Raw response:', responseBody);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log(`❌ Request Error: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('⏰ Request timeout');
  req.abort();
  process.exit(1);
});

req.write(testData);
req.end();