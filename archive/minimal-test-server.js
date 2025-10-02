const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.post('/api/analyze-manual-stocks', (req, res) => {
  console.log('📊 Received request:', req.body);
  res.json({
    success: true,
    message: 'Manual analysis endpoint working!',
    receivedData: req.body
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  
  // Keep the server alive
  setInterval(() => {
    console.log('📡 Server heartbeat...');
  }, 5000);
});