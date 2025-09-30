/**
 * MANUAL STOCK ANALYZER
 * For user-selected stocks during 9:15-9:45 AM monitoring
 * Focused analysis for BUY/SELL/NO GOOD decisions
 */

class ManualStockAnalyzer {
  constructor(kiteConnect, llmAnalyzer) {
    this.kiteConnect = kiteConnect;
    this.llmAnalyzer = llmAnalyzer;
  }

  /**
   * Analyze user-selected stocks for trading decisions
   * @param {string[]} symbols - Array of 5-6 manually selected stocks
   * @returns {Object} Analysis results with BUY/SELL/NO GOOD recommendations
   */
  async analyzeSelectedStocks(symbols) {
    console.log(`🎯 MANUAL ANALYSIS: Processing ${symbols.length} user-selected stocks...`);
    
    const results = {
      timestamp: new Date().toISOString(),
      totalStocks: symbols.length,
      recommendations: [],
      summary: {
        buySignals: 0,
        sellSignals: 0,
        noGoodSignals: 0
      }
    };

    for (const symbol of symbols) {
      try {
        console.log(`📊 Analyzing ${symbol}...`);
        
        // Get focused data for this stock
        const stockData = await this.getStockAnalysisData(symbol);
        
        // LLM analysis for trading decision
        const recommendation = await this.getLLMRecommendation(symbol, stockData);
        
        results.recommendations.push({
          symbol,
          recommendation: recommendation.decision, // BUY/SELL/NO GOOD
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          data: stockData,
          timestamp: new Date().toISOString()
        });

        // Update summary
        if (recommendation.decision === 'BUY') results.summary.buySignals++;
        else if (recommendation.decision === 'SELL') results.summary.sellSignals++;
        else results.summary.noGoodSignals++;

      } catch (error) {
        console.log(`❌ Error analyzing ${symbol}: ${error.message}`);
        results.recommendations.push({
          symbol,
          recommendation: 'ERROR',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`✅ ANALYSIS COMPLETE: ${results.summary.buySignals} BUY, ${results.summary.sellSignals} SELL, ${results.summary.noGoodSignals} NO GOOD`);
    return results;
  }

  /**
   * Get focused data for stock analysis
   */
  async getStockAnalysisData(symbol) {
    const data = {
      symbol,
      currentTime: new Date().toISOString(),
      marketPhase: this.getMarketPhase()
    };

    try {
      // 1. Opening Range Data (9:15-9:45 AM)
      data.openingRange = await this.getOpeningRangeData(symbol);
      
      // 2. Current Market Data
      data.currentData = await this.getCurrentMarketData(symbol);
      
      // 3. Volume Analysis
      data.volumeAnalysis = await this.getVolumeAnalysis(symbol);
      
      // 4. Order Book Imbalance
      data.orderBookImbalance = await this.getOrderBookImbalance(symbol);
      
      // 5. Historical Context (for pattern matching)
      data.historicalContext = await this.getHistoricalContext(symbol);
      
      return data;

    } catch (error) {
      throw new Error(`Data collection failed for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get opening range data (9:15-9:45 AM)
   */
  async getOpeningRangeData(symbol) {
    try {
      // Get current date opening range
      const today = new Date();
      const fromTime = new Date(today);
      fromTime.setHours(9, 15, 0, 0);
      
      const toTime = new Date(today);
      toTime.setHours(9, 45, 0, 0);

      // For now, use OHLC data (can be enhanced with minute data later)
      const ohlc = await this.kiteConnect.getOHLC([`NSE:${symbol}`]);
      const stockOHLC = ohlc[`NSE:${symbol}`];

      return {
        period: '9:15-9:45 AM',
        open: stockOHLC.ohlc.open,
        high: stockOHLC.ohlc.high, // Note: This is session high, not opening range high
        low: stockOHLC.ohlc.low,   // Note: This is session low, not opening range low
        range: stockOHLC.ohlc.high - stockOHLC.ohlc.low,
        dataSource: 'OHLC_APPROXIMATION',
        note: 'Using session OHLC as opening range approximation'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get current market data
   */
  async getCurrentMarketData(symbol) {
    try {
      const ltp = await this.kiteConnect.getLTP([`NSE:${symbol}`]);
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      
      const stockLTP = ltp[`NSE:${symbol}`];
      const stockQuote = quote[`NSE:${symbol}`];

      return {
        lastPrice: stockLTP.last_price,
        volume: stockQuote.volume,
        buyQuantity: stockQuote.buy_quantity,
        sellQuantity: stockQuote.sell_quantity,
        avgPrice: stockQuote.average_price,
        dayHigh: stockQuote.ohlc.high,
        dayLow: stockQuote.ohlc.low,
        prevClose: stockQuote.ohlc.close
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze volume for 400% spike detection
   */
  async getVolumeAnalysis(symbol) {
    try {
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      const stockQuote = quote[`NSE:${symbol}`];
      
      // Simple volume analysis (can be enhanced with historical averages)
      const currentVolume = stockQuote.volume;
      const avgVolume = stockQuote.average_traded_price || 0; // Placeholder for historical average
      
      return {
        currentVolume,
        estimatedAvgVolume: avgVolume,
        volumeRatio: avgVolume > 0 ? currentVolume / avgVolume : 1,
        is400PercentSpike: avgVolume > 0 ? (currentVolume / avgVolume) >= 4 : false,
        note: 'Volume ratio calculation needs historical average enhancement'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get order book imbalance for stacked imbalance detection
   */
  async getOrderBookImbalance(symbol) {
    try {
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      const stockQuote = quote[`NSE:${symbol}`];
      
      const buyQty = stockQuote.buy_quantity || 0;
      const sellQty = stockQuote.sell_quantity || 0;
      const totalQty = buyQty + sellQty;
      
      const imbalance = totalQty > 0 ? (buyQty - sellQty) / totalQty : 0;
      
      return {
        buyQuantity: buyQty,
        sellQuantity: sellQty,
        imbalanceRatio: imbalance,
        imbalanceDirection: imbalance > 0.3 ? 'BUY_HEAVY' : 
                           imbalance < -0.3 ? 'SELL_HEAVY' : 'BALANCED',
        isSignificantImbalance: Math.abs(imbalance) > 0.3,
        note: 'Current snapshot only - need historical tracking for stacked imbalances'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get historical context for pattern matching
   */
  async getHistoricalContext(symbol) {
    try {
      // Simple historical context (can be enhanced)
      const quote = await this.kiteConnect.getQuote([`NSE:${symbol}`]);
      const stockQuote = quote[`NSE:${symbol}`];
      
      return {
        prevClose: stockQuote.ohlc.close,
        gapUp: ((stockQuote.ohlc.open - stockQuote.ohlc.close) / stockQuote.ohlc.close) * 100,
        currentMove: ((stockQuote.last_price - stockQuote.ohlc.open) / stockQuote.ohlc.open) * 100,
        note: 'Basic historical context - can be enhanced with multi-day patterns'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get LLM recommendation for trading decision
   */
  async getLLMRecommendation(symbol, stockData) {
    const prompt = this.buildAnalysisPrompt(symbol, stockData);
    
    try {
      const analysis = await this.llmAnalyzer.analyzeForTrading(prompt);
      return this.parseDecision(analysis);
      
    } catch (error) {
      return {
        decision: 'NO GOOD',
        confidence: 0,
        reasoning: `LLM analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Build focused analysis prompt for LLM
   */
  buildAnalysisPrompt(symbol, data) {
    return `
TRADING ANALYSIS REQUEST for ${symbol}

CURRENT TIME: ${data.currentTime}
MARKET PHASE: ${data.marketPhase}

OPENING RANGE DATA (9:15-9:45 AM):
- Open: ₹${data.openingRange?.open}
- High: ₹${data.openingRange?.high}
- Low: ₹${data.openingRange?.low}
- Range: ₹${data.openingRange?.range}

CURRENT MARKET DATA:
- Last Price: ₹${data.currentData?.lastPrice}
- Volume: ${data.currentData?.volume}
- Day High: ₹${data.currentData?.dayHigh}
- Day Low: ₹${data.currentData?.dayLow}

VOLUME ANALYSIS:
- Current Volume: ${data.volumeAnalysis?.currentVolume}
- Volume Ratio: ${data.volumeAnalysis?.volumeRatio}x
- 400% Spike: ${data.volumeAnalysis?.is400PercentSpike ? 'YES' : 'NO'}

ORDER BOOK IMBALANCE:
- Buy Quantity: ${data.orderBookImbalance?.buyQuantity}
- Sell Quantity: ${data.orderBookImbalance?.sellQuantity}
- Imbalance: ${data.orderBookImbalance?.imbalanceDirection}
- Significant: ${data.orderBookImbalance?.isSignificantImbalance ? 'YES' : 'NO'}

BREAKOUT ANALYSIS CRITERIA:
1. Opening Range Breakout: Has price broken above/below opening range?
2. Volume Confirmation: Is there 400%+ volume spike?
3. Order Imbalance: Are there 2-3 stacked imbalances in same direction?
4. Historical Context: Does this match strong breakout patterns?

REQUIRED OUTPUT:
Decision: BUY/SELL/NO GOOD
Confidence: 1-100%
Reasoning: Brief explanation focusing on breakout criteria

Analyze this data and provide a clear trading recommendation.
`;
  }

  /**
   * Parse LLM response into structured decision
   */
  parseDecision(analysis) {
    // Extract decision from LLM response
    const text = analysis.toLowerCase();
    
    let decision = 'NO GOOD';
    if (text.includes('buy') && !text.includes('no buy')) decision = 'BUY';
    else if (text.includes('sell') && !text.includes('no sell')) decision = 'SELL';
    
    // Extract confidence (look for percentage)
    let confidence = 50;
    const confidenceMatch = analysis.match(/(\d+)%/);
    if (confidenceMatch) confidence = parseInt(confidenceMatch[1]);
    
    return {
      decision,
      confidence,
      reasoning: analysis
    };
  }

  /**
   * Get current market phase
   */
  getMarketPhase() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 100 + minute; // HHMM format
    
    if (time < 915) return 'PRE_MARKET';
    if (time >= 915 && time <= 945) return 'OPENING_RANGE';
    if (time > 945 && time <= 1530) return 'REGULAR_TRADING';
    return 'POST_MARKET';
  }
}

module.exports = { ManualStockAnalyzer };