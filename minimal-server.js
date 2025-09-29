/**
 * Complete Kite Connect Server - Tick Data & Historical Data for LLM
 */

console.log('Starting Kite Connect Data Server...');

const express = require('express');
const { KiteConnect, KiteTicker } = require('kiteconnect');
require('dotenv').config();

const app = express();
app.use(express.json());

// Global state
let kiteConnect = null;
let kiteTicker = null;
let accessToken = null;
let isAuthenticated = false;
let tickData = new Map(); // Store latest tick data
let historicalDataCache = new Map(); // Cache historical data

// NSE Watchlist
const NSE_WATCHLIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ITC', 'ASIANPAINT',
  'AXISBANK', 'LT', 'MARUTI', 'SUNPHARMA', 'ULTRACEMCO'
];

// Initialize KiteConnect
const API_KEY = process.env.KITE_API_KEY;
const API_SECRET = process.env.KITE_API_SECRET;

if (!API_KEY || !API_SECRET) {
  console.error('❌ Missing KITE_API_KEY or KITE_API_SECRET in .env file');
  process.exit(1);
}

kiteConnect = new KiteConnect({ 
  api_key: API_KEY,
  debug: false
});

console.log('✅ KiteConnect initialized');

// Get login URL
app.get('/api/kite/login-url', (req, res) => {
  const loginUrl = kiteConnect.getLoginURL();
  res.json({
    success: true,
    data: { loginUrl },
    message: 'Visit this URL to authenticate with Kite Connect'
  });
});

