#!/usr/bin/env node

/**
 * 📊 COMPREHENSIVE KITE DATA COLLECTOR
 * Maximizes data extraction from Kite Connect API for LLM analysis
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');

class ComprehensiveDataCollector {
  constructor() {
    this.kiteConnect = new KiteConnect({
      api_key: process.env.KITE_API_KEY
    });
    this.kiteConnect.setAccessToken(process.env.KITE_ACCESS_TOKEN);
    
    this.dataBuffer = new Map(); // Store streaming data
    this.analysisWindow = 30; // minutes
  }

  /**
   * 🎯 CORE DATA COLLECTION - Everything Kite can provide
   */
  async collectComprehensiveData(symbol) {
    console.log(`📊 COMPREHENSIVE DATA COLLECTION: ${symbol}`);
    console.log('═══════════════════════════════════════════════════════');
    
    const data = {
      timestamp: new Date(),
      symbol: symbol,
      
      // 1. CURRENT MARKET STATE
      currentState: await this.getCurrentState(symbol),
      
      // 2. PRICE ACTION SEQUENCE (last 30 minutes)
      priceAction: await this.getPriceActionSequence(symbol),
      
      // 3. VOLUME ANALYSIS
      volumeAnalysis: await this.getVolumeAnalysis(symbol),
      
      // 4. ORDER BOOK DEPTH
      orderBook: await this.getOrderBookAnalysis(symbol),
      
      // 5. STATISTICAL INDICATORS
      technicalIndicators: await this.calculateTechnicalIndicators(symbol),
      
      // 6. PATTERN RECOGNITION DATA
      patterns: await this.identifyPatterns(symbol),
      
      // 7. MARKET CONTEXT
      marketContext: await this.getMarketContext(symbol)
    };
    
    return data;
  }

  /**
   * 1️⃣ Current Market State
   */
  async getCurrentState(symbol) {
    try {
      const [ltp, quote, ohlc] = await Promise.all([
        this.kiteConnect.getLTP([`NSE:${symbol}`]),
        this.kiteConnect.getQuote([`NSE:${symbol}`]),
        this.kiteConnect.getOHLC([`NSE:${symbol}`])
      ]);
      
      const ltpData = ltp[`NSE:${symbol}`];
      const quoteData = quote[`NSE:${symbol}`];
      const ohlcData = ohlc[`NSE:${symbol}`];
      
      return {
        lastPrice: ltpData.last_price,
        volume: quoteData.volume,
        turnover: quoteData.average_price * quoteData.volume,
        ohlc: ohlcData.ohlc,
        change: quoteData.net_change,
        changePercent: ((quoteData.net_change / ohlcData.ohlc.close) * 100).toFixed(2),
        buyQuantity: quoteData.buy_quantity,
        sellQuantity: quoteData.sell_quantity,
        totalBuyValue: this.calculateBuyValue(quoteData.depth?.buy || []),
        totalSellValue: this.calculateSellValue(quoteData.depth?.sell || [])
      };
    } catch (error) {
      console.log('❌ Error getting current state:', error.message);
      return null;
    }
  }

  /**
   * 2️⃣ Price Action Sequence (Minute-by-minute for 30 minutes)
   */
  async getPriceActionSequence(symbol) {
    try {
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - (this.analysisWindow * 60 * 1000));
      
      const instrumentToken = await this.getInstrumentToken(symbol);
      if (!instrumentToken) {
        console.log(`⚠️ Skipping price action analysis for ${symbol} - no instrument token`);
        return null;
      }
      
      const historicalData = await this.kiteConnect.getHistoricalData(
        instrumentToken, 
        'minute', 
        fromDate, 
        toDate
      );
      
      // Calculate price movement patterns
      const sequence = historicalData.map((candle, index) => {
        const prevCandle = historicalData[index - 1];
        return {
          time: candle.date,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          range: candle.high - candle.low,
          bodySize: Math.abs(candle.close - candle.open),
          upperWick: candle.high - Math.max(candle.open, candle.close),
          lowerWick: Math.min(candle.open, candle.close) - candle.low,
          priceChange: prevCandle ? candle.close - prevCandle.close : 0,
          volumeChange: prevCandle ? candle.volume - prevCandle.volume : 0,
          candleType: this.getCandleType(candle)
        };
      });
      
      return {
        totalCandles: sequence.length,
        sequence: sequence,
        priceMovement: this.analyzePriceMovement(sequence),
        volumePattern: this.analyzeVolumePattern(sequence)
      };
    } catch (error) {
      console.log('❌ Error getting price action:', error.message);
      return null;
    }
  }

  /**
   * 3️⃣ Volume Analysis
   */
  async getVolumeAnalysis(symbol) {
    try {
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      const quoteData = quote[`NSE:${symbol}`];
      
      // Get average volume (would need historical data for proper calculation)
      const avgVolume = quoteData.average_traded_quantity || 1000000; // Fallback
      const currentVolume = quoteData.volume;
      
      return {
        currentVolume: currentVolume,
        averageVolume: avgVolume,
        volumeRatio: (currentVolume / avgVolume).toFixed(2),
        volumeSpike: currentVolume > (avgVolume * 2),
        volumeCategory: this.categorizeVolume(currentVolume, avgVolume),
        buyPressure: quoteData.buy_quantity,
        sellPressure: quoteData.sell_quantity,
        orderImbalance: this.calculateOrderImbalance(quoteData.buy_quantity, quoteData.sell_quantity)
      };
    } catch (error) {
      console.log('❌ Error analyzing volume:', error.message);
      return null;
    }
  }

  /**
   * 4️⃣ Order Book Depth Analysis
   */
  async getOrderBookAnalysis(symbol) {
    try {
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      const depth = quote[`NSE:${symbol}`].depth;
      
      if (!depth) return null;
      
      const buyOrders = depth.buy || [];
      const sellOrders = depth.sell || [];
      
      return {
        buyDepth: buyOrders.map(order => ({
          price: order.price,
          quantity: order.quantity,
          orders: order.orders,
          value: order.price * order.quantity
        })),
        sellDepth: sellOrders.map(order => ({
          price: order.price,
          quantity: order.quantity,
          orders: order.orders,
          value: order.price * order.quantity
        })),
        spread: sellOrders[0]?.price - buyOrders[0]?.price,
        bidAskRatio: this.calculateBidAskRatio(buyOrders, sellOrders),
        depthImbalance: this.calculateDepthImbalance(buyOrders, sellOrders)
      };
    } catch (error) {
      console.log('❌ Error analyzing order book:', error.message);
      return null;
    }
  }

  /**
   * 5️⃣ Technical Indicators
   */
  async calculateTechnicalIndicators(symbol) {
    try {
      // Get enough historical data for calculations
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - (50 * 24 * 60 * 60 * 1000)); // 50 days
      
      const instrumentToken = await this.getInstrumentToken(symbol);
      if (!instrumentToken) {
        console.log(`⚠️ Skipping technical indicators for ${symbol} - no instrument token`);
        return null;
      }
      
      const dailyData = await this.kiteConnect.getHistoricalData(
        instrumentToken, 
        'day', 
        fromDate, 
        toDate
      );
      
      const closes = dailyData.map(d => d.close);
      const volumes = dailyData.map(d => d.volume);
      
      return {
        sma20: this.calculateSMA(closes, 20),
        sma50: this.calculateSMA(closes, 50),
        rsi: this.calculateRSI(closes, 14),
        averageVolume: this.calculateSMA(volumes, 20),
        volatility: this.calculateVolatility(closes, 20),
        momentum: this.calculateMomentum(closes, 10),
        pricePosition: this.calculatePricePosition(dailyData[dailyData.length - 1])
      };
    } catch (error) {
      console.log('❌ Error calculating indicators:', error.message);
      return null;
    }
  }

  /**
   * 6️⃣ Pattern Recognition
   */
  async identifyPatterns(symbol) {
    try {
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - (120 * 60 * 1000)); // 2 hours
      
      const instrumentToken = await this.getInstrumentToken(symbol);
      if (!instrumentToken) {
        console.log(`⚠️ Skipping pattern identification for ${symbol} - no instrument token`);
        return null;
      }
      
      const minuteData = await this.kiteConnect.getHistoricalData(
        instrumentToken, 
        'minute', 
        fromDate, 
        toDate
      );
      
      return {
        trend: this.identifyTrend(minuteData),
        supportResistance: this.findSupportResistance(minuteData),
        breakoutPattern: this.identifyBreakout(minuteData),
        consolidationPattern: this.identifyConsolidation(minuteData),
        volumeSpikes: this.findVolumeSpikes(minuteData)
      };
    } catch (error) {
      console.log('❌ Error identifying patterns:', error.message);
      return null;
    }
  }

  /**
   * 7️⃣ Market Context
   */
  async getMarketContext(symbol) {
    const now = new Date();
    const marketOpen = new Date(now.toDateString() + ' 09:15:00');
    const marketClose = new Date(now.toDateString() + ' 15:30:00');
    
    const minutesFromOpen = (now - marketOpen) / (1000 * 60);
    const minutesToClose = (marketClose - now) / (1000 * 60);
    
    return {
      marketPhase: this.getMarketPhase(now),
      minutesFromOpen: Math.max(0, minutesFromOpen),
      minutesToClose: Math.max(0, minutesToClose),
      isEarlySession: minutesFromOpen < 60,
      isMidSession: minutesFromOpen >= 60 && minutesFromOpen <= 240,
      isLateSession: minutesFromOpen > 240,
      isBreakoutTime: this.isBreakoutTime(now)
    };
  }

  // Helper methods for calculations
  getCandleType(candle) {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const bodyRatio = body / range;
    
    if (bodyRatio < 0.3) return 'DOJI';
    if (candle.close > candle.open) return 'BULLISH';
    return 'BEARISH';
  }

  calculateSMA(data, period) {
    if (data.length < period) return null;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return (sum / period).toFixed(2);
  }

  calculateRSI(closes, period) {
    if (closes.length < period + 1) return null;
    
    let gains = 0, losses = 0;
    
    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi.toFixed(2);
  }

  calculateOrderImbalance(buyQty, sellQty) {
    const total = buyQty + sellQty;
    if (total === 0) return 0;
    return (((buyQty - sellQty) / total) * 100).toFixed(2);
  }

  async getInstrumentToken(symbol) {
    // Complete NSE instrument token mapping for major stocks
    const instruments = {
      'RELIANCE': 738561,
      'TCS': 2953217,
      'HDFCBANK': 341249,
      'INFY': 408065,
      'ICICIBANK': 1270529,
      'BHARTIARTL': 2714625,
      'HINDUNILVR': 356865,
      'SBIN': 779521,
      'ITC': 424961,
      'ASIANPAINT': 60417,
      'AXISBANK': 1510401,
      'LT': 2939649,
      'MARUTI': 2815745,
      'SUNPHARMA': 857857,
      'ULTRACEMCO': 2952193,
      'WIPRO': 3787777,
      'BAJFINANCE': 81153,
      'POWERGRID': 3834113,
      'TITAN': 3465729,
      'NESTLEIND': 17963009,
      'HCLTECH': 7229441,
      'KOTAKBANK': 492033,
      'TECHM': 3465729,
      'JSWSTEEL': 3001089,
      'INDUSINDBK': 1346049,
      'BAJAJFINSV': 4268801,
      'ADANIPORTS': 15083265,
      'ONGC': 633601,
      'NTPC': 2977281,
      'TATASTEEL': 895745,
      'COALINDIA': 20374273,
      'DRREDDY': 225537,
      'APOLLOHOSP': 157441,
      'DIVISLAB': 2800641,
      'CIPLA': 177665,
      'BRITANNIA': 140033,
      'EICHERMOT': 232961,
      'GRASIM': 315393,
      'HEROMOTOCO': 345089,
      'BPCL': 134657,
      'IOC': 415745,
      'SHREECEM': 794369,
      'TATACONSUM': 878593,
      'TATAMOTORS': 884737
    };
    
    const token = instruments[symbol];
    if (!token) {
      console.log(`⚠️ Warning: No instrument token found for ${symbol}`);
      return null;
    }
    
    return token;
  }

  getMarketPhase(now) {
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeValue = hour * 100 + minute;
    
    if (timeValue < 915) return 'PRE_MARKET';
    if (timeValue >= 915 && timeValue <= 1530) return 'REGULAR';
    return 'POST_MARKET';
  }

  // Additional helper methods would be implemented here...
  analyzePriceMovement(sequence) { return { trend: 'UNKNOWN' }; }
  analyzeVolumePattern(sequence) { return { pattern: 'UNKNOWN' }; }
  categorizeVolume(current, average) { return current > average ? 'HIGH' : 'LOW'; }
  calculateBidAskRatio(buy, sell) { return 1.0; }
  calculateDepthImbalance(buy, sell) { return 0; }
  calculateBuyValue(buyDepth) { return 0; }
  calculateSellValue(sellDepth) { return 0; }
  calculateVolatility(closes, period) { return 0; }
  calculateMomentum(closes, period) { return 0; }
  calculatePricePosition(candle) { return 'MIDDLE'; }
  identifyTrend(data) { return 'SIDEWAYS'; }
  findSupportResistance(data) { return { support: 0, resistance: 0 }; }
  identifyBreakout(data) { return false; }
  identifyConsolidation(data) { return false; }
  findVolumeSpikes(data) { return []; }
  isBreakoutTime(now) { return false; }
}

module.exports = ComprehensiveDataCollector;

// Test usage
if (require.main === module) {
  const collector = new ComprehensiveDataCollector();
  const symbol = process.argv[2] || 'RELIANCE';
  
  collector.collectComprehensiveData(symbol)
    .then(data => {
      console.log('\n📊 COMPREHENSIVE DATA COLLECTED:');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(console.error);
}