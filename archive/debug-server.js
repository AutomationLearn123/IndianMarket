/**
 * DEBUG: Simple test to find the crash issue
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.post('/api/analyze-manual-stocks', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Request received');
    console.log('📋 Body:', req.body);
    
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'symbols array is required' });
    }
    
    console.log('✅ DEBUG: Symbols validated:', symbols);
    
    // Try importing the services one by one to find the issue
    console.log('🔍 DEBUG: Testing imports...');
    
    try {
      const { EnhancedManualStockAnalyzer } = require('./src/services/EnhancedManualStockAnalyzer');
      console.log('✅ DEBUG: EnhancedManualStockAnalyzer imported successfully');
    } catch (error) {
      console.error('❌ DEBUG: EnhancedManualStockAnalyzer import failed:', error.message);
      return res.status(500).json({ error: 'EnhancedManualStockAnalyzer import failed', details: error.message });
    }
    
    try {
      const { Every5MinuteCandleAnalyzer } = require('./src/services/Every5MinuteCandleAnalyzer');
      console.log('✅ DEBUG: Every5MinuteCandleAnalyzer imported successfully');
    } catch (error) {
      console.error('❌ DEBUG: Every5MinuteCandleAnalyzer import failed:', error.message);
      return res.status(500).json({ error: 'Every5MinuteCandleAnalyzer import failed', details: error.message });
    }
    
    // Simple response for now
    const result = {
      message: 'DEBUG: Basic endpoint working',
      symbols: symbols,
      timestamp: new Date().toISOString(),
      note: 'This is a debug version - full analysis disabled to prevent crashes'
    };
    
    console.log('✅ DEBUG: Sending response');
    res.json(result);
    
  } catch (error) {
    console.error('❌ DEBUG: Endpoint error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'DEBUG server running', time: new Date().toISOString() });
});

const PORT = 3002; // Different port to avoid conflicts

app.listen(PORT, () => {
  console.log('🔍 DEBUG SERVER RUNNING on port', PORT);
  console.log('📊 Test endpoint: POST http://localhost:3002/api/analyze-manual-stocks');
  console.log('✅ Status check: GET http://localhost:3002/api/status');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});