// Handle authentication callback
app.get('/auth/kite/callback', async (req, res) => {
  try {
    const { request_token, action, status } = req.query;
    
    if (status === 'success' && request_token) {
      console.log('🔑 Generating session with request_token:', request_token);
      
      // Generate session
      const session = await kiteConnect.generateSession(request_token, API_SECRET);
      accessToken = session.access_token;
      kiteConnect.setAccessToken(accessToken);
      isAuthenticated = true;
      
      console.log('✅ Authentication successful!');
      console.log('📊 Starting WebSocket connection for live data...');
      
      // Start WebSocket for live data
      await startWebSocketConnection();
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Kite Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .success { color: #28a745; }
            .info { color: #17a2b8; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">🎉 Authentication Successful!</h1>
            <p>Your Kite Connect account is now authenticated and connected.</p>
            <div class="info">
              <h3>✅ What's now available:</h3>
              <ul style="text-align: left;">
                <li>📊 Real-time tick data streaming</li>
                <li>📈 Historical data access</li>
                <li>🤖 LLM-ready data pipeline</li>
                <li>💹 NSE stock monitoring</li>
              </ul>
            </div>
            <p><strong>Server Status:</strong> Connected and streaming data</p>
            <p><strong>Monitored Stocks:</strong> ${NSE_WATCHLIST.length} NSE symbols</p>
          </div>
        </body>
        </html>
      `);
      
    } else {
      throw new Error(`Authentication failed: ${status} - ${action}`);
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(400).send(`
      <html><body style="text-align:center; font-family:Arial;">
        <h1 style="color:red;">❌ Authentication Failed</h1>
        <p>Error: ${error.message}</p>
        <p><a href="/api/kite/login-url">Try again</a></p>
      </body></html>
    `);
  }
});
// Start WebSocket connection for real-time data
async function startWebSocketConnection() {
  try {
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    kiteTicker = new KiteTicker({
      api_key: API_KEY,
      access_token: accessToken
    });
    
    // Set up event handlers
    kiteTicker.on('ticks', (ticks) => {
      processTicks(ticks);
    });
    
    kiteTicker.on('connect', async () => {
      console.log('🔗 WebSocket connected, subscribing to watchlist...');
      
      // Get instrument tokens for watchlist
      try {
        const instruments = await kiteConnect.getInstruments('NSE');
        const tokens = [];
        
        NSE_WATCHLIST.forEach(symbol => {
          const instrument = instruments.find(inst => 
            inst.tradingsymbol === symbol && inst.instrument_type === 'EQ'
          );
          if (instrument) {
            tokens.push(instrument.instrument_token);
            console.log(`📈 ${symbol}: ${instrument.instrument_token}`);
          }
        });
        
        if (tokens.length > 0) {
          kiteTicker.subscribe(tokens);
          kiteTicker.setMode(kiteTicker.modeFull, tokens);
          console.log(`✅ Subscribed to ${tokens.length} instruments`);
        }
        
      } catch (error) {
        console.error('❌ Error subscribing to instruments:', error.message);
      }
    });
    
    kiteTicker.on('disconnect', (error) => {
      console.log('🔌 WebSocket disconnected:', error);
    });
    
    kiteTicker.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    // Connect to WebSocket
    kiteTicker.connect();
    
  } catch (error) {
    console.error('❌ WebSocket setup failed:', error.message);
  }
}

// Process incoming tick data
function processTicks(ticks) {
  ticks.forEach(tick => {
    tickData.set(tick.instrument_token, {
      ...tick,
      timestamp: new Date(),
      symbol: getSymbolFromToken(tick.instrument_token)
    });
  });
  
  console.log(`📊 Processed ${ticks.length} ticks`);
}

// Helper function to get symbol from instrument token (you'd populate this mapping)
function getSymbolFromToken(token) {
  // This would be populated from the instruments mapping
  return `TOKEN_${token}`;
}

// Get latest tick data
app.get('/api/data/ticks', (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  const latestTicks = Array.from(tickData.values());
  res.json({
    success: true,
    data: {
      ticks: latestTicks,
      count: latestTicks.length,
      timestamp: new Date().toISOString()
    }
  });
});

// Get historical data for a symbol
app.get('/api/data/historical/:symbol', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const { symbol } = req.params;
    const { interval = 'day', days = 30 } = req.query;
    
    const cacheKey = `${symbol}_${interval}_${days}`;
    
    // Check cache first
    if (historicalDataCache.has(cacheKey)) {
      const cached = historicalDataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }
    
    // Get instrument token for symbol
    const instruments = await kiteConnect.getInstruments('NSE');
    const instrument = instruments.find(inst => 
      inst.tradingsymbol === symbol.toUpperCase() && inst.instrument_type === 'EQ'
    );
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: `Symbol ${symbol} not found in NSE`
      });
    }
    
    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - parseInt(days));
    
    // Fetch historical data
    const historicalData = await kiteConnect.getHistoricalData(
      instrument.instrument_token,
      interval,
      fromDate,
      toDate
    );
    
    // Cache the result
    historicalDataCache.set(cacheKey, {
      data: historicalData,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        instrument_token: instrument.instrument_token,
        interval,
        days: parseInt(days),
        records: historicalData.length,
        data: historicalData
      }
    });
    
  } catch (error) {
    console.error('❌ Historical data error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get LLM trading signal for a symbol
app.get('/api/signals/generate/:symbol', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const { symbol } = req.params;
    
    // Get current market data
    const llmDataResponse = await fetch(`http://localhost:3001/api/data/llm-format/${symbol}`);
    const llmDataJson = await llmDataResponse.json();
    
    if (!llmDataJson.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get market data for ${symbol}`
      });
    }
    
    const marketData = llmDataJson.data;
    
    // Prepare data for LLM analysis
    const tradingSignalRequest = {
      symbol: symbol.toUpperCase(),
      currentPrice: marketData.currentTick?.price || 0,
      volume: marketData.currentTick?.volume || 0,
      historicalData: marketData.recentCandles || [],
      volumeFootprint: marketData.volumeAnalysis || {},
      marketContext: marketData.marketContext || {}
    };
    
    // Generate LLM analysis (mock for now since we need OpenAI setup)
    const mockSignal = {
      symbol: symbol.toUpperCase(),
      action: marketData.volumeAnalysis?.volumeRatio > 4 ? 'BUY' : 'HOLD',
      confidence: marketData.volumeAnalysis?.volumeRatio > 4 ? 0.8 : 0.3,
      reasoning: `Volume analysis shows ${marketData.volumeAnalysis?.volumeRatio?.toFixed(2)}x ratio. ${
        marketData.volumeAnalysis?.volumeRatio > 4 
          ? 'Strong volume breakout detected - potential bullish momentum.' 
          : 'Normal volume levels - wait for better setup.'
      }`,
      entryPrice: marketData.currentTick?.price || 0,
      stopLoss: (marketData.currentTick?.price || 0) * 0.98,
      target: (marketData.currentTick?.price || 0) * 1.04,
      riskRewardRatio: 2,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        signal: mockSignal,
        marketData: marketData,
        analysisType: 'volume_footprint_breakout'
      }
    });
    
  } catch (error) {
    console.error('❌ Signal generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get multiple signals for watchlist
app.get('/api/signals/watchlist', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const signals = [];
    
    // Generate signals for each watchlist symbol (limit to first 5 for demo)
    for (const symbol of NSE_WATCHLIST.slice(0, 5)) {
      try {
        const signalResponse = await fetch(`http://localhost:3001/api/signals/generate/${symbol}`);
        const signalJson = await signalResponse.json();
        
        if (signalJson.success) {
          signals.push(signalJson.data);
        }
      } catch (error) {
        console.error(`Failed to generate signal for ${symbol}:`, error.message);
      }
    }
    
    // Sort by confidence (highest first)
    signals.sort((a, b) => b.signal.confidence - a.signal.confidence);
    
    res.json({
      success: true,
      data: {
        signals,
        totalAnalyzed: signals.length,
        highConfidenceSignals: signals.filter(s => s.signal.confidence > 0.7).length,
        buySignals: signals.filter(s => s.signal.action === 'BUY').length,
        sellSignals: signals.filter(s => s.signal.action === 'SELL').length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Watchlist signals error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get LLM-formatted data for analysis
app.get('/api/data/llm-format/:symbol', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const { symbol } = req.params;
    
    // Get latest tick data
    const symbolTick = Array.from(tickData.values()).find(tick => 
      tick.symbol === symbol.toUpperCase()
    );
    
    // Get recent historical data (last 20 candles for context)
    const historicalResponse = await fetch(
      `http://localhost:3001/api/data/historical/${symbol}?interval=5minute&days=2`
    );
    const historicalJson = await historicalResponse.json();
    const historicalData = historicalJson.success ? historicalJson.data.data : [];
    
    // Format for LLM consumption
    const llmData = {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      currentTick: symbolTick ? {
        price: symbolTick.last_price,
        volume: symbolTick.volume,
        change: symbolTick.last_price - symbolTick.close,
        changePercent: ((symbolTick.last_price - symbolTick.close) / symbolTick.close * 100).toFixed(2)
      } : null,
      recentCandles: historicalData.slice(-20), // Last 20 candles
      volumeAnalysis: symbolTick ? {
        currentVolume: symbolTick.volume,
        avgVolume: historicalData.reduce((sum, candle) => sum + candle[5], 0) / historicalData.length,
        volumeRatio: symbolTick.volume / (historicalData.reduce((sum, candle) => sum + candle[5], 0) / historicalData.length)
      } : null,
      marketContext: {
        marketPhase: getCurrentMarketPhase(),
        tradingHours: isMarketOpen()
      }
    };
    
    res.json({
      success: true,
      data: llmData
    });
    
  } catch (error) {
    console.error('❌ LLM format error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get LLM trading signal for a symbol
app.get('/api/signals/generate/:symbol', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const { symbol } = req.params;
    
    // Get current market data
    const llmDataResponse = await fetch(`http://localhost:3001/api/data/llm-format/${symbol}`);
    const llmDataJson = await llmDataResponse.json();
    
    if (!llmDataJson.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get market data for ${symbol}`
      });
    }
    
    const marketData = llmDataJson.data;
    
    // Prepare data for LLM analysis
    const tradingSignalRequest = {
      symbol: symbol.toUpperCase(),
      currentPrice: marketData.currentTick?.price || 0,
      volume: marketData.currentTick?.volume || 0,
      historicalData: marketData.recentCandles || [],
      volumeFootprint: marketData.volumeAnalysis || {},
      marketContext: marketData.marketContext || {}
    };
    
    // Generate LLM analysis (mock for now since we need OpenAI setup)
    const mockSignal = {
      symbol: symbol.toUpperCase(),
      action: marketData.volumeAnalysis?.volumeRatio > 4 ? 'BUY' : 'HOLD',
      confidence: marketData.volumeAnalysis?.volumeRatio > 4 ? 0.8 : 0.3,
      reasoning: `Volume analysis shows ${marketData.volumeAnalysis?.volumeRatio?.toFixed(2)}x ratio. ${
        marketData.volumeAnalysis?.volumeRatio > 4 
          ? 'Strong volume breakout detected - potential bullish momentum.' 
          : 'Normal volume levels - wait for better setup.'
      }`,
      entryPrice: marketData.currentTick?.price || 0,
      stopLoss: (marketData.currentTick?.price || 0) * 0.98,
      target: (marketData.currentTick?.price || 0) * 1.04,
      riskRewardRatio: 2,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        signal: mockSignal,
        marketData: marketData,
        analysisType: 'volume_footprint_breakout'
      }
    });
    
  } catch (error) {
    console.error('❌ Signal generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get multiple signals for watchlist
app.get('/api/signals/watchlist', async (req, res) => {
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Please login first.'
    });
  }
  
  try {
    const signals = [];
    
    // Generate signals for each watchlist symbol (limit to first 5 for demo)
    for (const symbol of NSE_WATCHLIST.slice(0, 5)) {
      try {
        const signalResponse = await fetch(`http://localhost:3001/api/signals/generate/${symbol}`);
        const signalJson = await signalResponse.json();
        
        if (signalJson.success) {
          signals.push(signalJson.data);
        }
      } catch (error) {
        console.error(`Failed to generate signal for ${symbol}:`, error.message);
      }
    }
    
    // Sort by confidence (highest first)
    signals.sort((a, b) => b.signal.confidence - a.signal.confidence);
    
    res.json({
      success: true,
      data: {
        signals,
        totalAnalyzed: signals.length,
        highConfidenceSignals: signals.filter(s => s.signal.confidence > 0.7).length,
        buySignals: signals.filter(s => s.signal.action === 'BUY').length,
        sellSignals: signals.filter(s => s.signal.action === 'SELL').length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Watchlist signals error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getCurrentMarketPhase() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 100 + minutes;
  
  if (time >= 900 && time < 915) return 'pre_market';
  if (time >= 915 && time <= 1530) return 'regular';
  if (time > 1530 && time <= 1600) return 'post_market';
  return 'closed';
}

function isMarketOpen() {
  const phase = getCurrentMarketPhase();
  return phase === 'regular';
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      authenticated: isAuthenticated,
      tickDataCount: tickData.size,
      cacheCount: historicalDataCache.size,
      marketPhase: getCurrentMarketPhase(),
      timestamp: new Date().toISOString()
    }
  });
});

// Postback webhook
app.post('/webhooks/kite/postback', (req, res) => {
  console.log('� Postback received:', req.body);
  res.json({ success: true, message: 'Postback processed' });
});

const server = app.listen(3001, () => {
  console.log('🚀 Kite Connect Data Server running on http://localhost:3001');
  console.log('🔗 Available endpoints:');
  console.log('   GET  /health                         - Server status');
  console.log('   GET  /api/kite/login-url            - Get authentication URL');
  console.log('   GET  /auth/kite/callback            - Authentication callback');
  console.log('   GET  /api/data/ticks                - Latest tick data');
  console.log('   GET  /api/data/historical/:symbol   - Historical data');
  console.log('   GET  /api/data/llm-format/:symbol   - LLM-ready data format');
  console.log('   POST /webhooks/kite/postback        - Order updates');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Visit: http://localhost:3001/api/kite/login-url');
  console.log('   2. Complete authentication');
  console.log('   3. Start receiving live market data!');
});
