/**
 * Kite Connect Service - Real-time market data streaming and API integration
 */

import { KiteConnect } from 'kiteconnect';
import { EventEmitter } from 'events';
import { appConfig } from '../utils/config';
import { Logger } from '../utils/logger';
import { AppError, OpenAIError } from '../utils/errors';

// Local type definitions (keeping for future reference)
// interface KiteTickData {
//   instrument_token: number;
//   last_price: number;
//   last_quantity: number;
//   average_price: number;
//   volume: number;
//   buy_quantity: number;
//   sell_quantity: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   last_trade_time: Date;
//   exchange_timestamp: Date;
//   oi?: number;
//   oi_day_high?: number;
//   oi_day_low?: number;
//   depth?: MarketDepth;
// }

// interface MarketDepth {
//   buy: DepthItem[];
//   sell: DepthItem[];
// }

// interface DepthItem {
//   price: number;
//   quantity: number;
//   orders: number;
// }

interface KiteHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

interface StockMonitor {
  symbol: string;
  instrumentToken: number;
  exchange: 'NSE' | 'BSE';
  isActive: boolean;
  lastPrice: number;
  lastVolume: number;
  lastSignal?: any;
  lastAnalysis?: any;
  historicalData: KiteHistoricalData[];
}

// NSE Stock List
const NSE_WATCHLIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ITC', 'ASIANPAINT',
  'AXISBANK', 'LT', 'MARUTI', 'SUNPHARMA', 'ULTRACEMCO',
  'WIPRO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC',
  'KOTAKBANK', 'HCLTECH', 'BAJFINANCE', 'TITAN', 'TECHM',
  'ADANIPORTS', 'M&M', 'TATAMOTORS', 'BAJAJFINSV', 'COALINDIA'
] as const;

// Market Hours Utility
const INDIAN_MARKET_HOURS = {
  PRE_MARKET: { start: '09:00', end: '09:15' },
  REGULAR: { start: '09:15', end: '15:30' },
  POST_MARKET: { start: '15:40', end: '16:00' }
} as const;

const logger = new Logger('KiteService');

export class KiteService extends EventEmitter {
  private kiteConnect: any;
  private kiteTicker: any | null = null;
  private isConnected: boolean = false;
  private accessToken: string = '';
  private instrumentTokens: Map<string, number> = new Map();
  private stockMonitors: Map<string, StockMonitor> = new Map();

  constructor() {
    super();
    
    // Check if we have real API credentials
    if (appConfig.kiteApiKey === 'your_kite_api_key_here' || 
        appConfig.kiteApiSecret === 'your_kite_api_secret_here') {
      logger.warn('KiteService initialized with placeholder credentials. Real trading functions will be disabled.');
    }
    
    this.kiteConnect = new KiteConnect({
      api_key: appConfig.kiteApiKey
    });
    this.initializeStockMonitors();
    logger.info('Kite Service initialized');
  }

  /**
   * Get Kite Connect login URL for authentication
   */
  getLoginUrl(): string {
    return this.kiteConnect.getLoginURL();
  }

  /**
   * Complete the login flow and set access token
   */
  async login(requestToken: string): Promise<void> {
    try {
      const session = await this.kiteConnect.generateSession(requestToken, appConfig.kiteApiSecret);
      this.accessToken = session.access_token;
      this.kiteConnect.setAccessToken(this.accessToken);
      
      logger.info('Kite Connect login successful');
      await this.loadInstrumentTokens();
    } catch (error) {
      logger.error('Kite Connect login failed', error as Error);
      throw new OpenAIError('Login failed', error as Error);
    }
  }

  /**
   * Load instrument tokens for watchlist symbols
   */
  private async loadInstrumentTokens(): Promise<void> {
    try {
      const instruments = await this.kiteConnect.getInstruments('NSE');
      
      NSE_WATCHLIST.forEach((symbol: string) => {
        const instrument = instruments.find((inst: any) => 
          inst.tradingsymbol === symbol && inst.instrument_type === 'EQ'
        );
        
        if (instrument) {
          this.instrumentTokens.set(symbol, instrument.instrument_token);
          logger.debug(`Loaded token for ${symbol}`, { token: instrument.instrument_token });
        } else {
          logger.warn(`Instrument token not found for ${symbol}`);
        }
      });

      logger.info('Instrument tokens loaded', { 
        total: this.instrumentTokens.size,
        symbols: Array.from(this.instrumentTokens.keys())
      });

    } catch (error) {
      logger.error('Failed to load instrument tokens', error as Error);
      throw new AppError('Failed to load instrument data');
    }
  }

  /**
   * Initialize stock monitors for watchlist
   */
  private initializeStockMonitors(): void {
    NSE_WATCHLIST.forEach((symbol: string) => {
      this.stockMonitors.set(symbol, {
        symbol,
        instrumentToken: 0, // Will be set after loading tokens
        exchange: 'NSE',
        isActive: false,
        lastPrice: 0,
        lastVolume: 0,
        historicalData: []
      });
    });
  }

