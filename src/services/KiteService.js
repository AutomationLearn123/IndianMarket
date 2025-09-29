/**
 * 📊 KITE CONNECT SERVICE
 * Handles all Kite Connect API operations and WebSocket streaming
 */

const { KiteConnect, KiteTicker } = require('kiteconnect');
const config = require('../config');

class KiteService {
  constructor() {
    this.kiteConnect = null;
    this.kiteTicker = null;
    this.isAuthenticated = false;
    this.latestTickData = new Map();
    this.accessToken = null;
    
    this.initializeKiteConnect();
  }

  initializeKiteConnect() {
    if (config.kite.apiKey && config.kite.apiSecret) {
      try {
        this.kiteConnect = new KiteConnect({
          api_key: config.kite.apiKey,
          api_secret: config.kite.apiSecret
        });
        console.log('✅ KiteConnect service initialized');
      } catch (error) {
        console.log('❌ KiteConnect initialization failed:', error.message);
        this.kiteConnect = null;
      }
    } else {
      console.log('❌ Kite Connect credentials missing');
    }
  }

  getLoginURL() {
    if (!this.kiteConnect) {
      throw new Error('Kite Connect not initialized');
    }
    return this.kiteConnect.getLoginURL();
  }

  async authenticate(requestToken) {
    if (!this.kiteConnect) {
      throw new Error('Kite Connect not initialized');
    }

    try {
      const response = await this.kiteConnect.generateSession(requestToken, config.kite.apiSecret);
      this.accessToken = response.access_token;
      this.kiteConnect.setAccessToken(this.accessToken);
      this.isAuthenticated = true;

      console.log('✅ Kite authentication successful!');
      
      // Start WebSocket connection for real-time data
      await this.startWebSocketConnection();
      
      return response;
    } catch (error) {
      console.error('❌ Kite authentication failed:', error.message);
      throw error;
    }
  }

