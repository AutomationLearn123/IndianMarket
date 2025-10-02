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

console.log('🚀 Testing Manual Analysis...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    console.log('Response:', responseData);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.write(data);
req.end();