/**
 * 🇮🇳 INDIAN MARKET TRADING SYSTEM - CONFIGURATION
 * Centralized TypeScript configuration management
 */

import { config } from 'dotenv';
import type { 
  Configuration, 
  ServerConfig, 
  KiteConfig, 
  OpenAIConfig, 
  TradingConfig, 
  SecurityConfig, 
  MarketConfig, 
  LoggingConfig,
  MarketPhase 
} from '../src/types';

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

const configuration: Configuration = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3001'),
    environment: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  // Kite Connect Configuration
  kite: {
    apiKey: process.env.KITE_API_KEY || '',
    apiSecret: process.env.KITE_API_SECRET || '',
    redirectUrl: process.env.KITE_REDIRECT_URL || `http://localhost:${parseInt(process.env.PORT || '3001')}/auth/kite/callback`,
    postbackUrl: process.env.KITE_POSTBACK_URL || 'https://clean-polecat-one.ngrok-free.app/webhooks/kite/postback'
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.MAX_TOKENS || '800'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3')
  },

  // Trading Configuration
  trading: {
    // Core trading parameters
    minVolumeRatio: 4.0, // Minimum 400% volume increase for signal
    minConfidence: 0.7, // Minimum 70% confidence for signals
    maxPositionSize: 10.0, // Maximum 10% of portfolio per position
    riskPerTrade: 2.0, // Maximum 2% risk per trade
    tradingHours: {
      start: "09:15",
      end: "15:30"
    },
    enabledStrategies: ["volumeFootprint", "orderImbalance", "llmAnalysis"],
    
    // NSE stock symbols for trading
    instruments: [
      'RELIANCE',
      'TCS', 
      'HDFCBANK',
      'INFY',
      'HINDUNILVR',
      'ICICIBANK',
      'SBIN',
      'BHARTIARTL',
      'ITC',
      'KOTAKBANK'
    ],
    
    // Additional trading parameters
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
  },

  // Helper methods
  getMarketPhase(): MarketPhase {
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
  },

  isValidSymbol(symbol: string): boolean {
    return symbol && this.trading.instruments.hasOwnProperty(symbol.toUpperCase());
  },

  getInstrumentToken(symbol: string): number {
    return this.trading.instruments[symbol.toUpperCase()];
  },

  getAllSymbols(): string[] {
    return Object.keys(this.trading.instruments);
  }
};

export default configuration;
