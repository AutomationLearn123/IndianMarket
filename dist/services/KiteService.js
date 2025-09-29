"use strict";
/**
 * Kite Connect Service - Real-time market data streaming and API integration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KiteService = void 0;
const kiteconnect_1 = require("kiteconnect");
const events_1 = require("events");
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// NSE Stock List
const NSE_WATCHLIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ITC', 'ASIANPAINT',
    'AXISBANK', 'LT', 'MARUTI', 'SUNPHARMA', 'ULTRACEMCO',
    'WIPRO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC',
    'KOTAKBANK', 'HCLTECH', 'BAJFINANCE', 'TITAN', 'TECHM',
    'ADANIPORTS', 'M&M', 'TATAMOTORS', 'BAJAJFINSV', 'COALINDIA'
];
// Market Hours Utility
const INDIAN_MARKET_HOURS = {
    PRE_MARKET: { start: '09:00', end: '09:15' },
    REGULAR: { start: '09:15', end: '15:30' },
    POST_MARKET: { start: '15:40', end: '16:00' }
};
const logger = new logger_1.Logger('KiteService');
class KiteService extends events_1.EventEmitter {
    constructor() {
        super();
        this.kiteTicker = null;
        this.isConnected = false;
        this.accessToken = '';
        this.instrumentTokens = new Map();
        this.stockMonitors = new Map();
        // Check if we have real API credentials
        if (config_1.appConfig.kiteApiKey === 'your_kite_api_key_here' ||
            config_1.appConfig.kiteApiSecret === 'your_kite_api_secret_here') {
            logger.warn('KiteService initialized with placeholder credentials. Real trading functions will be disabled.');
        }
        this.kiteConnect = new kiteconnect_1.KiteConnect({
            api_key: config_1.appConfig.kiteApiKey
        });
        this.initializeStockMonitors();
        logger.info('Kite Service initialized');
    }
    /**
     * Get Kite Connect login URL for authentication
     */
    getLoginUrl() {
        return this.kiteConnect.getLoginURL();
    }
    /**
     * Complete the login flow and set access token
     */
    async login(requestToken) {
        try {
            const session = await this.kiteConnect.generateSession(requestToken, config_1.appConfig.kiteApiSecret);
            this.accessToken = session.access_token;
            this.kiteConnect.setAccessToken(this.accessToken);
            logger.info('Kite Connect login successful');
            await this.loadInstrumentTokens();
        }
        catch (error) {
            logger.error('Kite Connect login failed', error);
            throw new errors_1.OpenAIError('Login failed', error);
        }
    }
    /**
     * Load instrument tokens for watchlist symbols
     */
    async loadInstrumentTokens() {
        try {
            const instruments = await this.kiteConnect.getInstruments('NSE');
            NSE_WATCHLIST.forEach((symbol) => {
                const instrument = instruments.find((inst) => inst.tradingsymbol === symbol && inst.instrument_type === 'EQ');
                if (instrument) {
                    this.instrumentTokens.set(symbol, instrument.instrument_token);
                    logger.debug(`Loaded token for ${symbol}`, { token: instrument.instrument_token });
                }
                else {
                    logger.warn(`Instrument token not found for ${symbol}`);
                }
            });
            logger.info('Instrument tokens loaded', {
                total: this.instrumentTokens.size,
                symbols: Array.from(this.instrumentTokens.keys())
            });
        }
        catch (error) {
            logger.error('Failed to load instrument tokens', error);
            throw new errors_1.AppError('Failed to load instrument data');
        }
    }
    /**
     * Initialize stock monitors for watchlist
     */
    initializeStockMonitors() {
        NSE_WATCHLIST.forEach((symbol) => {
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
    async connectWebSocket() {
        if (!this.accessToken) {
            throw new errors_1.AppError('Access token required for WebSocket connection');
        }
        try {
            // Initialize KiteTicker with proper imports
            const { KiteTicker } = await Promise.resolve().then(() => __importStar(require('kiteconnect')));
            this.kiteTicker = new KiteTicker({
                api_key: config_1.appConfig.kiteApiKey,
                access_token: this.accessToken
            });
            // Set up event handlers
            this.kiteTicker.on('ticks', (ticks) => {
                ticks.forEach((tick) => this.processTickData(tick));
            });
            this.kiteTicker.on('connect', () => {
                logger.info('KiteTicker WebSocket connected');
                this.isConnected = true;
                this.subscribeToWatchlist();
                this.emit('connected');
            });
            this.kiteTicker.on('disconnect', (error) => {
                logger.warn('KiteTicker WebSocket disconnected', error);
                this.isConnected = false;
                this.emit('disconnected');
            });
            this.kiteTicker.on('error', (error) => {
                logger.error('KiteTicker WebSocket error', error);
                this.emit('error', error);
            });
            this.kiteTicker.on('close', (reason) => {
                logger.info('KiteTicker WebSocket closed', reason);
                this.isConnected = false;
                this.emit('disconnected');
            });
            this.kiteTicker.on('order_update', (order) => {
                logger.info('Order update received', order);
                this.emit('orderUpdate', order);
            });
            // Connect to WebSocket
            this.kiteTicker.connect();
        }
        catch (error) {
            logger.error('WebSocket connection failed', error);
            throw new errors_1.AppError('WebSocket connection failed');
        }
    }
    /**
     * Subscribe to watchlist instruments
     */
    subscribeToWatchlist() {
        if (!this.kiteTicker || !this.isConnected)
            return;
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
    processTickData(tickData) {
        // Find the symbol for this instrument token
        const symbol = Array.from(this.instrumentTokens.entries())
            .find(([_, token]) => token === tickData.instrument_token)?.[0];
        if (!symbol)
            return;
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
    async getHistoricalData(symbol, interval = 'minute', fromDate, toDate) {
        const instrumentToken = this.instrumentTokens.get(symbol);
        if (!instrumentToken) {
            throw new errors_1.AppError(`Instrument token not found for ${symbol}`);
        }
        try {
            const historicalData = await this.kiteConnect.getHistoricalData(instrumentToken, interval, fromDate, toDate);
            return historicalData.map((candle) => ({
                date: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
                oi: candle[6]
            }));
        }
        catch (error) {
            logger.error('Failed to fetch historical data', error);
            throw new errors_1.AppError(`Failed to fetch historical data for ${symbol}`);
        }
    }
    /**
     * Check if market is open
     */
    isMarketOpen() {
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
    getMarketPhase() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        if (!isWeekday)
            return 'closed';
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
    getStockMonitor(symbol) {
        return this.stockMonitors.get(symbol);
    }
    /**
     * Get all stock monitors
     */
    getAllStockMonitors() {
        return Array.from(this.stockMonitors.values());
    }
    /**
     * Disconnect WebSocket and cleanup
     */
    disconnect() {
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
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            accessToken: !!this.accessToken,
            instrumentsLoaded: this.instrumentTokens.size > 0
        };
    }
}
exports.KiteService = KiteService;
//# sourceMappingURL=KiteService.js.map