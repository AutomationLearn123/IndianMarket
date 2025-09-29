// Simple test server to debug the issue
console.log('Starting debug server...');

try {
  const express = require('express');
  console.log('Express loaded');
  
  const app = express();
  console.log('Express app created');
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });
  
  console.log('Route added');
  
  const server = app.listen(3001, () => {
    console.log('Debug server listening on port 3001');
  });
  
} catch (error) {
  console.error('Error starting debug server:', error);
}
