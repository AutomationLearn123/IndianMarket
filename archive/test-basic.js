// Very basic HTTP test
const http = require('http');

console.log('Testing connection to localhost:3001...');

const req = http.get('http://localhost:3001/', (res) => {
  console.log('✅ Server is responding!');
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    
    // Now test the POST endpoint
    testPostEndpoint();
  });
});

req.on('error', (error) => {
  console.log('❌ Server not responding:', error.message);
  process.exit(1);
});

function testPostEndpoint() {
  const postData = JSON.stringify({ symbols: ['RELIANCE'] });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze-manual-stocks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('\n🎯 POST Request Status:', res.statusCode);
    
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
      console.log('✅ Analysis Response:');
      console.log(responseData);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.log('❌ POST request failed:', error.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}