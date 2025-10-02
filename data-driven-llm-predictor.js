#!/usr/bin/env node

/**
 * 🧠 PURE DATA-DRIVEN LLM MARKET PREDICTOR
 * No manual analysis - purely mathematical pattern recognition
 */

require('dotenv').config();
const OpenAI = require('openai');
const ComprehensiveDataCollector = require('./comprehensive-data-collector');

class DataDrivenLLMPredictor {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.dataCollector = new ComprehensiveDataCollector();
  }

  /**
   * 🎯 MAIN PREDICTION FUNCTION
   */
  async predictMarketMove(symbol) {
    console.log(`🧠 DATA-DRIVEN LLM PREDICTION: ${symbol}`);
    console.log('═══════════════════════════════════════════════════════');
    
    // 1. Collect comprehensive data
    const marketData = await this.dataCollector.collectComprehensiveData(symbol);
    
    if (!marketData) {
      console.log('❌ Failed to collect market data');
      return null;
    }
    
    // 2. Format data for LLM analysis
    const formattedData = this.formatDataForLLM(marketData);
    
    // 3. Get LLM prediction
    const prediction = await this.getLLMPrediction(symbol, formattedData);
    
    // 4. Validate and format response
    const finalPrediction = this.validatePrediction(prediction, marketData);
    
    console.log('\n🎯 FINAL PREDICTION:');
    console.log('═══════════════════════');
    console.log(`📊 Symbol: ${finalPrediction.symbol}`);
    console.log(`🎯 Signal: ${finalPrediction.signal}`);
    console.log(`📈 Confidence: ${finalPrediction.confidence}%`);
    console.log(`💰 Entry: ₹${finalPrediction.entryPrice}`);
    console.log(`🛑 Stop Loss: ₹${finalPrediction.stopLoss}`);
    console.log(`🎯 Target: ₹${finalPrediction.target}`);
    console.log(`⏰ Timeframe: ${finalPrediction.timeframe}`);
    console.log(`🧠 Reasoning: ${finalPrediction.reasoning}`);
    
    return finalPrediction;
  }

  /**
   * 📊 Format comprehensive data for LLM consumption
   */
  formatDataForLLM(data) {
    return {
      // PRICE DATA
      currentPrice: data.currentState?.lastPrice || 0,
      priceChange: data.currentState?.change || 0,
      priceChangePercent: data.currentState?.changePercent || '0',
      dayRange: data.currentState?.ohlc ? 
        `${data.currentState.ohlc.low} - ${data.currentState.ohlc.high}` : 'N/A',
      
      // VOLUME DATA
      currentVolume: data.volumeAnalysis?.currentVolume || 0,
      volumeRatio: data.volumeAnalysis?.volumeRatio || '0',
      volumeSpike: data.volumeAnalysis?.volumeSpike || false,
      volumeCategory: data.volumeAnalysis?.volumeCategory || 'UNKNOWN',
      
      // ORDER BOOK DATA
      orderImbalance: data.volumeAnalysis?.orderImbalance || '0',
      buyPressure: data.volumeAnalysis?.buyPressure || 0,
      sellPressure: data.volumeAnalysis?.sellPressure || 0,
      bidAskSpread: data.orderBook?.spread || 0,
      
      // TECHNICAL INDICATORS
      sma20: data.technicalIndicators?.sma20 || 'N/A',
      sma50: data.technicalIndicators?.sma50 || 'N/A',
      rsi: data.technicalIndicators?.rsi || 'N/A',
      momentum: data.technicalIndicators?.momentum || 'N/A',
      
      // PRICE ACTION SEQUENCE (last 30 minutes)
      priceMovement: data.priceAction?.priceMovement || { trend: 'UNKNOWN' },
      volumePattern: data.priceAction?.volumePattern || { pattern: 'UNKNOWN' },
      recentCandles: this.summarizeRecentCandles(data.priceAction?.sequence || []),
      
      // PATTERN RECOGNITION
      trend: data.patterns?.trend || 'SIDEWAYS',
      breakoutPattern: data.patterns?.breakoutPattern || false,
      consolidationPattern: data.patterns?.consolidationPattern || false,
      
      // MARKET CONTEXT
      marketPhase: data.marketContext?.marketPhase || 'UNKNOWN',
      minutesFromOpen: data.marketContext?.minutesFromOpen || 0,
      isEarlySession: data.marketContext?.isEarlySession || false,
      isMidSession: data.marketContext?.isMidSession || false,
      isLateSession: data.marketContext?.isLateSession || false
    };
  }

  /**
   * 🧠 Get LLM prediction based on pure data
   */
  async getLLMPrediction(symbol, formattedData) {
    const systemPrompt = `You are an expert quantitative trading analyst specializing in Indian NSE stocks. 
You analyze ONLY the provided mathematical data and statistical patterns to predict short-term price movements.

ANALYSIS FRAMEWORK:
1. VOLUME ANALYSIS: Volume spikes (>2x average) indicate institutional interest
2. PRICE ACTION: Breakouts above resistance with volume = bullish signal
3. ORDER FLOW: Buy/sell imbalance >20% indicates directional pressure
4. TECHNICAL INDICATORS: RSI >70 = overbought, RSI <30 = oversold
5. MARKET TIMING: Early session breakouts (first 60 min) have higher success rate

PREDICTION RULES:
- BUY: Volume spike + price breakout + buy pressure + bullish momentum
- SELL: Volume spike + price breakdown + sell pressure + bearish momentum  
- HOLD: Insufficient confluence or conflicting signals

CONFIDENCE LEVELS:
- 85-95%: All factors align perfectly
- 70-84%: Strong confluence (3-4 factors)
- 50-69%: Moderate confluence (2-3 factors)
- <50%: Weak signals, recommend HOLD

TIMEFRAME: 5-30 minute predictions for Indian intraday trading

Respond with EXACT format:
SIGNAL: [BUY/SELL/HOLD]
CONFIDENCE: [percentage]
ENTRY_PRICE: [price]
STOP_LOSS: [price]
TARGET: [price]
TIMEFRAME: [5-30 minutes]
REASONING: [mathematical reasoning based on data patterns]`;

    const userPrompt = `Analyze this NSE stock data for ${symbol} and predict the next move:

CURRENT MARKET STATE:
- Price: ₹${formattedData.currentPrice}
- Price Change: ${formattedData.priceChange} (${formattedData.priceChangePercent}%)
- Day Range: ₹${formattedData.dayRange}

VOLUME ANALYSIS:
- Current Volume: ${formattedData.currentVolume.toLocaleString()}
- Volume Ratio: ${formattedData.volumeRatio}x average
- Volume Spike: ${formattedData.volumeSpike ? 'YES' : 'NO'}
- Volume Category: ${formattedData.volumeCategory}

ORDER FLOW:
- Order Imbalance: ${formattedData.orderImbalance}% (positive = buy pressure)
- Buy Pressure: ${formattedData.buyPressure.toLocaleString()}
- Sell Pressure: ${formattedData.sellPressure.toLocaleString()}
- Bid-Ask Spread: ₹${formattedData.bidAskSpread}

TECHNICAL INDICATORS:
- SMA 20: ₹${formattedData.sma20}
- SMA 50: ₹${formattedData.sma50}
- RSI (14): ${formattedData.rsi}
- Momentum: ${formattedData.momentum}

PRICE ACTION (Last 30 minutes):
- Trend: ${formattedData.trend}
- Breakout Pattern: ${formattedData.breakoutPattern ? 'DETECTED' : 'NONE'}
- Consolidation: ${formattedData.consolidationPattern ? 'YES' : 'NO'}
- Recent Candles: ${JSON.stringify(formattedData.recentCandles)}

MARKET CONTEXT:
- Market Phase: ${formattedData.marketPhase}
- Minutes from Open: ${formattedData.minutesFromOpen}
- Session Type: ${formattedData.isEarlySession ? 'EARLY' : formattedData.isMidSession ? 'MID' : 'LATE'}

Based on this mathematical data, what is your prediction?`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent analysis
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.log('❌ LLM API Error:', error.message);
      return null;
    }
  }

  /**
   * ✅ Validate and format LLM response
   */
  validatePrediction(llmResponse, marketData) {
    if (!llmResponse) {
      return this.getDefaultPrediction(marketData);
    }

    try {
      const lines = llmResponse.split('\n');
      const prediction = {
        symbol: marketData.symbol,
        timestamp: new Date().toLocaleString(),
        rawData: marketData
      };

      // Parse LLM response
      lines.forEach(line => {
        if (line.includes('SIGNAL:')) {
          prediction.signal = line.split(':')[1]?.trim() || 'HOLD';
        }
        if (line.includes('CONFIDENCE:')) {
          prediction.confidence = parseInt(line.split(':')[1]?.replace('%', '').trim()) || 50;
        }
        if (line.includes('ENTRY_PRICE:')) {
          prediction.entryPrice = parseFloat(line.split(':')[1]?.replace('₹', '').trim()) || marketData.currentState?.lastPrice || 0;
        }
        if (line.includes('STOP_LOSS:')) {
          prediction.stopLoss = parseFloat(line.split(':')[1]?.replace('₹', '').trim()) || 0;
        }
        if (line.includes('TARGET:')) {
          prediction.target = parseFloat(line.split(':')[1]?.replace('₹', '').trim()) || 0;
        }
        if (line.includes('TIMEFRAME:')) {
          prediction.timeframe = line.split(':')[1]?.trim() || '15 minutes';
        }
        if (line.includes('REASONING:')) {
          prediction.reasoning = line.split(':')[1]?.trim() || 'Mathematical analysis based on volume and price patterns';
        }
      });

      // Validate signal
      if (!['BUY', 'SELL', 'HOLD'].includes(prediction.signal)) {
        prediction.signal = 'HOLD';
        prediction.confidence = 30;
        prediction.reasoning = 'Invalid signal format, defaulting to HOLD';
      }

      // Ensure confidence is within range
      prediction.confidence = Math.max(0, Math.min(100, prediction.confidence || 50));

      // Set default values if missing
      if (!prediction.entryPrice) prediction.entryPrice = marketData.currentState?.lastPrice || 0;
      if (!prediction.stopLoss) prediction.stopLoss = this.calculateStopLoss(prediction.signal, prediction.entryPrice);
      if (!prediction.target) prediction.target = this.calculateTarget(prediction.signal, prediction.entryPrice);

      return prediction;
    } catch (error) {
      console.log('❌ Error parsing LLM response:', error.message);
      return this.getDefaultPrediction(marketData);
    }
  }

  /**
   * 📊 Helper functions
   */
  summarizeRecentCandles(sequence) {
    if (!sequence || sequence.length === 0) return {};
    
    const last5 = sequence.slice(-5);
    const bullishCandles = last5.filter(c => c.candleType === 'BULLISH').length;
    const bearishCandles = last5.filter(c => c.candleType === 'BEARISH').length;
    
    return {
      total: last5.length,
      bullish: bullishCandles,
      bearish: bearishCandles,
      pattern: bullishCandles > bearishCandles ? 'BULLISH_BIAS' : bearishCandles > bullishCandles ? 'BEARISH_BIAS' : 'NEUTRAL'
    };
  }

  calculateStopLoss(signal, entryPrice) {
    if (signal === 'BUY') return entryPrice * 0.985; // 1.5% stop loss
    if (signal === 'SELL') return entryPrice * 1.015; // 1.5% stop loss
    return entryPrice;
  }

  calculateTarget(signal, entryPrice) {
    if (signal === 'BUY') return entryPrice * 1.025; // 2.5% target
    if (signal === 'SELL') return entryPrice * 0.975; // 2.5% target
    return entryPrice;
  }

  getDefaultPrediction(marketData) {
    return {
      symbol: marketData.symbol,
      signal: 'HOLD',
      confidence: 30,
      entryPrice: marketData.currentState?.lastPrice || 0,
      stopLoss: marketData.currentState?.lastPrice || 0,
      target: marketData.currentState?.lastPrice || 0,
      timeframe: '15 minutes',
      reasoning: 'Insufficient data or parsing error - defaulting to HOLD',
      timestamp: new Date().toLocaleString()
    };
  }
}

module.exports = DataDrivenLLMPredictor;

// Test usage
if (require.main === module) {
  const predictor = new DataDrivenLLMPredictor();
  const symbol = process.argv[2] || 'RELIANCE';
  
  predictor.predictMarketMove(symbol)
    .then(prediction => {
      console.log('\n✅ PREDICTION COMPLETE');
    })
    .catch(console.error);
}