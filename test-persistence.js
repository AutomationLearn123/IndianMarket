#!/usr/bin/env node

/**
 * 🧪 TEST VERSION - Real-Time LLM Trading System
 * Tests data persistence without live market connection
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TestRealTimeLLMTradingSystem extends EventEmitter {
  constructor() {
    super();
    
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
    
    // Test configuration
    this.config = {
      volumeSpikeThreshold: 4.0,
      orderImbalanceThreshold: 15.0,
      priceChangeThreshold: 1.5,
      minAnalysisInterval: 120000,
      confidenceThreshold: 70
    };
    
    // Ensure data directory exists
    this.ensureDataDirectory();
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
          // Restore market state
          this.marketState = new Map(data.marketState || []);
          this.lastAnalysis = new Map(data.lastAnalysis || []);
          this.signalHistory = data.signalHistory || [];
          
          console.log(`📥 Restored market state from ${lastSave.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
          console.log(`📊 Restored: ${this.marketState.size} stocks, ${this.signalHistory.length} signals`);
          
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
    // Save state every 5 seconds for testing
    this.saveInterval = setInterval(() => {
      this.saveMarketState();
    }, 5000);
    
    console.log('💾 Started periodic state saving (every 5 seconds for testing)');
  }

  /**
   * 💾 Save current market state to disk
   */
  saveMarketState() {
    try {
      const data = {
        marketState: Array.from(this.marketState.entries()),
        lastAnalysis: Array.from(this.lastAnalysis.entries()),
        signalHistory: this.signalHistory.slice(-100),
        sessionStartTime: new Date(),
        lastSaveTime: new Date(),
        systemInfo: {
          version: '1.0.0-test',
          totalStocks: this.nseWatchlist.length,
          activeStocks: this.marketState.size
        }
      };

      fs.writeFileSync(this.persistenceFile, JSON.stringify(data, null, 2));
      
      // Log save status
      const now = Date.now();
      if (!this.lastSaveLog || now - this.lastSaveLog > 10000) {
        console.log(`💾 TEST: Market state saved: ${this.marketState.size} stocks, ${this.signalHistory.length} signals`);
        this.lastSaveLog = now;
      }
      
    } catch (error) {
      console.error('❌ Failed to save market state:', error.message);
    }
  }

  /**
   * 🧪 Start test system
   */
  async startTestSystem() {
    console.log('🧪 STARTING TEST - PERSISTENT REAL-TIME LLM TRADING SYSTEM');
    console.log('═'.repeat(70));
    console.log('📊 Mode: TEST (No live market connection)');
    console.log('🎯 Testing: Data persistence functionality');
    console.log(`📈 Simulating: ${this.nseWatchlist.length} NIFTY50 stocks`);
    console.log('💾 Persistence: Auto-save every 5 seconds');
    console.log('═'.repeat(70));
    
    try {
      // Restore previous session data if available
      await this.restoreMarketState();
      
      // Initialize test market data
      this.initializeTestMarketData();
      
      // Start periodic data saving
      this.startPeriodicSaving();
      
      // Simulate market activity
      this.simulateMarketActivity();
      
      console.log('✅ Test System Active - Simulating market data and testing persistence');
      console.log('🧪 Will run for 30 seconds then stop to test data saving...\n');
      
      // Auto-stop after 30 seconds for testing
      setTimeout(() => {
        this.stop();
      }, 30000);
      
    } catch (error) {
      console.error('❌ Failed to start test system:', error.message);
    }
  }

  /**
   * 📊 Initialize test market data
   */
  initializeTestMarketData() {
    console.log('📊 Initializing test market data...');
    
    // Create mock data for first 10 stocks
    const testStocks = this.nseWatchlist.slice(0, 10);
    
    testStocks.forEach(symbol => {
      this.marketState.set(symbol, {
        tickHistory: [
          { price: 1000 + Math.random() * 500, volume: 50000, timestamp: new Date() }
        ],
        volumeHistory: [45000, 52000, 48000],
        priceHistory: [1000, 1020, 1015],
        lastPrice: 1000 + Math.random() * 500,
        lastVolume: 50000,
        lastUpdate: new Date()
      });
      
      this.lastAnalysis.set(symbol, Date.now() - Math.random() * 60000);
    });
    
    console.log(`✅ Test market data initialized for ${testStocks.length} stocks`);
  }

  /**
   * 🎭 Simulate market activity
   */
  simulateMarketActivity() {
    let signalCount = 0;
    
    const activityInterval = setInterval(() => {
      // Add a test signal every 10 seconds
      if (signalCount < 3) {
        const symbols = ['RELIANCE', 'HDFCBANK', 'TCS'];
        const signals = ['BUY', 'SELL', 'HOLD'];
        const symbol = symbols[signalCount];
        const signal = signals[signalCount];
        
        const testSignal = {
          system: 'TEST_LLM',
          symbol: symbol,
          signal: signal,
          confidence: 75 + Math.random() * 20,
          entry: 1000 + Math.random() * 500,
          target: 1050 + Math.random() * 500,
          stopLoss: 950 + Math.random() * 50,
          reasoning: `Test signal ${signalCount + 1} for persistence testing`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };
        
        this.signalHistory.push(testSignal);
        console.log(`🧪 TEST SIGNAL ${signalCount + 1}: ${symbol} ${signal} (${testSignal.confidence.toFixed(1)}%)`);
        signalCount++;
      }
      
      // Update market state for a few stocks
      const activeStocks = Array.from(this.marketState.keys()).slice(0, 3);
      activeStocks.forEach(symbol => {
        const state = this.marketState.get(symbol);
        if (state) {
          state.lastPrice = state.lastPrice + (Math.random() - 0.5) * 20;
          state.lastVolume = 45000 + Math.random() * 10000;
          state.lastUpdate = new Date();
        }
      });
      
    }, 10000); // Every 10 seconds
    
    // Stop activity simulation after 30 seconds
    setTimeout(() => {
      clearInterval(activityInterval);
    }, 30000);
  }

  /**
   * 🛑 Stop test system with data persistence
   */
  stop() {
    console.log('\n🛑 Stopping Test System...');
    
    // Save final state
    this.saveMarketState();
    console.log('💾 Final test data saved');
    
    // Clear save interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      console.log('⏰ Stopped periodic saving');
    }
    
    console.log('✅ Test system stopped gracefully with data preserved');
    
    // Display test results
    this.displayTestResults();
  }

  /**
   * 📊 Display test results
   */
  displayTestResults() {
    console.log('\n🧪 TEST RESULTS:');
    console.log('═'.repeat(50));
    console.log(`📈 Stocks Simulated: ${this.marketState.size}/${this.nseWatchlist.length}`);
    console.log(`🚨 Test Signals: ${this.signalHistory.length}`);
    console.log(`💾 Data File: ${fs.existsSync(this.persistenceFile) ? '✅ Created' : '❌ Missing'}`);
    console.log(`📁 Location: ${this.persistenceFile}`);
    console.log('═'.repeat(50));
    console.log('\n🔍 Next: Run "npm run data:status" to verify data persistence');
  }
}

// Test execution
if (require.main === module) {
  const testSystem = new TestRealTimeLLMTradingSystem();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping test system...');
    testSystem.stop();
    process.exit(0);
  });
  
  // Start test
  testSystem.startTestSystem()
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestRealTimeLLMTradingSystem;