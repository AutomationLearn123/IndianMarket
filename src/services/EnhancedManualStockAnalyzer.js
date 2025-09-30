/**
 * ENHANCED MANUAL STOCK ANALYZER
 * Uses Kite Historical API effectively for post-9:45 analysis
 * Gets EXACT 9:15-9:45 AM data when user requests analysis
 */

const { Every5MinuteCandleAnalyzer } = require('./Every5MinuteCandleAnalyzer');

class EnhancedManualStockAnalyzer {
  constructor(kiteConnect, llmAnalyzer) {
    this.kiteConnect = kiteConnect;
    this.llmAnalyzer = llmAnalyzer;
    this.every5MinAnalyzer = new Every5MinuteCandleAnalyzer(kiteConnect);
  }

  /**
   * Analyze user-selected stocks AFTER 9:45 AM
   * Uses historical API to get exact 9:15-9:45 data
   */
  async analyzeSelectedStocks(symbols) {
    console.log(`🎯 POST-9:45 ANALYSIS: Processing ${symbols.length} user-selected stocks...`);
    
    const results = {
      timestamp: new Date().toISOString(),
      totalStocks: symbols.length,
      analysisTime: this.getCurrentTime(),
      marketPhase: this.getMarketPhase(),
      recommendations: [],
      summary: {
        buySignals: 0,
        sellSignals: 0,
        noGoodSignals: 0
      }
    };

    // Validate timing - should be after 9:45 AM for best results
    if (!this.isOptimalAnalysisTime()) {
      console.log('⚠️ Warning: Analysis works best after 9:45 AM when opening range is complete');
    }

    for (const symbol of symbols) {
      try {
        console.log(`📊 Analyzing ${symbol} using 9:15-9:45 AM data...`);
        
        // Step 1: Get comprehensive analysis data (opening range)
        const stockData = await this.getComprehensiveAnalysisData(symbol);
        
        // Step 2: YOUR EXACT REQUIREMENT - Analyze EVERY 5-minute candle after 9:45
        console.log(`🎯 ANALYZING EVERY 5-MIN CANDLE POST-9:45 for ${symbol}...`);
        const every5MinAnalysis = await this.every5MinAnalyzer.analyzeEvery5MinuteCandlePost945(
          symbol, 
          stockData.openingRange
        );
        
        // Step 3: Combine analyses for final recommendation
        const recommendation = every5MinAnalysis.hasPerfectSetup 
          ? every5MinAnalysis.foundTradingSignal.tradingSignal
          : every5MinAnalysis.recommendation;
        
        results.recommendations.push({
          symbol,
          recommendation: recommendation.decision,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          data: stockData,
          every5MinAnalysis, // Include the detailed every-5-min analysis
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

    console.log(`✅ POST-9:45 ANALYSIS COMPLETE: ${results.summary.buySignals} BUY, ${results.summary.sellSignals} SELL, ${results.summary.noGoodSignals} NO GOOD`);
    return results;
  }

  /**
   * Get comprehensive analysis data using Kite APIs effectively
   */
  async getComprehensiveAnalysisData(symbol) {
    const data = {
      symbol,
      analysisTime: new Date().toISOString(),
      marketPhase: this.getMarketPhase()
    };

    // Perform comprehensive analysis
    data.openingRangeAnalysis = await this.getExactOpeningRangeData(symbol);
    data.currentMarketData = await this.getCurrentMarketData(symbol);
    data.historicalVolumeContext = await this.getHistoricalVolumeContext(symbol);
    data.volumeAnalysis = await this.getAdvancedVolumeAnalysis(symbol, data.openingRangeAnalysis, data.historicalVolumeContext);
    data.breakoutAnalysis = this.analyzeBreakoutPatterns(data);

    return data;
  }

  /**
   * Get EXACT 9:15-9:45 AM data using Kite historical API
   * This is the key improvement - using API effectively!
   */
  async getExactOpeningRangeData(symbol) {
    try {
      const today = new Date();
      
      // Get minute-by-minute data for 9:15-9:45 AM
      const fromTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 09:15:00`;
      const toTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 09:45:00`;
      
      console.log(`📈 Fetching EXACT 9:15-9:45 data for ${symbol}...`);
      
      // Get instrument token
      const instruments = await this.kiteConnect.getInstruments('NSE');
      const instrument = instruments.find(inst => 
        inst.tradingsymbol === symbol && inst.instrument_type === 'EQ'
      );
      
      if (!instrument) {
        throw new Error(`Instrument token not found for ${symbol}`);
      }

      // Fetch minute-by-minute historical data
      const historicalData = await this.kiteConnect.getHistoricalData(
        instrument.instrument_token,
        'minute',
        fromTime,
        toTime
      );

      // Analyze the exact 30-minute opening range
      if (historicalData.length === 0) {
        throw new Error(`No historical data available for ${symbol} during 9:15-9:45 AM`);
      }

      const openingRange = {
        startTime: '9:15:00',
        endTime: '9:45:00',
        totalMinutes: historicalData.length,
        expectedMinutes: 30,
        completeness: (historicalData.length / 30) * 100,
        
        // EXACT opening range calculations
        open: historicalData[0][1], // First candle open
        high: Math.max(...historicalData.map(candle => candle[2])), // Highest high
        low: Math.min(...historicalData.map(candle => candle[3])), // Lowest low
        close: historicalData[historicalData.length - 1][4], // Last candle close
        
        // Volume analysis
        totalVolume: historicalData.reduce((sum, candle) => sum + candle[5], 0),
        avgVolumePerMinute: historicalData.reduce((sum, candle) => sum + candle[5], 0) / historicalData.length,
        
        // Price range analysis
        range: Math.max(...historicalData.map(candle => candle[2])) - Math.min(...historicalData.map(candle => candle[3])),
        rangePct: ((Math.max(...historicalData.map(candle => candle[2])) - Math.min(...historicalData.map(candle => candle[3]))) / historicalData[0][1]) * 100,
        
        // Minute-by-minute breakdown
        minuteData: historicalData.map(candle => ({
          time: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        })),
        
        dataQuality: 'EXACT_HISTORICAL_API',
        note: 'Perfect 9:15-9:45 AM data from Kite historical API'
      };

      console.log(`✅ Got ${historicalData.length} minutes of EXACT opening range data for ${symbol}`);
      return openingRange;

    } catch (error) {
      console.log(`❌ Failed to get exact opening range for ${symbol}: ${error.message}`);
      
      // Fallback to OHLC approximation
      return await this.getFallbackOpeningRange(symbol);
    }
  }

  /**
   * Get historical volume context for 400% spike detection
   */
  async getHistoricalVolumeContext(symbol) {
    try {
      const today = new Date();
      const pastDays = [];
      
      // Get last 10 trading days for volume comparison
      for (let i = 1; i <= 15; i++) { // Extra days to account for weekends
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          pastDays.push(date);
        }
        
        if (pastDays.length >= 10) break;
      }

      const volumeHistory = [];
      
      for (const date of pastDays.slice(0, 5)) { // Get last 5 trading days
        try {
          const fromTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 09:15:00`;
          const toTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 09:45:00`;
          
          // Get instrument token
          const instruments = await this.kiteConnect.getInstruments('NSE');
          const instrument = instruments.find(inst => 
            inst.tradingsymbol === symbol && inst.instrument_type === 'EQ'
          );
          
          if (instrument) {
            const historicalData = await this.kiteConnect.getHistoricalData(
              instrument.instrument_token,
              'minute',
              fromTime,
              toTime
            );
            
            const dayVolume = historicalData.reduce((sum, candle) => sum + candle[5], 0);
            volumeHistory.push({
              date: date.toDateString(),
              volume: dayVolume,
              minutes: historicalData.length
            });
          }
        } catch (error) {
          console.log(`⚠️ Could not get volume data for ${date.toDateString()}: ${error.message}`);
        }
      }

      if (volumeHistory.length === 0) {
        return { error: 'No historical volume data available' };
      }

      // Calculate average volume for 400% detection
      const avgVolume = volumeHistory.reduce((sum, day) => sum + day.volume, 0) / volumeHistory.length;
      
      return {
        historicalDays: volumeHistory.length,
        avgOpeningRangeVolume: avgVolume,
        spike400Threshold: avgVolume * 4,
        spike300Threshold: avgVolume * 3,
        spike200Threshold: avgVolume * 2,
        volumeHistory,
        note: `Based on last ${volumeHistory.length} trading days of 9:15-9:45 AM volume`
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Advanced volume analysis comparing today vs historical
   */
  async getAdvancedVolumeAnalysis(symbol, openingRangeData, historicalContext) {
    try {
      const todayVolume = openingRangeData?.totalVolume || 0;
      const avgHistoricalVolume = historicalContext?.avgOpeningRangeVolume || 0;
      
      if (avgHistoricalVolume === 0) {
        return {
          error: 'No historical volume baseline available',
          todayVolume,
          note: 'Cannot calculate volume spike without historical data'
        };
      }

      const volumeRatio = todayVolume / avgHistoricalVolume;
      
      return {
        todayVolume,
        avgHistoricalVolume,
        volumeRatio,
        volumeSpike: {
          is200Percent: volumeRatio >= 2,
          is300Percent: volumeRatio >= 3,
          is400Percent: volumeRatio >= 4,
          is500Percent: volumeRatio >= 5
        },
        spikeLevel: volumeRatio >= 4 ? 'EXTREME' :
                   volumeRatio >= 3 ? 'HIGH' :
                   volumeRatio >= 2 ? 'MODERATE' : 'NORMAL',
        significance: volumeRatio >= 4 ? 'STRONG_BREAKOUT_SIGNAL' :
                     volumeRatio >= 2 ? 'MODERATE_INTEREST' : 'NORMAL_ACTIVITY'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze breakout patterns using exact data
   */
  analyzeBreakoutPatterns(data) {
    try {
      const openingRange = data.openingRangeAnalysis;
      const currentData = data.currentMarketData;
      const volumeAnalysis = data.volumeAnalysis;
      
      if (!openingRange || !currentData) {
        return { error: 'Insufficient data for breakout analysis' };
      }

      const currentPrice = currentData.lastPrice;
      const rangeHigh = openingRange.high;
      const rangeLow = openingRange.low;
      
      // Breakout detection
      const breakoutAbove = currentPrice > rangeHigh;
      const breakdownBelow = currentPrice < rangeLow;
      const insideRange = !breakoutAbove && !breakdownBelow;
      
      // Breakout strength calculation
      let breakoutStrength = 'NONE';
      let breakoutDirection = 'NONE';
      
      if (breakoutAbove) {
        breakoutDirection = 'BULLISH';
        const breakoutPct = ((currentPrice - rangeHigh) / rangeHigh) * 100;
        breakoutStrength = breakoutPct > 2 ? 'STRONG' : 
                          breakoutPct > 1 ? 'MODERATE' : 'WEAK';
      } else if (breakdownBelow) {
        breakoutDirection = 'BEARISH';
        const breakdownPct = ((rangeLow - currentPrice) / rangeLow) * 100;
        breakoutStrength = breakdownPct > 2 ? 'STRONG' : 
                          breakdownPct > 1 ? 'MODERATE' : 'WEAK';
      }

      return {
        hasBreakout: breakoutAbove || breakdownBelow,
        breakoutDirection,
        breakoutStrength,
        currentPrice,
        rangeHigh,
        rangeLow,
        insideRange,
        volumeConfirmation: volumeAnalysis?.volumeSpike?.is400Percent || false,
        signal: this.generateBreakoutSignal(breakoutDirection, breakoutStrength, volumeAnalysis)
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Generate trading signal based on breakout analysis
   */
  generateBreakoutSignal(direction, strength, volumeAnalysis) {
    if (direction === 'NONE' || strength === 'NONE') {
      return 'NO_BREAKOUT';
    }

    const hasVolumeConfirmation = volumeAnalysis?.volumeSpike?.is400Percent;
    
    if (direction === 'BULLISH' && strength === 'STRONG' && hasVolumeConfirmation) {
      return 'STRONG_BUY';
    }
    
    if (direction === 'BEARISH' && strength === 'STRONG' && hasVolumeConfirmation) {
      return 'STRONG_SELL';
    }
    
    if ((direction === 'BULLISH' || direction === 'BEARISH') && hasVolumeConfirmation) {
      return direction === 'BULLISH' ? 'BUY' : 'SELL';
    }
    
    return 'WEAK_SIGNAL';
  }

  // ... rest of the methods (getCurrentMarketData, getLLMRecommendation, etc.)
  // [Implementation continues...]

  /**
   * Get current market data for breakout comparison
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
        prevClose: stockQuote.ohlc.close,
        change: stockLTP.last_price - stockQuote.ohlc.close,
        changePct: ((stockLTP.last_price - stockQuote.ohlc.close) / stockQuote.ohlc.close) * 100
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Fallback opening range using OHLC
   */
  async getFallbackOpeningRange(symbol) {
    try {
      const ohlc = await this.kiteConnect.getOHLC([`NSE:${symbol}`]);
      const stockOHLC = ohlc[`NSE:${symbol}`];

      return {
        period: '9:15-9:45 AM (Approximation)',
        open: stockOHLC.ohlc.open,
        high: stockOHLC.ohlc.high,
        low: stockOHLC.ohlc.low,
        range: stockOHLC.ohlc.high - stockOHLC.ohlc.low,
        dataSource: 'OHLC_APPROXIMATION',
        note: 'Using session OHLC as opening range approximation - less accurate'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get LLM recommendation using enhanced data
   */
  async getLLMRecommendation(symbol, stockData) {
    const prompt = this.buildEnhancedAnalysisPrompt(symbol, stockData);
    
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
   * Build enhanced analysis prompt with exact data
   */
  buildEnhancedAnalysisPrompt(symbol, data) {
    return `
ENHANCED TRADING ANALYSIS for ${symbol}

ANALYSIS TIME: ${data.analysisTime}
MARKET PHASE: ${data.marketPhase}

=== EXACT OPENING RANGE DATA (9:15-9:45 AM) ===
- Open: ₹${data.openingRangeAnalysis?.open?.toFixed(2)}
- High: ₹${data.openingRangeAnalysis?.high?.toFixed(2)}
- Low: ₹${data.openingRangeAnalysis?.low?.toFixed(2)}
- Range: ₹${data.openingRangeAnalysis?.range?.toFixed(2)} (${data.openingRangeAnalysis?.rangePct?.toFixed(2)}%)
- Volume: ${data.openingRangeAnalysis?.totalVolume?.toLocaleString()}
- Data Quality: ${data.openingRangeAnalysis?.dataQuality}
- Minutes Captured: ${data.openingRangeAnalysis?.totalMinutes}/30

=== CURRENT MARKET DATA ===
- Current Price: ₹${data.currentMarketData?.lastPrice?.toFixed(2)}
- Day High: ₹${data.currentMarketData?.dayHigh?.toFixed(2)}
- Day Low: ₹${data.currentMarketData?.dayLow?.toFixed(2)}
- Change: ${data.currentMarketData?.changePct?.toFixed(2)}%
- Current Volume: ${data.currentMarketData?.volume?.toLocaleString()}

=== HISTORICAL VOLUME ANALYSIS ===
- Average Opening Range Volume: ${data.historicalVolumeContext?.avgOpeningRangeVolume?.toLocaleString()}
- Today's Opening Range Volume: ${data.openingRangeAnalysis?.totalVolume?.toLocaleString()}
- Volume Ratio: ${data.volumeAnalysis?.volumeRatio?.toFixed(2)}x
- 400% Spike: ${data.volumeAnalysis?.volumeSpike?.is400Percent ? 'YES ✅' : 'NO'}
- 300% Spike: ${data.volumeAnalysis?.volumeSpike?.is300Percent ? 'YES ✅' : 'NO'}
- Spike Level: ${data.volumeAnalysis?.spikeLevel}
- Historical Days: ${data.historicalVolumeContext?.historicalDays}

=== BREAKOUT ANALYSIS ===
- Has Breakout: ${data.breakoutAnalysis?.hasBreakout ? 'YES ✅' : 'NO'}
- Direction: ${data.breakoutAnalysis?.breakoutDirection}
- Strength: ${data.breakoutAnalysis?.breakoutStrength}
- Current vs Range High: ₹${data.currentMarketData?.lastPrice?.toFixed(2)} vs ₹${data.breakoutAnalysis?.rangeHigh?.toFixed(2)}
- Current vs Range Low: ₹${data.currentMarketData?.lastPrice?.toFixed(2)} vs ₹${data.breakoutAnalysis?.rangeLow?.toFixed(2)}
- Volume Confirmation: ${data.breakoutAnalysis?.volumeConfirmation ? 'YES ✅' : 'NO'}
- Signal: ${data.breakoutAnalysis?.signal}

=== TRADING CRITERIA ===
1. ✅ STRONG BUY: Bullish breakout + Strong volume (300%+) + Clear direction
2. ✅ STRONG SELL: Bearish breakdown + Strong volume (300%+) + Clear direction  
3. ⚠️ BUY/SELL: Moderate breakout + Some volume confirmation
4. ❌ NO GOOD: No clear breakout OR insufficient volume OR mixed signals

REQUIRED OUTPUT FORMAT:
Decision: BUY/SELL/NO GOOD
Confidence: 1-100%
Reasoning: Focus on breakout + volume + clarity of signal

Analyze this comprehensive data and provide trading recommendation.
`;
  }

  /**
   * Parse LLM response into structured decision
   */
  parseDecision(analysis) {
    const text = analysis.toLowerCase();
    
    let decision = 'NO GOOD';
    if (text.includes('strong buy') || (text.includes('buy') && text.includes('strong'))) {
      decision = 'BUY';
    } else if (text.includes('strong sell') || (text.includes('sell') && text.includes('strong'))) {
      decision = 'SELL';
    } else if (text.includes('buy') && !text.includes('no buy') && !text.includes("don't buy")) {
      decision = 'BUY';
    } else if (text.includes('sell') && !text.includes('no sell') && !text.includes("don't sell")) {
      decision = 'SELL';
    }
    
    // Extract confidence
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
   * Utility methods
   */
  getCurrentTime() {
    return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  getMarketPhase() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 100 + minute;
    
    if (time < 915) return 'PRE_MARKET';
    if (time >= 915 && time <= 945) return 'OPENING_RANGE';
    if (time > 945 && time <= 1530) return 'REGULAR_TRADING';
    return 'POST_MARKET';
  }

  isOptimalAnalysisTime() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 100 + minute;
    
    // Optimal after 9:45 when opening range is complete
    return time >= 945;
  }
}

module.exports = { EnhancedManualStockAnalyzer };