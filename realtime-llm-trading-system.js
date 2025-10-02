#!/usr/bin/env node

/**
 * 🚀 REAL-TIME LLM TRADING SYSTEM (STANDALONE)
 * Compare against existing consensus system
 * Independent implementation for A/B testing
 */

require('dotenv').config();
const { KiteConnect, KiteTicker } = require('kiteconnect');
const OpenAI = require('openai');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class RealTimeLLMTradingSystem extends EventEmitter {
  constructor() {
    super();
    
    this.kiteConnect = new KiteConnect({
      api_key: process.env.KITE_API_KEY,
      access_token: process.env.KITE_ACCESS_TOKEN
    });
    
    this.kiteTicker = new KiteTicker({
      api_key: process.env.KITE_API_KEY,
      access_token: process.env.KITE_ACCESS_TOKEN
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Complete NIFTY50 Watchlist
    this.nseWatchlist = [
      'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
      'BAJAJAUTO', 'BAJAJFINSV', 'BAJFINANCE', 'BHARTIARTL', 'BPCL',
      'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY',
      'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
      'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'INDUSINDBK',
      'INFY', 'IOC', 'ITC', 'JSWSTEEL', 'KOTAKBANK',
      'LT', 'M&M', 'MARUTI', 'NESTLEIND', 'NTPC',
      'ONGC', 'POWERGRID', 'RELIANCE', 'SBIN', 'SBILIFE',
      'SUNPHARMA', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TCS',
      'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO'
    ];
    
    // Market state tracking
    this.marketState = new Map();
    this.lastAnalysis = new Map();
    this.signalHistory = [];
    
    // 💾 Data persistence setup
    this.dataDir = path.join(__dirname, 'data');
    this.persistenceFile = path.join(this.dataDir, 'market-state.json');
    this.saveInterval = null;
    this.lastSaveLog = 0;
    
    // Ensure data directory exists
    this.ensureDataDirectory();
    
    // Trading parameters
    this.config = {
      volumeSpikeThreshold: 4.0,    // 400%+ volume spike
      orderImbalanceThreshold: 15.0, // 15%+ order imbalance
      priceChangeThreshold: 1.5,    // 1.5%+ price movement
      minAnalysisInterval: 120000,  // 2 minutes between analyses per stock
      confidenceThreshold: 70       // Minimum confidence for signals
    };
    
    // Comprehensive NIFTY50 Instrument tokens (NSE)
    this.instrumentTokens = {
      'ADANIENT': 3861249,     // Adani Enterprises
      'ADANIPORTS': 3675649,   // Adani Ports
      'APOLLOHOSP': 157441,    // Apollo Hospitals
      'ASIANPAINT': 60417,     // Asian Paints
      'AXISBANK': 1510401,     // Axis Bank
      'BAJAJAUTO': 4267265,    // Bajaj Auto
      'BAJAJFINSV': 81153,     // Bajaj Finserv
      'BAJFINANCE': 81154,     // Bajaj Finance
      'BHARTIARTL': 2714625,   // Bharti Airtel
      'BPCL': 134657,          // BPCL
      'BRITANNIA': 140033,     // Britannia
      'CIPLA': 177665,         // Cipla
      'COALINDIA': 5215745,    // Coal India
      'DIVISLAB': 2800641,     // Divi's Labs
      'DRREDDY': 225537,       // Dr Reddy's
      'EICHERMOT': 232961,     // Eicher Motors
      'GRASIM': 315393,        // Grasim Industries
      'HCLTECH': 1850625,      // HCL Tech
      'HDFCBANK': 341249,      // HDFC Bank
      'HDFCLIFE': 119553,      // HDFC Life
      'HEROMOTOCO': 345089,    // Hero MotoCorp
      'HINDALCO': 348929,      // Hindalco
      'HINDUNILVR': 356865,    // Hindustan Unilever
      'ICICIBANK': 1270529,    // ICICI Bank
      'INDUSINDBK': 1346049,   // IndusInd Bank
      'INFY': 408065,          // Infosys
      'IOC': 415745,           // IOC
      'ITC': 424961,           // ITC
      'JSWSTEEL': 3001089,     // JSW Steel
      'KOTAKBANK': 492033,     // Kotak Bank
      'LT': 2939649,           // L&T
      'M&M': 519937,           // M&M
      'MARUTI': 2815745,       // Maruti Suzuki
      'NESTLEIND': 4598529,    // Nestle India
      'NTPC': 2977281,         // NTPC
      'ONGC': 633601,          // ONGC
      'POWERGRID': 3834113,    // Power Grid
      'RELIANCE': 738561,      // Reliance Industries
      'SBIN': 779521,          // SBI
      'SBILIFE': 5582849,      // SBI Life
      'SUNPHARMA': 857857,     // Sun Pharma
      'TATACONSUM': 878593,    // Tata Consumer
      'TATAMOTORS': 884737,    // Tata Motors
      'TATASTEEL': 895745,     // Tata Steel
      'TCS': 2953217,          // TCS
      'TECHM': 3465729,        // Tech Mahindra
      'TITAN': 897537,         // Titan Company
      'ULTRACEMCO': 2952193,   // UltraTech Cement
      'UPL': 2889473,          // UPL
      'WIPRO': 969473          // Wipro
    };
  }

  /**
   * 📁 Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${this.dataDir}`);
    }
  }

  /**
   * 📥 Restore market state from previous session
   */
  async restoreMarketState() {
    try {
      if (fs.existsSync(this.persistenceFile)) {
        const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
        
        // Check if data is recent (within last 4 hours)
        const lastSave = new Date(data.lastSaveTime);
        const hoursSinceLastSave = (Date.now() - lastSave.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave <= 4) {
          // Restore market state (convert arrays back to Maps)
          this.marketState = new Map(data.marketState || []);
          this.lastAnalysis = new Map(data.lastAnalysis || []);
          this.signalHistory = data.signalHistory || [];
          
          console.log(`📥 Restored market state from ${lastSave.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
          console.log(`📊 Restored: ${this.marketState.size} stocks, ${this.signalHistory.length} signals`);
          
          // Adjust analysis timers (reduce cooldowns since data might be stale)
          this.adjustAnalysisTimers(hoursSinceLastSave);
          
        } else {
          console.log(`⚠️  Previous state too old (${hoursSinceLastSave.toFixed(1)} hours), starting fresh`);
          this.initializeFreshState();
        }
      } else {
        console.log('📊 No previous state found, starting fresh session');
        this.initializeFreshState();
      }
    } catch (error) {
      console.error('❌ Failed to restore state:', error.message);
      this.initializeFreshState();
    }
  }

  /**
   * ⏰ Adjust analysis timers based on data age
   */
  adjustAnalysisTimers(hoursSinceLastSave) {
    // Reduce cooldowns proportionally to data age
    const reductionFactor = Math.min(hoursSinceLastSave / 4, 1); // Max 100% reduction
    const adjustedCooldown = this.config.minAnalysisInterval * (1 - reductionFactor * 0.8);
    
    // Update all analysis timers
    const now = Date.now();
    for (const [symbol, lastTime] of this.lastAnalysis.entries()) {
      const timeSince = now - lastTime;
      if (timeSince < adjustedCooldown) {
        // Reduce remaining cooldown
        this.lastAnalysis.set(symbol, now - adjustedCooldown);
      }
    }
    
    console.log(`⏰ Adjusted analysis cooldowns: ${(adjustedCooldown/1000).toFixed(0)}s (${(reductionFactor*100).toFixed(0)}% reduction)`);
  }

  /**
   * 🆕 Initialize fresh state
   */
  initializeFreshState() {
    this.marketState = new Map();
    this.lastAnalysis = new Map();
    this.signalHistory = [];
    console.log('🆕 Initialized fresh market state');
  }

  /**
   * 💾 Start periodic state saving
   */
  startPeriodicSaving() {
    // Save state every 30 seconds
    this.saveInterval = setInterval(() => {
      this.saveMarketState();
    }, 30000);
    
    console.log('💾 Started periodic state saving (every 30 seconds)');
  }

  /**
   * 💾 Save current market state to disk
   */
  saveMarketState() {
    try {
      const data = {
        marketState: Array.from(this.marketState.entries()),
        lastAnalysis: Array.from(this.lastAnalysis.entries()),
        signalHistory: this.signalHistory.slice(-100), // Keep last 100 signals
        sessionStartTime: new Date(),
        lastSaveTime: new Date(),
        systemInfo: {
          version: '1.0.0',
          totalStocks: this.nseWatchlist.length,
          activeStocks: this.marketState.size
        }
      };

      fs.writeFileSync(this.persistenceFile, JSON.stringify(data, null, 2));
      
      // Log save status (every 5 minutes to avoid spam)
      const now = Date.now();
      if (!this.lastSaveLog || now - this.lastSaveLog > 300000) {
        console.log(`💾 Market state saved: ${this.marketState.size} stocks, ${this.signalHistory.length} signals`);
        this.lastSaveLog = now;
      }
      
    } catch (error) {
      console.error('❌ Failed to save market state:', error.message);
    }
  }

  /**
   * 🚀 Start Real-Time LLM Trading System
   */
  async startRealTimeLLMSystem() {
    console.log('🚀 STARTING PERSISTENT REAL-TIME LLM TRADING SYSTEM (NIFTY50)');
    console.log('═'.repeat(70));
    console.log('📊 System: LLM Real-Time Analysis with Data Persistence');
    console.log('🎯 Market: NSE Equity Stocks (NIFTY50)');
    console.log('⏰ Active: Post 9:15 AM IST');
    console.log(`📈 Coverage: ${this.nseWatchlist.length} NIFTY50 stocks`);
    console.log('💾 Persistence: Auto-save every 30 seconds');
    console.log('💡 Triggers: Volume Spikes (4x) | Order Imbalance (15%) | Price Moves (1.5%)');
    console.log('═'.repeat(70));
    
    try {
      // 📥 Restore previous session data if available
      await this.restoreMarketState();
      
      // Initialize market state for all NIFTY50 stocks
      await this.initializeMarketState();
      
      // Setup WebSocket streaming for full NIFTY50
      await this.setupRealTimeStreaming();
      
      // 💾 Start periodic data saving
      this.startPeriodicSaving();
      
      // Start monitoring
      this.startMarketMonitoring();
      
      console.log('✅ Persistent Real-Time LLM Trading System Active');
      console.log(`📡 Monitoring ${this.nseWatchlist.length} NIFTY50 stocks with data persistence...\n`);
      
    } catch (error) {
      console.error('❌ Failed to start Persistent Real-Time LLM system:', error.message);
    }
  }

  /**
   * 📊 Initialize market state for all symbols
   */
  async initializeMarketState() {
    console.log('📊 Initializing market state for NIFTY50 stocks...');
    
    for (const symbol of this.nseWatchlist) {
      this.marketState.set(symbol, {
        tickHistory: [],
        volumeHistory: [],
        priceHistory: [],
        lastPrice: 0,
        lastVolume: 0,
        lastUpdate: new Date()
      });
      
      this.lastAnalysis.set(symbol, 0);
    }
    
    console.log(`✅ Market state initialized for ${this.nseWatchlist.length} NIFTY50 stocks`);
    console.log(`📋 Stocks: ${this.nseWatchlist.slice(0, 10).join(', ')}... (+${this.nseWatchlist.length - 10} more)`);
    
    // Validate instrument tokens
    this.validateInstrumentTokens();
  }

  /**
   * 🔍 Validate instrument tokens for all stocks
   */
  validateInstrumentTokens() {
    const missingTokens = this.nseWatchlist.filter(symbol => !this.instrumentTokens[symbol]);
    const validTokens = this.nseWatchlist.filter(symbol => this.instrumentTokens[symbol]);
    
    console.log(`✅ Valid tokens: ${validTokens.length}/${this.nseWatchlist.length} stocks`);
    
    if (missingTokens.length > 0) {
      console.log(`⚠️  Missing tokens for: ${missingTokens.join(', ')}`);
      console.log(`💡 These stocks will be skipped until tokens are added`);
    }
  }

  /**
   * 📡 Setup real-time WebSocket streaming
   */
  async setupRealTimeStreaming() {
    return new Promise((resolve, reject) => {
      this.kiteTicker.autoReconnect(true, 10, 5);
      
      this.kiteTicker.on('ticks', (ticks) => {
        this.processRealTimeTicks(ticks);
      });

      this.kiteTicker.on('connect', () => {
        console.log('🔗 WebSocket connected to Kite ticker');
        
        // Get all valid tokens for NIFTY50 stocks
        const tokens = this.nseWatchlist
          .map(symbol => this.instrumentTokens[symbol])
          .filter(token => token); // Filter out undefined tokens
        
        console.log(`📡 Subscribing to ${tokens.length} NIFTY50 instruments...`);
        
        // Subscribe to all NIFTY50 tokens
        this.kiteTicker.subscribe(tokens);
        this.kiteTicker.setMode(this.kiteTicker.modeFull, tokens);
        
        console.log(`✅ Successfully subscribed to ${tokens.length} stocks`);
        resolve();
      });

      this.kiteTicker.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.kiteTicker.on('disconnect', () => {
        console.log('📡 WebSocket disconnected - attempting reconnection...');
      });

      this.kiteTicker.connect();
    });
  }

  /**
   * 📈 Process real-time tick data
   */
  processRealTimeTicks(ticks) {
    ticks.forEach(tick => {
      const symbol = this.getSymbolFromToken(tick.instrument_token);
      if (!symbol) return;

      // Update market state
      this.updateMarketState(symbol, tick);
      
      // Check for trading opportunities
      const shouldAnalyze = this.shouldTriggerLLMAnalysis(symbol, tick);
      
      if (shouldAnalyze) {
        this.triggerLLMAnalysis(symbol, tick);
      }
      
      // Display live data
      this.displayLiveData(symbol, tick);
    });
  }

  /**
   * 🔍 Check if LLM analysis should be triggered
   */
  shouldTriggerLLMAnalysis(symbol, tick) {
    const marketState = this.marketState.get(symbol);
    
    // More lenient baseline requirement after restart (adaptive thresholds)
    const minTicksRequired = marketState?.tickHistory?.length < 5 ? 3 : 10;
    
    if (!marketState || marketState.tickHistory.length < minTicksRequired) return false;

    // Check time since last analysis (handle null case for restored data)
    const lastAnalysisTime = this.lastAnalysis.get(symbol) || 0;
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
    if (timeSinceLastAnalysis < this.config.minAnalysisInterval) return false;

    // Volume spike detection
    const volumeSpike = this.calculateVolumeSpike(symbol, tick);
    
    // Order imbalance detection
    const orderImbalance = this.calculateOrderImbalance(tick);
    
    // Price movement detection
    const priceChange = this.calculatePriceChange(symbol, tick);

    // Slightly lower thresholds if we have limited historical data (post-restart)
    const volumeThreshold = marketState.tickHistory.length < 20 ? 
      this.config.volumeSpikeThreshold * 0.8 : this.config.volumeSpikeThreshold;

    return (
      volumeSpike >= volumeThreshold ||
      Math.abs(orderImbalance) >= this.config.orderImbalanceThreshold ||
      Math.abs(priceChange) >= this.config.priceChangeThreshold
    );
  }

  /**
   * 🧠 Trigger LLM analysis for trading signal
   */
  async triggerLLMAnalysis(symbol, tick) {
    console.log(`\n🧠 REAL-TIME LLM ANALYSIS TRIGGERED: ${symbol}`);
    console.log('═'.repeat(50));
    
    try {
      // Prepare market context for LLM
      const marketContext = this.buildMarketContext(symbol, tick);
      
      // Get LLM trading signal
      const llmSignal = await this.getLLMTradingSignal(symbol, marketContext);
      
      // Process and emit signal
      if (llmSignal && llmSignal.confidence >= this.config.confidenceThreshold) {
        this.emitTradingSignal(symbol, llmSignal, tick);
      }
      
      // Update last analysis time
      this.lastAnalysis.set(symbol, Date.now());
      
    } catch (error) {
      console.error(`❌ LLM analysis failed for ${symbol}:`, error.message);
    }
  }

  /**
   * 🤖 Get LLM trading signal
   */
  async getLLMTradingSignal(symbol, marketContext) {
    const systemPrompt = `You are an expert NSE equity trader with real-time market data access.

ANALYSIS FRAMEWORK:
- Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Market: NSE Regular Session (9:15 AM - 3:30 PM IST)
- Focus: Real-time volume footprint and order flow analysis

SIGNAL CRITERIA:
- Volume Spike (4x+): Strong institutional activity
- Order Imbalance (15%+): Directional pressure  
- Price Breakout: Technical confirmation
- Time Context: Early session breakouts have higher success rate

RESPONSE FORMAT (JSON only):
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 75,
  "entry": 1234.50,
  "target": 1250.00,
  "stopLoss": 1220.00,
  "positionSize": 2.0,
  "timeframe": "5-15 minutes",
  "reasoning": "Volume spike + bullish breakout"
}`;

    const userPrompt = `REAL-TIME NSE TRADING ANALYSIS:

${marketContext}

Based on this real-time data, provide immediate trading signal.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);
      return null;
    }
  }

  /**
   * 📊 Build market context for LLM
   */
  buildMarketContext(symbol, tick) {
    const marketState = this.marketState.get(symbol);
    const volumeSpike = this.calculateVolumeSpike(symbol, tick);
    const orderImbalance = this.calculateOrderImbalance(tick);
    const priceChange = this.calculatePriceChange(symbol, tick);
    
    return `
STOCK: ${symbol}
TIMESTAMP: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

PRICE ACTION:
- Current Price: ₹${tick.last_price}
- Open: ₹${tick.ohlc.open}
- High: ₹${tick.ohlc.high}
- Low: ₹${tick.ohlc.low}
- Change: ${priceChange.toFixed(2)}%

VOLUME ANALYSIS:
- Current Volume: ${(tick.volume_traded || 0).toLocaleString()}
- Volume Spike: ${volumeSpike.toFixed(2)}x average
- Institutional Activity: ${volumeSpike >= 4 ? 'DETECTED' : 'NORMAL'}

ORDER BOOK:
- Buy Quantity: ${this.getTotalBuyQuantity(tick)}
- Sell Quantity: ${this.getTotalSellQuantity(tick)}
- Order Imbalance: ${orderImbalance.toFixed(1)}% ${orderImbalance > 0 ? 'BUY PRESSURE' : 'SELL PRESSURE'}

MARKET TIMING:
- Minutes from Open: ${this.getMinutesFromOpen()}
- Session Phase: ${this.getSessionPhase()}
- Trading Window: ${this.isOptimalTradingTime() ? 'OPTIMAL' : 'NORMAL'}

RECENT ACTIVITY:
- Price Trend: ${this.getPriceTrend(symbol)}
- Volume Trend: ${this.getVolumeTrend(symbol)}
`;
  }

  /**
   * 📈 Emit trading signal
   */
  emitTradingSignal(symbol, llmSignal, tick) {
    const signal = {
      system: 'REAL_TIME_LLM',
      symbol: symbol,
      signal: llmSignal.signal,
      confidence: llmSignal.confidence,
      entry: llmSignal.entry,
      target: llmSignal.target,
      stopLoss: llmSignal.stopLoss,
      positionSize: llmSignal.positionSize,
      timeframe: llmSignal.timeframe,
      reasoning: llmSignal.reasoning,
      marketData: {
        price: tick.last_price,
        volumeSpike: this.calculateVolumeSpike(symbol, tick),
        orderImbalance: this.calculateOrderImbalance(tick),
        timestamp: new Date()
      },
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    // Store in history
    this.signalHistory.push(signal);
    if (this.signalHistory.length > 100) {
      this.signalHistory.shift();
    }

    // Display signal
    this.displayTradingSignal(signal);
    
    // Emit for external listeners
    this.emit('tradingSignal', signal);
  }

  /**
   * 📺 Display trading signal
   */
  displayTradingSignal(signal) {
    console.log(`
🚨 REAL-TIME LLM TRADING SIGNAL
═══════════════════════════════════════
📊 ${signal.symbol}: ${signal.signal} (${signal.confidence}% confidence)
💰 Entry: ₹${signal.entry} | Target: ₹${signal.target} | Stop: ₹${signal.stopLoss}
📈 Position: ${signal.positionSize}% of capital
⏰ Timeframe: ${signal.timeframe}
🧠 Reasoning: ${signal.reasoning}
📊 Volume Spike: ${signal.marketData.volumeSpike.toFixed(2)}x
⚖️ Order Flow: ${signal.marketData.orderImbalance.toFixed(1)}%
🕐 Time: ${signal.timestamp}
═══════════════════════════════════════
`);
  }

  /**
   * 📊 Helper functions for market analysis
   */
  updateMarketState(symbol, tick) {
    const state = this.marketState.get(symbol);
    
    state.tickHistory.push({
      price: tick.last_price,
      volume: tick.volume_traded || 0,
      timestamp: new Date(),
      ohlc: tick.ohlc
    });
    
    if (state.tickHistory.length > 50) {
      state.tickHistory.shift();
    }
    
    state.volumeHistory.push(tick.volume_traded || 0);
    if (state.volumeHistory.length > 20) {
      state.volumeHistory.shift();
    }
    
    state.priceHistory.push(tick.last_price);
    if (state.priceHistory.length > 30) {
      state.priceHistory.shift();
    }
    
    state.lastPrice = tick.last_price;
    state.lastVolume = tick.volume_traded || 0;
    state.lastUpdate = new Date();
  }

  calculateVolumeSpike(symbol, tick) {
    const state = this.marketState.get(symbol);
    if (!state || state.volumeHistory.length < 10) return 1.0;
    
    const avgVolume = state.volumeHistory.slice(-10).reduce((sum, vol) => sum + vol, 0) / 10;
    const currentVolume = tick.volume_traded || 0;
    
    return avgVolume > 0 ? currentVolume / avgVolume : 1.0;
  }

  calculateOrderImbalance(tick) {
    if (!tick.depth || !tick.depth.buy || !tick.depth.sell) return 0;
    
    const buyQty = tick.depth.buy.reduce((sum, level) => sum + level.quantity, 0);
    const sellQty = tick.depth.sell.reduce((sum, level) => sum + level.quantity, 0);
    const total = buyQty + sellQty;
    
    return total > 0 ? ((buyQty - sellQty) / total) * 100 : 0;
  }

  calculatePriceChange(symbol, tick) {
    const state = this.marketState.get(symbol);
    if (!state || state.priceHistory.length < 5) return 0;
    
    const prevPrice = state.priceHistory[state.priceHistory.length - 5];
    return prevPrice > 0 ? ((tick.last_price - prevPrice) / prevPrice) * 100 : 0;
  }

  getSymbolFromToken(token) {
    return Object.keys(this.instrumentTokens).find(
      symbol => this.instrumentTokens[symbol] === token
    );
  }

  getTotalBuyQuantity(tick) {
    return tick.depth?.buy?.reduce((sum, level) => sum + level.quantity, 0)?.toLocaleString() || 'N/A';
  }

  getTotalSellQuantity(tick) {
    return tick.depth?.sell?.reduce((sum, level) => sum + level.quantity, 0)?.toLocaleString() || 'N/A';
  }

  getMinutesFromOpen() {
    const now = new Date();
    const marketOpen = new Date();
    marketOpen.setHours(9, 15, 0, 0);
    return Math.max(0, Math.floor((now - marketOpen) / (1000 * 60)));
  }

  getSessionPhase() {
    const minutes = this.getMinutesFromOpen();
    if (minutes < 30) return 'OPENING';
    if (minutes < 120) return 'MORNING';
    if (minutes < 240) return 'MIDDAY';
    return 'AFTERNOON';
  }

  isOptimalTradingTime() {
    const minutes = this.getMinutesFromOpen();
    return minutes >= 30 && minutes <= 90; // 9:45 AM - 10:45 AM
  }

  getPriceTrend(symbol) {
    const state = this.marketState.get(symbol);
    if (!state || state.priceHistory.length < 10) return 'UNKNOWN';
    
    const recent = state.priceHistory.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    if (last > first * 1.005) return 'BULLISH';
    if (last < first * 0.995) return 'BEARISH';
    return 'SIDEWAYS';
  }

  getVolumeTrend(symbol) {
    const state = this.marketState.get(symbol);
    if (!state || state.volumeHistory.length < 10) return 'UNKNOWN';
    
    const recent = state.volumeHistory.slice(-5);
    const earlier = state.volumeHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, vol) => sum + vol, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, vol) => sum + vol, 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.5) return 'INCREASING';
    if (recentAvg < earlierAvg * 0.5) return 'DECREASING';
    return 'STABLE';
  }

  displayLiveData(symbol, tick) {
    const volumeSpike = this.calculateVolumeSpike(symbol, tick);
    const change = tick.ohlc.close > 0 ? ((tick.last_price - tick.ohlc.close) / tick.ohlc.close * 100) : 0;
    const changeColor = change >= 0 ? '🟢' : '🔴';
    const time = new Date().toLocaleTimeString();
    
    // Only display if significant activity (volume spike > 2x or significant price change)
    if (volumeSpike > 2.0 || Math.abs(change) > 1.0) {
      console.log(`${time} | ${symbol.padEnd(12)} | ₹${tick.last_price.toString().padStart(8)} | ${changeColor} ${change.toFixed(2).padStart(6)}% | Vol: ${volumeSpike.toFixed(1)}x`);
    }
  }

  startMarketMonitoring() {
    console.log('📈 LIVE NIFTY50 ACTIVITY MONITOR (Significant moves only):');
    console.log('Time     | Symbol       | Price    | Change   | Volume');
    console.log('─'.repeat(60));
  }

  /**
   * 📋 Get signal history and statistics
   */
  getSignalHistory() {
    return {
      totalSignals: this.signalHistory.length,
      recentSignals: this.signalHistory.slice(-10),
      signalsBySymbol: this.getSignalsBySymbol(),
      signalsByType: this.getSignalsByType()
    };
  }

  getSignalsBySymbol() {
    const counts = {};
    this.signalHistory.forEach(signal => {
      counts[signal.symbol] = (counts[signal.symbol] || 0) + 1;
    });
    return counts;
  }

  getSignalsByType() {
    const counts = { BUY: 0, SELL: 0, HOLD: 0 };
    this.signalHistory.forEach(signal => {
      counts[signal.signal] = (counts[signal.signal] || 0) + 1;
    });
    return counts;
  }

  /**
   * 🛑 Stop the system with data persistence
   */
  stop() {
    console.log('\n🛑 Stopping Persistent Real-Time LLM Trading System...');
    
    // Save final state before shutdown
    this.saveMarketState();
    console.log('💾 Final market state saved');
    
    // Clear save interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      console.log('⏰ Stopped periodic saving');
    }
    
    // Disconnect WebSocket
    if (this.kiteTicker) {
      this.kiteTicker.disconnect();
      console.log('📡 WebSocket disconnected');
    }
    
    console.log('✅ System stopped gracefully with data preserved');
    
    // Display final statistics
    this.displayShutdownStats();
  }

  /**
   * � Display shutdown statistics
   */
  displayShutdownStats() {
    console.log('\n📊 SESSION SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`📈 Stocks Monitored: ${this.marketState.size}/${this.nseWatchlist.length}`);
    console.log(`🚨 Signals Generated: ${this.signalHistory.length}`);
    console.log(`💾 Data Persistence: ${fs.existsSync(this.persistenceFile) ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`📁 Data File: ${this.persistenceFile}`);
    console.log('═'.repeat(50));
  }
}

module.exports = RealTimeLLMTradingSystem;

// Direct execution
if (require.main === module) {
  const system = new RealTimeLLMTradingSystem();
  
  // Handle graceful shutdown with data persistence
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Persistent Real-Time LLM Trading System...');
    system.stop();
    process.exit(0);
  });

  // Handle unexpected errors with data saving
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    system.saveMarketState();
    console.log('💾 Emergency data save completed');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    system.saveMarketState();
    console.log('💾 Emergency data save completed');
    process.exit(1);
  });
  
  // Start the system
  system.startRealTimeLLMSystem()
    .catch(error => {
      console.error('❌ System startup failed:', error.message);
      process.exit(1);
    });
}