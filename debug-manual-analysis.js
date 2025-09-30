/**
 * SIMPLIFIED MANUAL ANALYSIS SERVER FOR TESTING
 * This will help us debug what's happening
 */

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Basic status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    mode: 'simplified_testing',
    time: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simplified Manual Analysis Server',
    status: 'running'
  });
});

// Manual analysis endpoint - simplified
app.post('/api/analyze-manual-stocks', (req, res) => {
  console.log('📊 Received manual analysis request');
  console.log('📋 Request body:', req.body);
  
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      console.log('❌ Invalid symbols provided');
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of stock symbols',
        example: { symbols: ['RELIANCE'] }
      });
    }

    console.log(`🎯 Analyzing symbols: ${symbols.join(', ')}`);

    // Create mock analysis response
    const results = {
      summary: {
        totalSymbols: symbols.length,
        buySignals: 0,
        sellSignals: 0,
        noGoodSignals: 0,
        analysisMethod: 'SIMPLIFIED_MOCK_ANALYSIS'
      },
      stocks: [],
      timestamp: new Date().toISOString()
    };

    // Mock analysis for each symbol
    symbols.forEach(symbol => {
      const hasBreakout = Math.random() > 0.4;
      const has400Volume = Math.random() > 0.6;
      const hasStackedImbalance = Math.random() > 0.5;
      
      let signal = 'NO GOOD';
      if (hasBreakout && has400Volume && hasStackedImbalance) {
        signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
        if (signal === 'BUY') results.summary.buySignals++;
        else results.summary.sellSignals++;
      } else {
        results.summary.noGoodSignals++;
      }

      const stockResult = {
        symbol,
        signal,
        confidence: Math.round(70 + Math.random() * 25),
        currentPrice: symbol === 'RELIANCE' ? 1368.6 : 1000 + Math.random() * 500,
        every5MinAnalysis: {
          breakoutDetected: hasBreakout,
          volume400Spike: has400Volume,
          stackedImbalances: hasStackedImbalance ? 2 : 0,
          candlesAnalyzed: 4,
          strongestCandle: {
            time: '10:25',
            breakout: hasBreakout,
            volumeSpike: has400Volume ? '420%' : '180%',
            imbalances: hasStackedImbalance ? ['BUY_HEAVY', 'BUY_MODERATE'] : ['BALANCED']
          }
        },
        reasoning: `Mock analysis for ${symbol}: ${hasBreakout ? 'Breakout detected' : 'No breakout'}, ${has400Volume ? '400%+ volume' : 'Normal volume'}, ${hasStackedImbalance ? 'Stacked imbalances' : 'No imbalances'}`
      };

      results.stocks.push(stockResult);
    });

    console.log(`✅ Analysis complete: ${results.summary.buySignals} BUY, ${results.summary.sellSignals} SELL, ${results.summary.noGoodSignals} NO GOOD`);

    res.json({
      success: true,
      results,
      analysisTime: new Date().toISOString(),
      mode: 'SIMPLIFIED_MOCK'
    });

  } catch (error) {
    console.error('❌ Error in analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Simplified Manual Analysis Server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: POST /api/analyze-manual-stocks`);
  console.log(`🧪 Test with: curl -X POST http://localhost:${PORT}/api/analyze-manual-stocks -H "Content-Type: application/json" -d "{\\"symbols\\":[\\"RELIANCE\\"]}""`);
  
  // Keep server alive
  setInterval(() => {
    console.log(`📡 Server heartbeat - ${new Date().toLocaleTimeString()}`);
  }, 30000);
});