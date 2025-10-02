/**
 * TEST MANUAL ANALYSIS WITHOUT AUTHENTICATION
 * Create a simple endpoint that doesn't require Kite authentication
 */

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Mock Enhanced Manual Analyzer
class MockEnhancedManualAnalyzer {
  constructor() {
    this.name = 'MockEnhancedManualAnalyzer';
  }

  async analyzeSelectedStocks(symbols) {
    console.log(`🎯 Mock analyzing: ${symbols.join(', ')}`);
    
    const results = {
      summary: {
        totalSymbols: symbols.length,
        buySignals: 0,
        sellSignals: 0,
        noGoodSignals: 0,
        analysisMethod: 'MOCK_ENHANCED_EVERY_5MIN'
      },
      stocks: [],
      timestamp: new Date().toISOString()
    };

    for (const symbol of symbols) {
      // Simulate every 5-minute candle analysis
      const mockPrice = 1000 + Math.random() * 500;
      const mockVolume = 10000 + Math.random() * 50000;
      const hasBreakout = Math.random() > 0.6;
      const has400Volume = Math.random() > 0.7;
      const hasStackedImbalance = Math.random() > 0.5;
      
      let signal = 'NO GOOD';
      let confidence = 50;
      
      if (hasBreakout && has400Volume && hasStackedImbalance) {
        signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
        confidence = 85 + Math.random() * 10;
        if (signal === 'BUY') results.summary.buySignals++;
        else results.summary.sellSignals++;
      } else {
        results.summary.noGoodSignals++;
      }

      const stockAnalysis = {
        symbol,
        signal,
        confidence: Math.round(confidence),
        currentPrice: Math.round(mockPrice * 100) / 100,
        volume: Math.round(mockVolume),
        every5MinAnalysis: {
          breakoutDetected: hasBreakout,
          volume400Spike: has400Volume,
          stackedImbalances: hasStackedImbalance ? 2 : 0,
          candlesAnalyzed: Math.floor(Math.random() * 5) + 3,
          strongestCandle: {
            time: '10:' + (Math.floor(Math.random() * 50) + 10),
            breakout: hasBreakout,
            volumeSpike: has400Volume ? '420%' : '180%',
            imbalances: hasStackedImbalance ? ['BUY_HEAVY', 'BUY_MODERATE'] : ['BALANCED']
          }
        },
        reasoning: `Mock analysis: ${hasBreakout ? 'Breakout detected' : 'No clear breakout'}, ${has400Volume ? '400%+ volume spike' : 'Normal volume'}, ${hasStackedImbalance ? 'Stacked imbalances found' : 'No significant imbalances'}`
      };

      results.stocks.push(stockAnalysis);
    }

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return results;
  }
}

// Manual analysis endpoint
app.post('/api/analyze-manual-stocks', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of stock symbols',
        example: { symbols: ['RELIANCE', 'TCS', 'HDFCBANK'] }
      });
    }

    console.log(`🎯 MOCK MANUAL ANALYSIS REQUEST: ${symbols.join(', ')}`);
    
    const mockAnalyzer = new MockEnhancedManualAnalyzer();
    const results = await mockAnalyzer.analyzeSelectedStocks(symbols);
    
    console.log(`✅ MOCK ANALYSIS COMPLETE: ${results.summary.buySignals} BUY, ${results.summary.sellSignals} SELL`);
    
    res.json({
      success: true,
      results,
      analysisTime: new Date().toISOString(),
      mode: 'MOCK_TESTING'
    });

  } catch (error) {
    console.error('❌ Mock analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Mock Manual Analysis Server',
    status: 'running',
    mode: 'TESTING_WITHOUT_AUTHENTICATION'
  });
});

const PORT = 3001;

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Manual Analysis Server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: POST /api/analyze-manual-stocks`);
  console.log(`🎯 No authentication required for testing`);
  console.log(`🔄 Server process ID: ${process.pid}`);
});