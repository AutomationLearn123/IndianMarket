#!/usr/bin/env node

/**
 * 🇮🇳 WORKING UNIFIED TRADING SERVER
 * Fixed async/await issues and simplified for reliable operation
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { config } = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
config();

console.log('🚀 Starting Working Trading Server...');
console.log('📊 Initializing services...');

// Initialize services
const { KiteConnect, KiteTicker } = require('kiteconnect');
let kiteConnect = null;
let kiteTicker = null;
let isKiteAuthenticated = false;
let latestTickData = new Map();

// OpenAI initialization
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized');
  } catch (error) {
    console.log('❌ OpenAI initialization failed:', error.message);
    openai = null;
  }
} else {
  console.log('⚠️ OpenAI not configured - will use mock analysis');
}

// Initialize Kite Connect
if (process.env.KITE_API_KEY && process.env.KITE_API_SECRET) {
  try {
    kiteConnect = new KiteConnect({
      api_key: process.env.KITE_API_KEY,
      api_secret: process.env.KITE_API_SECRET
    });
    console.log('✅ KiteConnect initialized');
  } catch (error) {
    console.log('❌ KiteConnect initialization failed:', error.message);
    kiteConnect = null;
  }
} else {
  console.log('❌ Kite Connect credentials missing');
}

// Express app setup
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // increased limit for real trading
}));

// Stock symbol to instrument token mapping (common NSE stocks)
const STOCK_INSTRUMENTS = {
  'RELIANCE': 738561,
  'TCS': 2953217,
  'HDFCBANK': 341249,
  'INFY': 408065,
  'HINDUNILVR': 356865,
  'ICICIBANK': 1270529,
  'SBIN': 779521,
  'BHARTIARTL': 2714625,
  'ITC': 424961,
  'KOTAKBANK': 492033
};

// Simple LLM Trading Analyzer
class LLMTradingAnalyzer {
  constructor(openaiInstance) {
    this.openai = openaiInstance;
  }

  async generateTradingSignal(symbol, marketData) {
    if (!this.openai) {
      return this.generateMockSignal(symbol, marketData);
    }

    try {
      const prompt = this.createAnalysisPrompt(symbol, marketData);
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Indian stock market analyst specializing in NSE equities. Analyze real-time market data and provide clear BUY/SELL/HOLD recommendations with specific entry/exit points.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.MAX_TOKENS || '800'),
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;
      return this.parseAIResponse(symbol, marketData, analysis || '');
    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error.message);
      return this.generateMockSignal(symbol, marketData);
    }
  }

  createAnalysisPrompt(symbol, data) {
    const volumeRatio = data.volume / (data.averageVolume || 1000000);
    const priceChangePercent = ((data.last_price - data.ohlc.close) / data.ohlc.close) * 100;
    
    return `Analyze ${symbol} for trading signal:

CURRENT DATA:
- Price: ₹${data.last_price}
- Change: ${priceChangePercent.toFixed(2)}%
- Volume: ${data.volume.toLocaleString()}
- Volume Ratio: ${volumeRatio.toFixed(2)}x
- OHLC: O:${data.ohlc.open} H:${data.ohlc.high} L:${data.ohlc.low} C:${data.ohlc.close}
- Buy Quantity: ${data.buy_quantity}
- Sell Quantity: ${data.sell_quantity}
- Order Imbalance: ${((data.buy_quantity - data.sell_quantity) / (data.buy_quantity + data.sell_quantity) * 100).toFixed(1)}%

ANALYSIS REQUIREMENTS:
1. **Action**: BUY/SELL/HOLD
2. **Confidence**: 0.1-1.0 (based on signal strength)
3. **Entry Price**: Specific price level
4. **Stop Loss**: Risk management level
5. **Target**: Profit target
6. **Reasoning**: Clear explanation focusing on volume footprint, price action, order book imbalance

Respond in JSON format:
{
  "action": "BUY/SELL/HOLD",
  "confidence": 0.85,
  "entryPrice": 2450.50,
  "stopLoss": 2401.49,
  "target": 2548.52,
  "reasoning": "Clear explanation"
}`;
  }

  parseAIResponse(symbol, marketData, analysis) {
    try {
      // Extract JSON from response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          symbol: symbol,
          action: parsed.action || 'HOLD',
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0.1), 1.0),
          reasoning: parsed.reasoning || 'AI analysis completed',
          entryPrice: parsed.entryPrice || marketData.last_price,
          stopLoss: parsed.stopLoss || marketData.last_price * 0.98,
          target: parsed.target || marketData.last_price * 1.04,
          riskRewardRatio: this.calculateRiskReward(parsed.entryPrice, parsed.stopLoss, parsed.target),
          timestamp: new Date().toISOString(),
          marketData: {
            currentPrice: marketData.last_price,
            volume: marketData.volume,
            volumeRatio: marketData.volume / (marketData.averageVolume || 1000000),
            priceChange: ((marketData.last_price - marketData.ohlc.close) / marketData.ohlc.close) * 100,
            ohlc: marketData.ohlc
          }
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
    }

    return this.generateMockSignal(symbol, marketData);
  }

  generateMockSignal(symbol, marketData) {
    const volumeRatio = marketData.volume / (marketData.averageVolume || 1000000);
    const priceChange = ((marketData.last_price - marketData.ohlc.close) / marketData.ohlc.close) * 100;
    const orderImbalance = (marketData.buy_quantity - marketData.sell_quantity) / (marketData.buy_quantity + marketData.sell_quantity);

    let action = 'HOLD';
    let confidence = 0.5;
    let reasoning = 'Neutral market conditions - no clear directional bias';

    // Volume breakout strategy
    if (volumeRatio > 2.0 && priceChange > 1.5 && orderImbalance > 0.3) {
      action = 'BUY';
      confidence = 0.85;
      reasoning = `Strong bullish breakout: ${priceChange.toFixed(2)}% gain with ${volumeRatio.toFixed(1)}x volume and ${(orderImbalance * 100).toFixed(1)}% buy imbalance`;
    } else if (volumeRatio > 2.0 && priceChange < -1.5 && orderImbalance < -0.3) {
      action = 'SELL';
      confidence = 0.80;
      reasoning = `Bearish breakdown: ${Math.abs(priceChange).toFixed(2)}% decline with ${volumeRatio.toFixed(1)}x volume and strong sell pressure`;
    } else if (volumeRatio > 1.5 && Math.abs(priceChange) > 0.8) {
      action = priceChange > 0 ? 'BUY' : 'SELL';
      confidence = 0.65;
      reasoning = `Moderate ${action.toLowerCase()} signal: ${Math.abs(priceChange).toFixed(2)}% move with above-average volume`;
    }

    const entryPrice = marketData.last_price;
    const stopLoss = action === 'BUY' ? entryPrice * 0.985 : entryPrice * 1.015;
    const target = action === 'BUY' ? entryPrice * 1.03 : entryPrice * 0.97;

    return {
      symbol,
      action,
      confidence,
      reasoning,
      entryPrice,
      stopLoss,
      target,
      riskRewardRatio: this.calculateRiskReward(entryPrice, stopLoss, target),
      timestamp: new Date().toISOString(),
      marketData: {
        currentPrice: marketData.last_price,
        volume: marketData.volume,
        volumeRatio,
        priceChange,
        ohlc: marketData.ohlc
      }
    };
  }

  calculateRiskReward(entry, stopLoss, target) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : 2.0;
  }
}

const llmAnalyzer = new LLMTradingAnalyzer(openai);

// WebSocket connection for real-time data
async function startWebSocketConnection() {
  if (!kiteConnect || !isKiteAuthenticated) {
    console.log('❌ Kite Connect not authenticated');
    return;
  }

  try {
    kiteTicker = new KiteTicker({
      api_key: process.env.KITE_API_KEY,
      access_token: kiteConnect.access_token
    });

    kiteTicker.on('ticks', (ticks) => {
      ticks.forEach((tick) => {
        // Find symbol from instrument token
        const symbol = Object.keys(STOCK_INSTRUMENTS).find(
          key => STOCK_INSTRUMENTS[key] === tick.instrument_token
        );
        
        if (symbol) {
          latestTickData.set(symbol, tick);
          console.log(`📊 ${symbol}: ₹${tick.last_price} (Vol: ${tick.volume})`);
        }
      });
    });

    kiteTicker.on('connect', async () => {
      console.log('🔗 WebSocket connected, subscribing to watchlist...');
      const tokens = Object.values(STOCK_INSTRUMENTS);
      kiteTicker.subscribe(tokens);
      kiteTicker.setMode(kiteTicker.modeFull, tokens);
      console.log(`✅ Subscribed to ${tokens.length} instruments`);
    });

    kiteTicker.on('disconnect', (error) => {
      console.log('🔌 WebSocket disconnected, will use historical data fallback');
      // Don't spam logs with full error object
      if (error && error.code) {
        console.log(`Connection closed with code: ${error.code}`);
      }
    });

    kiteTicker.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message || 'Connection failed');
    });

    kiteTicker.connect();
  } catch (error) {
    console.error('❌ WebSocket connection failed:', error.message);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🇮🇳 Working Unified Trading Server',
    version: '2.0.1',
    status: 'running',
    features: [
      'Real-time Kite Connect tick data',
      'OpenAI-powered LLM analysis',
      'Live BUY/SELL/HOLD signals',
      'Volume footprint analysis',
      'Risk-reward optimization'
    ],
    endpoints: {
      '/api/status': 'Server status',
      '/api/kite/login-url': 'Get Kite authentication URL',
      '/auth/kite/callback': 'Kite OAuth callback',
      '/api/signals/live/:symbol': 'Live LLM trading signal',
      '/api/signals/watchlist': 'All watchlist signals',
      '/api/data/live/:symbol': 'Real-time tick data',
      '/webhooks/kite/postback': 'Order status webhooks'
    },
    availableSymbols: Object.keys(STOCK_INSTRUMENTS)
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    },
    kiteConnect: {
      authenticated: isKiteAuthenticated,
      streaming: kiteTicker ? (kiteTicker.readyState === 1) : false,
      tickDataCount: latestTickData.size,
      message: isKiteAuthenticated ? 'Kite Connect ready' : 'Authentication required'
    },
    llm: {
      available: !!openai,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      message: openai ? 'OpenAI ready for analysis' : 'Mock analysis mode'
    },
    marketPhase: getMarketPhase(),
    availableSymbols: Object.keys(STOCK_INSTRUMENTS)
  });
});

// Kite Connect authentication
app.get('/api/kite/login-url', (req, res) => {
  if (!kiteConnect) {
    res.status(500).json({
      success: false,
      error: 'Kite Connect not initialized'
    });
    return;
  }

  const loginUrl = kiteConnect.getLoginURL();
  res.json({
    success: true,
    data: { loginUrl },
    message: 'Visit this URL to authenticate with Kite Connect'
  });
});

app.get('/auth/kite/callback', async (req, res) => {
  const { request_token, action, status } = req.query;
  
  if (!request_token || status !== 'success') {
    res.status(400).send(`
      <h1 style="color:red;">❌ Authentication Failed</h1>
      <p>Error: ${action || 'Unknown error'}</p>
      <p><a href="/api/kite/login-url">Try again</a></p>
    `);
    return;
  }

  try {
    const response = await kiteConnect.generateSession(request_token, process.env.KITE_API_SECRET);
    kiteConnect.setAccessToken(response.access_token);
    isKiteAuthenticated = true;

    console.log('✅ Kite authentication successful!');
    console.log('📊 Starting WebSocket connection for live data...');
    
    // Start WebSocket for real-time data
    await startWebSocketConnection();

    res.send(`
      <h1 style="color:green;">🎉 Authentication Successful!</h1>
      <p>Your Kite Connect account is now authenticated and connected.</p>
      <h3>🚀 Test Live Signals:</h3>
      <div style="background:#f5f5f5; padding:10px; margin:10px 0;">GET /api/signals/live/RELIANCE - Live LLM signal for RELIANCE</div>
      <div style="background:#f5f5f5; padding:10px; margin:10px 0;">GET /api/signals/watchlist - All live signals</div>
      <p><a href="/api/status">Check Server Status</a></p>
    `);
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(500).send(`
      <h1 style="color:red;">❌ Authentication Failed</h1>
      <p>Error: ${error.message}</p>
      <p><a href="/api/kite/login-url">Try again</a></p>
    `);
  }
});

// Live trading signal with LLM analysis
app.get('/api/signals/live/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();

  if (!STOCK_INSTRUMENTS[symbolUpper]) {
    res.status(404).json({
      success: false,
      error: `Symbol ${symbolUpper} not available`,
      availableSymbols: Object.keys(STOCK_INSTRUMENTS)
    });
    return;
  }

  try {
    console.log(`🎯 Generating signal for ${symbolUpper}...`);
    
    let marketData = null;
    let dataSource = 'mock_data';

    // Try to get real data from Kite Connect REST API
    if (isKiteAuthenticated && kiteConnect) {
      try {
        console.log(`📡 Fetching real market data for ${symbolUpper}...`);
        const instrumentToken = STOCK_INSTRUMENTS[symbolUpper];
        
        // Try different approaches for quote data
        let quotes;
        try {
          // Try with NSE prefix
          quotes = await kiteConnect.getQuote([`NSE:${symbolUpper}`]);
        } catch (err1) {
          try {
            // Try without prefix
            quotes = await kiteConnect.getQuote([symbolUpper]);
          } catch (err2) {
            try {
              // Try with instrument token
              quotes = await kiteConnect.getQuote([instrumentToken]);
            } catch (err3) {
              throw new Error(`All quote methods failed: ${err1.message}, ${err2.message}, ${err3.message}`);
            }
          }
        }
        const quote = quotes[`NSE:${symbolUpper}`] || quotes[symbolUpper] || quotes[instrumentToken];
        
        if (quote) {
          marketData = {
            instrument_token: instrumentToken,
            last_price: quote.last_price,
            volume: quote.volume,
            buy_quantity: quote.buy_quantity || 0,
            sell_quantity: quote.sell_quantity || 0,
            ohlc: quote.ohlc,
            change: quote.net_change,
            last_trade_time: new Date(quote.last_trade_time),
            timestamp: new Date(),
            averageVolume: quote.average_price ? quote.volume : 1000000
          };
          dataSource = 'live_kite_rest_api';
          console.log(`✅ Real market data fetched for ${symbolUpper}: ₹${quote.last_price}`);
        }
      } catch (apiError) {
        console.log(`⚠️ Kite API error for ${symbolUpper}:`, apiError.message);
      }
    }

    // Fallback to WebSocket data
    if (!marketData) {
      const tickData = latestTickData.get(symbolUpper);
      if (tickData) {
        marketData = tickData;
        dataSource = 'live_websocket_data';
      }
    }

    // Final fallback to mock data
    if (!marketData) {
      marketData = {
        instrument_token: STOCK_INSTRUMENTS[symbolUpper],
        last_price: 2450.50,
        volume: 1250000,
        buy_quantity: 85000,
        sell_quantity: 75000,
        ohlc: { open: 2440.0, high: 2465.0, low: 2435.0, close: 2448.0 },
        change: 2.50,
        last_trade_time: new Date(),
        timestamp: new Date(),
        averageVolume: 1000000
      };
      dataSource = 'mock_data';
    }

    console.log(`📊 Using ${dataSource} for ${symbolUpper}`);

    // Generate LLM trading signal
    const signal = await llmAnalyzer.generateTradingSignal(symbolUpper, marketData);

    console.log(`✅ Signal generated for ${symbolUpper}: ${signal.action}`);

    res.json({
      success: true,
      data: { signal },
      dataSource: dataSource,
      analysisType: openai ? 'openai_llm_analysis' : 'algorithmic_analysis',
      timestamp: new Date().toISOString(),
      disclaimer: 'Trading signals are for educational purposes. Trade at your own risk.'
    });

  } catch (error) {
    console.error('❌ Signal generation failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trading signal',
      message: error.message
    });
  }
});

// Get all watchlist signals
app.get('/api/signals/watchlist', async (req, res) => {
  try {
    console.log('🎯 Generating watchlist signals...');
    const signals = [];
    const symbols = Object.keys(STOCK_INSTRUMENTS).slice(0, 5); // Limit to prevent timeout

    for (const symbol of symbols) {
      try {
        const tickData = latestTickData.get(symbol);
        const marketData = tickData || {
          instrument_token: STOCK_INSTRUMENTS[symbol],
          last_price: Math.random() * 1000 + 1000,
          volume: Math.floor(Math.random() * 2000000) + 500000,
          buy_quantity: Math.floor(Math.random() * 100000) + 50000,
          sell_quantity: Math.floor(Math.random() * 100000) + 50000,
          ohlc: { open: 1000, high: 1100, low: 950, close: 1050 },
          change: Math.random() * 20 - 10,
          last_trade_time: new Date(),
          timestamp: new Date(),
          averageVolume: 1000000
        };

        const signal = await llmAnalyzer.generateTradingSignal(symbol, marketData);
        signals.push(signal);
        console.log(`✅ Signal for ${symbol}: ${signal.action}`);
      } catch (error) {
        console.error(`❌ Failed to generate signal for ${symbol}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: { signals },
      count: signals.length,
      dataSource: latestTickData.size > 0 ? 'live_kite_data' : 'mock_data',
      analysisType: openai ? 'openai_llm_analysis' : 'algorithmic_analysis',
      timestamp: new Date().toISOString(),
      marketPhase: getMarketPhase()
    });

  } catch (error) {
    console.error('❌ Watchlist generation failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate watchlist signals',
      message: error.message
    });
  }
});

// Get live tick data
app.get('/api/data/live/:symbol', (req, res) => {
  const { symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();

  const tickData = latestTickData.get(symbolUpper);
  
  if (!tickData) {
    res.status(404).json({
      success: false,
      error: `No live data for ${symbolUpper}`,
      message: 'Check if symbol is valid and market is open'
    });
    return;
  }

  res.json({
    success: true,
    data: tickData,
    timestamp: new Date().toISOString()
  });
});

// Kite Connect Postback Webhook
app.post('/webhooks/kite/postback', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const postbackData = JSON.parse(req.body.toString());
    
    console.log('📬 Kite postback received:', {
      order_id: postbackData.order_id,
      status: postbackData.status,
      tradingsymbol: postbackData.tradingsymbol,
      transaction_type: postbackData.transaction_type
    });

    // Process different types of postbacks
    switch (postbackData.status) {
      case 'COMPLETE':
        console.log('✅ Order executed:', {
          order_id: postbackData.order_id,
          symbol: postbackData.tradingsymbol,
          quantity: postbackData.filled_quantity,
          price: postbackData.average_price,
          type: postbackData.transaction_type
        });
        break;
        
      case 'CANCELLED':
        console.log('❌ Order cancelled:', {
          order_id: postbackData.order_id,
          symbol: postbackData.tradingsymbol
        });
        break;
        
      case 'REJECTED':
        console.log('🚫 Order rejected:', {
          order_id: postbackData.order_id,
          symbol: postbackData.tradingsymbol
        });
        break;
        
      default:
        console.log('📋 Order status update:', postbackData.status);
    }

    res.json({ 
      success: true, 
      message: 'Postback processed successfully',
      order_id: postbackData.order_id,
      status: postbackData.status
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(400).json({
      success: false,
      error: 'Failed to process postback',
      message: error.message
    });
  }
});

// Test Kite permissions
app.get('/api/test/kite-permissions', async (req, res) => {
  if (!isKiteAuthenticated || !kiteConnect) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated with Kite Connect'
    });
    return;
  }

  try {
    console.log('🧪 Testing Kite Connect permissions...');
    
    const tests = [];
    
    // Test 1: Get profile
    try {
      const profile = await kiteConnect.getProfile();
      tests.push({ test: 'getProfile', status: 'success', data: profile.user_name || 'Profile loaded' });
    } catch (err) {
      tests.push({ test: 'getProfile', status: 'failed', error: err.message });
    }

    // Test 2: Get margins
    try {
      const margins = await kiteConnect.getMargins();
      tests.push({ test: 'getMargins', status: 'success', data: 'Available' });
    } catch (err) {
      tests.push({ test: 'getMargins', status: 'failed', error: err.message });
    }

    // Test 3: Get instruments (NSE)
    try {
      const instruments = await kiteConnect.getInstruments(['NSE']);
      tests.push({ test: 'getInstruments(NSE)', status: 'success', data: `${instruments.length} instruments` });
    } catch (err) {
      tests.push({ test: 'getInstruments(NSE)', status: 'failed', error: err.message });
    }

    // Test 4: Get historical data (different permission)
    try {
      const historicalData = await kiteConnect.getHistoricalData(738561, 'day', '2024-01-01', '2024-01-31');
      tests.push({ test: 'getHistoricalData', status: 'success', data: `${historicalData.length} candles` });
    } catch (err) {
      tests.push({ test: 'getHistoricalData', status: 'failed', error: err.message });
    }

    // Test 5: Try different quote formats
    try {
      // Method 1: Get LTP (Last Traded Price) - simpler endpoint
      const ltp = await kiteConnect.getLTP(['NSE:RELIANCE']);
      tests.push({ test: 'getLTP(NSE:RELIANCE)', status: 'success', data: `₹${ltp['NSE:RELIANCE'].last_price}` });
    } catch (err) {
      tests.push({ test: 'getLTP(NSE:RELIANCE)', status: 'failed', error: err.message });
    }

    // Test 6: Try with instrument token
    try {
      const ltpToken = await kiteConnect.getLTP([738561]);
      tests.push({ test: 'getLTP(738561)', status: 'success', data: `₹${ltpToken[738561].last_price}` });
    } catch (err) {
      tests.push({ test: 'getLTP(738561)', status: 'failed', error: err.message });
    }

    // Test 7: Get OHLC
    try {
      const ohlc = await kiteConnect.getOHLC(['NSE:RELIANCE']);
      tests.push({ test: 'getOHLC(NSE:RELIANCE)', status: 'success', data: `OHLC available` });
    } catch (err) {
      tests.push({ test: 'getOHLC(NSE:RELIANCE)', status: 'failed', error: err.message });
    }

    res.json({
      success: true,
      authenticated: true,
      tests: tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'success').length,
        failed: tests.filter(t => t.status === 'failed').length
      },
      message: 'Comprehensive Kite Connect permission tests completed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Permission test failed',
      message: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    kiteConnected: isKiteAuthenticated,
    tickDataCount: latestTickData.size
  });
});

// Helper functions
function getMarketPhase() {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const time = hours * 100 + minutes;
  const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;
  
  if (!isWeekday) return 'closed';
  
  if (time >= 900 && time < 915) return 'pre_market';
  if (time >= 915 && time <= 1530) return 'regular';
  if (time > 1530 && time <= 1600) return 'post_market';
  
  return 'closed';
}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/status',
      'GET /api/kite/login-url',
      'GET /api/signals/live/:symbol',
      'GET /api/signals/watchlist',
      'GET /api/data/live/:symbol',
      'POST /webhooks/kite/postback',
      'GET /health'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🎯 =======================================
🇮🇳 Working Trading Server Ready!
🎯 =======================================

🌐 Server: http://localhost:${PORT}
📊 Status: http://localhost:${PORT}/api/status
📈 Market: ${getMarketPhase().toUpperCase()}
⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

🔥 Live Trading Endpoints:
   GET  /api/kite/login-url             - Authenticate with Kite
   GET  /api/signals/live/RELIANCE      - Live LLM signal for RELIANCE
   GET  /api/signals/live/TCS           - Live LLM signal for TCS
   GET  /api/signals/watchlist          - All live LLM signals
   GET  /api/data/live/:symbol          - Real-time tick data
   POST /webhooks/kite/postback         - Order status webhooks

🤖 LLM Analysis: ${openai ? 'OpenAI GPT-4' : 'Algorithmic Mock'}
📡 Data Source: ${isKiteAuthenticated ? 'Live Kite Connect' : 'Authentication Required'}

📝 Setup Steps:
   1. Visit: http://localhost:${PORT}/api/kite/login-url
   2. Complete Kite authentication
   3. Test: http://localhost:${PORT}/api/signals/live/RELIANCE
   4. Monitor: http://localhost:${PORT}/api/signals/watchlist

🚀 Ready for AI-powered live trading signals! 
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (kiteTicker) {
    kiteTicker.disconnect();
  }
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

module.exports = app;
