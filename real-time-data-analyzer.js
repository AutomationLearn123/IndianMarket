#!/usr/bin/env node

/**
 * 📡 REAL-TIME DATA-DRIVEN TRADING SYSTEM
 * Continuous streaming analysis with LLM predictions
 */

require('dotenv').config();
const DataDrivenLLMPredictor = require('./data-driven-llm-predictor');
const { KiteConnect, KiteTicker } = require('kiteconnect');

class RealTimeDataAnalyzer {
  constructor() {
    this.predictor = new DataDrivenLLMPredictor();
    this.kiteConnect = new KiteConnect({
      api_key: process.env.KITE_API_KEY
    });
    this.kiteConnect.setAccessToken(process.env.KITE_ACCESS_TOKEN);
    
    this.kiteTicker = null;
    this.watchlist = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL'];
    this.tickBuffer = new Map(); // Store streaming tick data
    this.lastAnalysis = new Map(); // Store last analysis time
    this.analysisInterval = 5 * 60 * 1000; // 5 minutes
    
    this.instrumentTokens = {
      'RELIANCE': 738561,
      'TCS': 2953217,
      'HDFCBANK': 341249,
      'INFY': 408065,
      'ICICIBANK': 1270529,
      'BHARTIARTL': 2714625
    };
  }