  /**
   * Connect to Kite WebSocket for real-time data
   */
  async connectWebSocket(): Promise<void> {
    if (!this.accessToken) {
      throw new AppError('Access token required for WebSocket connection');
    }

    try {
      // Initialize KiteTicker with proper imports
      const { KiteTicker } = await import('kiteconnect');
      
      this.kiteTicker = new KiteTicker({
        api_key: appConfig.kiteApiKey,
        access_token: this.accessToken
      });

      // Set up event handlers
      this.kiteTicker.on('ticks', (ticks: any[]) => {
        ticks.forEach((tick: any) => this.processTickData(tick));
      });

      this.kiteTicker.on('connect', () => {
        logger.info('KiteTicker WebSocket connected');
        this.isConnected = true;
        this.subscribeToWatchlist();
        this.emit('connected');
      });

      this.kiteTicker.on('disconnect', (error: any) => {
        logger.warn('KiteTicker WebSocket disconnected', error);
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.kiteTicker.on('error', (error: any) => {
        logger.error('KiteTicker WebSocket error', error);
        this.emit('error', error);
      });

      this.kiteTicker.on('close', (reason: any) => {
        logger.info('KiteTicker WebSocket closed', reason);
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.kiteTicker.on('order_update', (order: any) => {
        logger.info('Order update received', order);
        this.emit('orderUpdate', order);
      });

      // Connect to WebSocket
      this.kiteTicker.connect();

    } catch (error) {
      logger.error('WebSocket connection failed', error as Error);
      throw new AppError('WebSocket connection failed');
    }
  }

  /**
   * Subscribe to watchlist instruments
   */
  private subscribeToWatchlist(): void {
    if (!this.kiteTicker || !this.isConnected) return;

    const tokens = Array.from(this.instrumentTokens.values());
    if (tokens.length === 0) {
      logger.warn('No instrument tokens available for subscription');
      return;
    }

    // Subscribe to instruments
    this.kiteTicker.subscribe(tokens);
    this.kiteTicker.setMode(this.kiteTicker.modeFull, tokens);

    logger.info('Subscribed to watchlist', { 
      tokensCount: tokens.length,
      symbols: NSE_WATCHLIST 
    });
  }

  /**
   * Process tick data and update stock monitors
   */
  private processTickData(tickData: any): void {
    // Find the symbol for this instrument token
    const symbol = Array.from(this.instrumentTokens.entries())
      .find(([_, token]) => token === tickData.instrument_token)?.[0];

    if (!symbol) return;

    // Update stock monitor
    const monitor = this.stockMonitors.get(symbol);
    if (monitor) {
      monitor.lastPrice = tickData.last_price || 0;
      monitor.lastVolume = tickData.volume || 0;
      monitor.isActive = true;
    }

    // Emit tick data for analysis
    this.emit('tick', {
      symbol,
      tickData
    });

    logger.debug('Tick processed', {
      symbol,
      price: tickData.last_price,
      volume: tickData.volume
    });
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string, 
    interval: string = 'minute',
    fromDate: Date,
    toDate: Date
  ): Promise<KiteHistoricalData[]> {
    const instrumentToken = this.instrumentTokens.get(symbol);
    if (!instrumentToken) {
      throw new AppError(`Instrument token not found for ${symbol}`);
    }

    try {
      const historicalData = await this.kiteConnect.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate
      );

      return historicalData.map((candle: any) => ({
        date: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        oi: candle[6]
      }));

    } catch (error) {
      logger.error('Failed to fetch historical data', error as Error);
      throw new AppError(`Failed to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Check if market is open
   */
  isMarketOpen(): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isRegularHours = currentTime >= INDIAN_MARKET_HOURS.REGULAR.start && 
                          currentTime <= INDIAN_MARKET_HOURS.REGULAR.end;

    return isWeekday && isRegularHours;
  }

  /**
   * Get current market phase
   */
  getMarketPhase(): 'pre_market' | 'regular' | 'post_market' | 'closed' {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    if (!isWeekday) return 'closed';

    if (currentTime >= INDIAN_MARKET_HOURS.PRE_MARKET.start && 
        currentTime < INDIAN_MARKET_HOURS.REGULAR.start) {
      return 'pre_market';
    }

    if (currentTime >= INDIAN_MARKET_HOURS.REGULAR.start && 
        currentTime <= INDIAN_MARKET_HOURS.REGULAR.end) {
      return 'regular';
    }

    if (currentTime >= INDIAN_MARKET_HOURS.POST_MARKET.start && 
        currentTime <= INDIAN_MARKET_HOURS.POST_MARKET.end) {
      return 'post_market';
    }

    return 'closed';
  }

  /**
   * Get stock monitor data
   */
  getStockMonitor(symbol: string): StockMonitor | undefined {
    return this.stockMonitors.get(symbol);
  }

  /**
   * Get all stock monitors
   */
  getAllStockMonitors(): StockMonitor[] {
    return Array.from(this.stockMonitors.values());
  }

  /**
   * Disconnect WebSocket and cleanup
   */
  disconnect(): void {
    if (this.kiteTicker) {
      this.kiteTicker.disconnect();
      this.kiteTicker = null;
    }
    this.isConnected = false;
    logger.info('Kite Service disconnected');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; accessToken: boolean; instrumentsLoaded: boolean } {
    return {
      connected: this.isConnected,
      accessToken: !!this.accessToken,
      instrumentsLoaded: this.instrumentTokens.size > 0
    };
  }
}
