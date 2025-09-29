/**
 * 🤖 LLM TRADING ANALYZER SERVICE
 * OpenAI-powered trading signal generation with sophisticated analysis
 */

const OpenAI = require('openai');
const config = require('../config');

class LLMTradingAnalyzer {
  constructor() {
    this.openai = null;
    this.isInitialized = false;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    if (config.openai.apiKey && config.openai.apiKey !== 'your_openai_api_key_here') {
      try {
        this.openai = new OpenAI({
          apiKey: config.openai.apiKey,
        });
        this.isInitialized = true;
        console.log('✅ LLM Trading Analyzer initialized with OpenAI');
      } catch (error) {
        console.log('❌ OpenAI initialization failed:', error.message);
        this.openai = null;
        this.isInitialized = false;
      }
    } else {
      console.log('⚠️ OpenAI not configured - will use algorithmic analysis');
      this.isInitialized = false;
    }
  }

  async generateTradingSignal(symbol, marketData) {
    if (!this.isInitialized || !this.openai) {
      return this.generateAlgorithmicSignal(symbol, marketData);
    }

    try {
      const prompt = this.createAnalysisPrompt(symbol, marketData);
      
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert Indian stock market analyst specializing in NSE equities. Analyze real-time market data and provide clear BUY/SELL/HOLD recommendations with specific entry/exit points.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });

      const analysis = response.choices[0].message.content;
      return this.parseAIResponse(symbol, marketData, analysis || '');
    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error.message);
      return this.generateAlgorithmicSignal(symbol, marketData);
    }
  }

  createAnalysisPrompt(symbol, data) {
    const volumeRatio = data.volume / (data.averageVolume || 1000000);
    const priceChangePercent = ((data.last_price - data.ohlc.close) / data.ohlc.close) * 100;
    const orderImbalance = (data.buy_quantity - data.sell_quantity) / (data.buy_quantity + data.sell_quantity) * 100;
    
    return `Analyze ${symbol} for trading signal:

CURRENT DATA:
- Price: ₹${data.last_price}
- Change: ${priceChangePercent.toFixed(2)}%
- Volume: ${data.volume.toLocaleString()}
- Volume Ratio: ${volumeRatio.toFixed(2)}x
- OHLC: O:${data.ohlc.open} H:${data.ohlc.high} L:${data.ohlc.low} C:${data.ohlc.close}
- Buy Quantity: ${data.buy_quantity}
- Sell Quantity: ${data.sell_quantity}
- Order Imbalance: ${orderImbalance.toFixed(1)}%

ANALYSIS REQUIREMENTS:
1. **Action**: BUY/SELL/HOLD
2. **Confidence**: 0.1-1.0 (based on signal strength)
3. **Entry Price**: Specific price level
4. **Stop Loss**: Risk management level
5. **Target**: Profit target
6. **Reasoning**: Clear explanation focusing on volume footprint, price action, order book imbalance

Respond in JSON format:
{
  "action": "BUY/SELL/HOLD",
  "confidence": 0.85,
  "entryPrice": 2450.50,
  "stopLoss": 2401.49,
  "target": 2548.52,
  "reasoning": "Clear explanation"
}`;
  }

  parseAIResponse(symbol, marketData, analysis) {
    try {
      // Extract JSON from response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          symbol: symbol,
          action: parsed.action || 'HOLD',
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0.1), 1.0),
          reasoning: parsed.reasoning || 'AI analysis completed',
          entryPrice: parsed.entryPrice || marketData.last_price,
          stopLoss: parsed.stopLoss || marketData.last_price * (1 - config.trading.defaultStopLossPercent / 100),
          target: parsed.target || marketData.last_price * (1 + config.trading.defaultTargetPercent / 100),
          riskRewardRatio: this.calculateRiskReward(parsed.entryPrice, parsed.stopLoss, parsed.target),
          timestamp: new Date().toISOString(),
          analysisType: 'openai_llm',
          marketData: this.formatMarketData(marketData)
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
    }

    return this.generateAlgorithmicSignal(symbol, marketData);
  }

  generateAlgorithmicSignal(symbol, marketData) {
    const volumeRatio = marketData.volume / (marketData.averageVolume || 1000000);
    const priceChange = ((marketData.last_price - marketData.ohlc.close) / marketData.ohlc.close) * 100;
    const orderImbalance = (marketData.buy_quantity - marketData.sell_quantity) / (marketData.buy_quantity + marketData.sell_quantity);

    let action = 'HOLD';
    let confidence = 0.5;
    let reasoning = 'Neutral market conditions - no clear directional bias';

    // Volume breakout strategy using config parameters
    const volumeThreshold = config.trading.volumeThresholdMultiplier;
    const priceThreshold = config.trading.priceChangeThreshold;
    const imbalanceThreshold = config.trading.orderImbalanceThreshold;

    if (volumeRatio > volumeThreshold && priceChange > priceThreshold && orderImbalance > imbalanceThreshold) {
      action = 'BUY';
      confidence = 0.85;
      reasoning = `Strong bullish breakout: ${priceChange.toFixed(2)}% gain with ${volumeRatio.toFixed(1)}x volume and ${(orderImbalance * 100).toFixed(1)}% buy imbalance`;
    } else if (volumeRatio > volumeThreshold && priceChange < -priceThreshold && orderImbalance < -imbalanceThreshold) {
      action = 'SELL';
      confidence = 0.80;
      reasoning = `Bearish breakdown: ${Math.abs(priceChange).toFixed(2)}% decline with ${volumeRatio.toFixed(1)}x volume and strong sell pressure`;
    } else if (volumeRatio > 1.5 && Math.abs(priceChange) > 0.8) {
      action = priceChange > 0 ? 'BUY' : 'SELL';
      confidence = 0.65;
      reasoning = `Moderate ${action.toLowerCase()} signal: ${Math.abs(priceChange).toFixed(2)}% move with above-average volume`;
    }

    const entryPrice = marketData.last_price;
    const stopLossPercent = config.trading.defaultStopLossPercent / 100;
    const targetPercent = config.trading.defaultTargetPercent / 100;
    
    const stopLoss = action === 'BUY' ? entryPrice * (1 - stopLossPercent) : entryPrice * (1 + stopLossPercent);
    const target = action === 'BUY' ? entryPrice * (1 + targetPercent) : entryPrice * (1 - targetPercent);

    return {
      symbol,
      action,
      confidence,
      reasoning,
      entryPrice,
      stopLoss,
      target,
      riskRewardRatio: this.calculateRiskReward(entryPrice, stopLoss, target),
      timestamp: new Date().toISOString(),
      analysisType: 'algorithmic',
      marketData: this.formatMarketData(marketData)
    };
  }

  formatMarketData(marketData) {
    const volumeRatio = marketData.volume / (marketData.averageVolume || 1000000);
    const priceChange = ((marketData.last_price - marketData.ohlc.close) / marketData.ohlc.close) * 100;

    return {
      currentPrice: marketData.last_price,
      volume: marketData.volume,
      volumeRatio,
      priceChange,
      ohlc: marketData.ohlc,
      buyQuantity: marketData.buy_quantity,
      sellQuantity: marketData.sell_quantity,
      orderImbalance: (marketData.buy_quantity - marketData.sell_quantity) / (marketData.buy_quantity + marketData.sell_quantity)
    };
  }

  calculateRiskReward(entry, stopLoss, target) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : 2.0;
  }

  isReady() {
    return this.isInitialized;
  }

  getAnalysisType() {
    return this.isInitialized ? 'openai_llm' : 'algorithmic';
  }
}

module.exports = LLMTradingAnalyzer;
