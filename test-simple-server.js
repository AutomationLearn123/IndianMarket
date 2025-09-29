#!/usr/bin/env node

const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server working!' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Try: http://localhost:3001/test');
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('Test server ready!');
