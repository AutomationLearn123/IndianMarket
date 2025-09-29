/**
 * Kite Connect Service - Real-time market data streaming and API integration
 */
import { EventEmitter } from 'events';
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
export declare class KiteService extends EventEmitter {
    private kiteConnect;
    private kiteTicker;
    private isConnected;
    private accessToken;
    private instrumentTokens;
    private stockMonitors;
    constructor();
    /**
     * Get Kite Connect login URL for authentication
     */
    getLoginUrl(): string;
    /**
     * Complete the login flow and set access token
     */
    login(requestToken: string): Promise<void>;
    /**
     * Load instrument tokens for watchlist symbols
     */
    private loadInstrumentTokens;
    /**
     * Initialize stock monitors for watchlist
     */
    private initializeStockMonitors;
    /**
     * Connect to Kite WebSocket for real-time data
     */
    connectWebSocket(): Promise<void>;
    /**
     * Subscribe to watchlist instruments
     */
    private subscribeToWatchlist;
    /**
     * Process tick data and update stock monitors
     */
    private processTickData;
    /**
     * Get historical data for a symbol
     */
    getHistoricalData(symbol: string, interval: string | undefined, fromDate: Date, toDate: Date): Promise<KiteHistoricalData[]>;
    /**
     * Check if market is open
     */
    isMarketOpen(): boolean;
    /**
     * Get current market phase
     */
    getMarketPhase(): 'pre_market' | 'regular' | 'post_market' | 'closed';
    /**
     * Get stock monitor data
     */
    getStockMonitor(symbol: string): StockMonitor | undefined;
    /**
     * Get all stock monitors
     */
    getAllStockMonitors(): StockMonitor[];
    /**
     * Disconnect WebSocket and cleanup
     */
    disconnect(): void;
    /**
     * Get connection status
     */
    getConnectionStatus(): {
        connected: boolean;
        accessToken: boolean;
        instrumentsLoaded: boolean;
    };
}
export {};
//# sourceMappingURL=KiteService.d.ts.map