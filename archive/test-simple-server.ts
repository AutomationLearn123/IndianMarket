// Simple test to check if TypeScript is working
console.log('=== SIMPLE TEST SERVER ===');

import express from 'express';

const app = express();
const PORT = 3001;

app.get('/test', (_req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

console.log('Test server setup complete');