  /**
   * 🚀 Start real-time analysis system
   */
  async startRealTimeAnalysis() {
    console.log('📡 STARTING REAL-TIME DATA-DRIVEN ANALYSIS');
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Watching: ${this.watchlist.join(', ')}`);
    console.log(`⏱️  Analysis Interval: ${this.analysisInterval / 1000} seconds`);
    console.log('═══════════════════════════════════════════════');
    
    try {
      // Start WebSocket connection
      await this.startWebSocket();
      
      // Start periodic analysis
      this.startPeriodicAnalysis();
      
      console.log('✅ Real-time system active');
      console.log('📈 Monitoring for trading signals...\n');
      
    } catch (error) {
      console.log('❌ Failed to start real-time analysis:', error.message);
    }
  }

  /**
   * 📡 WebSocket for real-time tick data
   */
  async startWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.kiteTicker = new KiteTicker({
          api_key: process.env.KITE_API_KEY,
          access_token: process.env.KITE_ACCESS_TOKEN
        });

        this.kiteTicker.on('ticks', (ticks) => {
          this.processTickData(ticks);
        });

        this.kiteTicker.on('connect', () => {
          console.log('🔗 WebSocket connected');
          
          // Subscribe to watchlist
          const tokens = this.watchlist.map(symbol => this.instrumentTokens[symbol]).filter(Boolean);
          this.kiteTicker.subscribe(tokens);
          this.kiteTicker.setMode(this.kiteTicker.modeFull, tokens);
          
          resolve();
        });

        this.kiteTicker.on('error', (error) => {
          console.log('❌ WebSocket error:', error);
          reject(error);
        });

        this.kiteTicker.on('disconnect', (error) => {
          console.log('📡 WebSocket disconnected:', error);
        });

        this.kiteTicker.connect();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 📊 Process incoming tick data
   */
  processTickData(ticks) {
    ticks.forEach(tick => {
      const symbol = this.getSymbolFromToken(tick.instrument_token);
      if (symbol) {
        // Store tick in buffer
        if (!this.tickBuffer.has(symbol)) {
          this.tickBuffer.set(symbol, []);
        }
        
        const tickData = {
          timestamp: new Date(),
          price: tick.last_price,
          volume: tick.volume,
          change: tick.change,
          ohlc: tick.ohlc
        };
        
        this.tickBuffer.get(symbol).push(tickData);
        
        // Keep only last 100 ticks per symbol
        const buffer = this.tickBuffer.get(symbol);
        if (buffer.length > 100) {
          buffer.shift();
        }
        
        // Display live data
        this.displayLiveData(symbol, tick);
      }
    });
  }

  /**
   * 📈 Display live market data
   */
  displayLiveData(symbol, tick) {
    const time = new Date().toLocaleTimeString();
    const changeColor = tick.change >= 0 ? '🟢' : '🔴';
    const volumeK = (tick.volume / 1000).toFixed(0);
    
    console.log(`${time} | ${symbol.padEnd(12)} | ₹${tick.last_price.toFixed(2).padStart(8)} | ${changeColor} ${tick.change.toFixed(2).padStart(6)} | Vol: ${volumeK}K`);
  }

  /**
   * ⏰ Periodic LLM analysis
   */
  startPeriodicAnalysis() {
    setInterval(async () => {
      await this.runAnalysisRound();
    }, this.analysisInterval);
    
    // Run first analysis immediately
    setTimeout(() => this.runAnalysisRound(), 5000);
  }

  /**
   * 🧠 Run analysis for all symbols
   */
  async runAnalysisRound() {
    const now = new Date();
    console.log(`\n🧠 ANALYSIS ROUND: ${now.toLocaleTimeString()}`);
    console.log('═'.repeat(50));
    
    for (const symbol of this.watchlist) {
      try {
        const lastAnalysisTime = this.lastAnalysis.get(symbol) || 0;
        const timeSinceLastAnalysis = now.getTime() - lastAnalysisTime;
        
        // Only analyze if enough time has passed
        if (timeSinceLastAnalysis >= this.analysisInterval) {
          console.log(`\n📊 Analyzing ${symbol}...`);
          
          const prediction = await this.predictor.predictMarketMove(symbol);
          
          if (prediction && prediction.signal !== 'HOLD') {
            this.handleTradingSignal(prediction);
          }
          
          this.lastAnalysis.set(symbol, now.getTime());
          
          // Small delay between symbols
          await this.delay(2000);
        }
      } catch (error) {
        console.log(`❌ Error analyzing ${symbol}:`, error.message);
      }
    }
    
    console.log(`\n✅ Analysis round complete at ${now.toLocaleTimeString()}`);
  }

  /**
   * 🚨 Handle trading signals
   */
  handleTradingSignal(prediction) {
    console.log('\n🚨 TRADING SIGNAL DETECTED!');
    console.log('═'.repeat(40));
    console.log(`📊 ${prediction.symbol}: ${prediction.signal}`);
    console.log(`📈 Confidence: ${prediction.confidence}%`);
    console.log(`💰 Entry: ₹${prediction.entryPrice}`);
    console.log(`🛑 Stop: ₹${prediction.stopLoss}`);
    console.log(`🎯 Target: ₹${prediction.target}`);
    console.log(`⏰ Time: ${prediction.timeframe}`);
    console.log(`🧠 Reason: ${prediction.reasoning}`);
    
    // Here you could:
    // 1. Send alerts (email, SMS, Discord)
    // 2. Log to database
    // 3. Execute trades automatically
    // 4. Send to trading dashboard
    
    this.logSignalToFile(prediction);
  }

  /**
   * 📝 Log signals to file
   */
  logSignalToFile(prediction) {
    const fs = require('fs');
    const logEntry = {
      timestamp: new Date().toISOString(),
      symbol: prediction.symbol,
      signal: prediction.signal,
      confidence: prediction.confidence,
      entryPrice: prediction.entryPrice,
      stopLoss: prediction.stopLoss,
      target: prediction.target,
      reasoning: prediction.reasoning
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync('trading-signals.log', logLine);
    console.log('📝 Signal logged to trading-signals.log');
  }

  /**
   * 🔍 Get symbol from instrument token
   */
  getSymbolFromToken(token) {
    return Object.keys(this.instrumentTokens).find(
      symbol => this.instrumentTokens[symbol] === token
    );
  }

  /**
   * ⏳ Simple delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🛑 Stop the system
   */
  stop() {
    if (this.kiteTicker) {
      this.kiteTicker.disconnect();
    }
    console.log('🛑 Real-time system stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (global.analyzer) {
    global.analyzer.stop();
  }
  process.exit(0);
});

// Start the system
if (require.main === module) {
  const analyzer = new RealTimeDataAnalyzer();
  global.analyzer = analyzer;
  
  analyzer.startRealTimeAnalysis()
    .catch(error => {
      console.log('❌ System error:', error.message);
    });
}

module.exports = RealTimeDataAnalyzer;