  async startWebSocketConnection() {
    if (!this.isAuthenticated || !this.accessToken) {
      console.log('❌ Cannot start WebSocket - not authenticated');
      return;
    }

    try {
      console.log('📊 Starting WebSocket connection for live data...');
      
      this.kiteTicker = new KiteTicker({
        api_key: config.kite.apiKey,
        access_token: this.accessToken
      });

      this.kiteTicker.on('ticks', (ticks) => {
        this.handleTickData(ticks);
      });

      this.kiteTicker.on('connect', async () => {
        console.log('🔗 WebSocket connected, subscribing to watchlist...');
        const tokens = Object.values(config.trading.instruments);
        this.kiteTicker.subscribe(tokens);
        this.kiteTicker.setMode(this.kiteTicker.modeFull, tokens);
        console.log(`✅ Subscribed to ${tokens.length} instruments`);
      });

      this.kiteTicker.on('disconnect', (error) => {
        console.log('🔌 WebSocket disconnected, will use historical data fallback');
        if (error && error.code) {
          console.log(`Connection closed with code: ${error.code}`);
        }
      });

      this.kiteTicker.on('error', (error) => {
        console.log('❌ WebSocket error:', error.message || 'Connection failed');
      });

      this.kiteTicker.connect();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error.message);
    }
  }

  handleTickData(ticks) {
    ticks.forEach((tick) => {
      // Find symbol from instrument token
      const symbol = Object.keys(config.trading.instruments).find(
        key => config.trading.instruments[key] === tick.instrument_token
      );
      
      if (symbol) {
        this.latestTickData.set(symbol, tick);
        console.log(`📊 ${symbol}: ₹${tick.last_price} (Vol: ${tick.volume})`);
      }
    });
  }

  async getMarketData(symbol) {
    if (!this.isAuthenticated || !this.kiteConnect) {
      throw new Error('Not authenticated with Kite Connect');
    }

    const symbolUpper = symbol.toUpperCase();
    if (!config.isValidSymbol(symbolUpper)) {
      throw new Error(`Invalid symbol: ${symbolUpper}`);
    }

    // Try to get real data from various endpoints
    const instrumentToken = config.getInstrumentToken(symbolUpper);
    
    try {
      // Method 1: Try getLTP (Last Traded Price)
      try {
        const ltp = await this.kiteConnect.getLTP([`NSE:${symbolUpper}`]);
        const price = ltp[`NSE:${symbolUpper}`];
        if (price) {
          return this.formatMarketData(symbolUpper, { last_price: price.last_price }, 'ltp');
        }
      } catch (err1) {
        // Method 2: Try with instrument token
        try {
          const ltpToken = await this.kiteConnect.getLTP([instrumentToken]);
          const price = ltpToken[instrumentToken];
          if (price) {
            return this.formatMarketData(symbolUpper, { last_price: price.last_price }, 'ltp_token');
          }
        } catch (err2) {
          // Method 3: Try getOHLC
          try {
            const ohlc = await this.kiteConnect.getOHLC([`NSE:${symbolUpper}`]);
            const data = ohlc[`NSE:${symbolUpper}`];
            if (data) {
              return this.formatMarketData(symbolUpper, data, 'ohlc');
            }
          } catch (err3) {
            // Method 4: Try getQuote
            try {
              const quotes = await this.kiteConnect.getQuote([`NSE:${symbolUpper}`]);
              const quote = quotes[`NSE:${symbolUpper}`];
              if (quote) {
                return this.formatMarketData(symbolUpper, quote, 'quote');
              }
            } catch (err4) {
              throw new Error(`All API methods failed: ${err1.message}, ${err2.message}, ${err3.message}, ${err4.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Kite API error for ${symbolUpper}:`, error.message);
      
      // Check if we have WebSocket data
      const tickData = this.latestTickData.get(symbolUpper);
      if (tickData) {
        return this.formatMarketData(symbolUpper, tickData, 'websocket');
      }
      
      throw error;
    }
  }

  formatMarketData(symbol, data, source) {
    const instrumentToken = config.getInstrumentToken(symbol);
    
    // Create standardized market data format
    const marketData = {
      instrument_token: instrumentToken,
      last_price: data.last_price || data.price || 0,
      volume: data.volume || 0,
      buy_quantity: data.buy_quantity || 0,
      sell_quantity: data.sell_quantity || 0,
      ohlc: data.ohlc || {
        open: data.open || data.last_price || 0,
        high: data.high || data.last_price || 0,
        low: data.low || data.last_price || 0,
        close: data.close || data.last_price || 0
      },
      change: data.net_change || data.change || 0,
      last_trade_time: data.last_trade_time || new Date(),
      timestamp: new Date(),
      averageVolume: data.average_volume || 1000000,
      source: source
    };

    return marketData;
  }

  async getProfile() {
    if (!this.isAuthenticated || !this.kiteConnect) {
      throw new Error('Not authenticated');
    }
    return await this.kiteConnect.getProfile();
  }

  async getMargins() {
    if (!this.isAuthenticated || !this.kiteConnect) {
      throw new Error('Not authenticated');
    }
    return await this.kiteConnect.getMargins();
  }

  async getInstruments(exchanges = ['NSE']) {
    if (!this.isAuthenticated || !this.kiteConnect) {
      throw new Error('Not authenticated');
    }
    return await this.kiteConnect.getInstruments(exchanges);
  }

  async getHistoricalData(instrumentToken, interval, fromDate, toDate) {
    if (!this.isAuthenticated || !this.kiteConnect) {
      throw new Error('Not authenticated');
    }
    return await this.kiteConnect.getHistoricalData(instrumentToken, interval, fromDate, toDate);
  }

  getTickData(symbol) {
    return this.latestTickData.get(symbol.toUpperCase());
  }

  getAllTickData() {
    return Array.from(this.latestTickData.entries()).map(([symbol, data]) => ({
      symbol,
      data
    }));
  }

  isWebSocketConnected() {
    return this.kiteTicker && this.kiteTicker.readyState === 1;
  }

  disconnect() {
    if (this.kiteTicker) {
      this.kiteTicker.disconnect();
    }
    this.isAuthenticated = false;
    this.accessToken = null;
    this.latestTickData.clear();
  }

  getStatus() {
    return {
      initialized: !!this.kiteConnect,
      authenticated: this.isAuthenticated,
      websocketConnected: this.isWebSocketConnected(),
      tickDataCount: this.latestTickData.size,
      availableSymbols: config.getAllSymbols()
    };
  }
}

module.exports = KiteService;
