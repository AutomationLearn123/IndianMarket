/**
 * 🇮🇳 INDIAN MARKET TRADING SYSTEM - CONFIGURATION
 * Centralized configuration management
 */

const { config } = require('dotenv');

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = [
  'KITE_API_KEY',
  'KITE_API_SECRET',
  'OPENAI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
}

const configuration = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    environment: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  // Kite Connect Configuration
  kite: {
    apiKey: process.env.KITE_API_KEY,
    apiSecret: process.env.KITE_API_SECRET,
    redirectUrl: process.env.KITE_REDIRECT_URL || `http://localhost:${parseInt(process.env.PORT) || 3001}/auth/kite/callback`,
    postbackUrl: process.env.KITE_POSTBACK_URL || 'https://clean-polecat-one.ngrok-free.app/webhooks/kite/postback'
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 800,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3
  },

  // Trading Configuration
  trading: {
    // Stock symbol to instrument token mapping (NSE)
    instruments: {
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
    },
    
    // Trading parameters
    defaultStopLossPercent: 2.0,
    defaultTargetPercent: 4.0,
    volumeThresholdMultiplier: 2.0,
    priceChangeThreshold: 1.5,
    orderImbalanceThreshold: 0.3
  },

  // Security Configuration
  security: {
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ],
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 200 // requests per window
  },

  // Market Configuration
  market: {
    timezone: 'Asia/Kolkata',
    preMarketStart: { hours: 9, minutes: 0 },
    marketOpen: { hours: 9, minutes: 15 },
    marketClose: { hours: 15, minutes: 30 },
    postMarketEnd: { hours: 16, minutes: 0 }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDirectory: './logs'
  }
};

// Helper functions
configuration.getMarketPhase = function() {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: this.market.timezone }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const time = hours * 100 + minutes;
  const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;
  
  if (!isWeekday) return 'closed';
  
  const preMarket = this.market.preMarketStart.hours * 100 + this.market.preMarketStart.minutes;
  const marketOpen = this.market.marketOpen.hours * 100 + this.market.marketOpen.minutes;
  const marketClose = this.market.marketClose.hours * 100 + this.market.marketClose.minutes;
  const postMarket = this.market.postMarketEnd.hours * 100 + this.market.postMarketEnd.minutes;
  
  if (time >= preMarket && time < marketOpen) return 'pre_market';
  if (time >= marketOpen && time <= marketClose) return 'regular';
  if (time > marketClose && time <= postMarket) return 'post_market';
  
  return 'closed';
};

configuration.isValidSymbol = function(symbol) {
  return symbol && this.trading.instruments.hasOwnProperty(symbol.toUpperCase());
};

configuration.getInstrumentToken = function(symbol) {
  return this.trading.instruments[symbol.toUpperCase()];
};

configuration.getAllSymbols = function() {
  return Object.keys(this.trading.instruments);
};

module.exports = configuration;
