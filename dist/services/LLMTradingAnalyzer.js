"use strict";
/**
 * LLM Trading Signal Generator
 * Processes market data and generates trading signals using OpenAI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmAnalyzer = exports.LLMTradingAnalyzer = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized with API key');
}
else {
    console.log('⚠️  OpenAI API key not found - LLM features will use mock responses');
}
class LLMTradingAnalyzer {
    async generateTradingSignal(marketData) {
        try {
            // If OpenAI is not available, return a mock signal
            if (!openai) {
                return this.generateMockSignal(marketData);
            }
            const prompt = this.buildAnalysisPrompt(marketData);
            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert Indian stock market trader specializing in NSE equities with deep knowledge of:
            - Volume footprint analysis and order flow
            - Intraday trading strategies
            - Risk management and position sizing
            - Technical analysis and chart patterns
            - Indian market dynamics and sector rotations
            
            Always provide specific, actionable trading recommendations with clear risk parameters.
            Focus on volume-based breakout strategies with 400%+ volume spikes.
            Consider market phase (pre-market, regular, post-market) in your analysis.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });
            const analysis = response.choices[0]?.message?.content || '';
            return this.parseSignalFromAnalysis(analysis, marketData);
        }
        catch (error) {
            console.error('❌ LLM Analysis failed:', error);
            return this.getDefaultSignal(marketData);
        }
    }
    buildAnalysisPrompt(data) {
        const recentCandles = data.historicalData.slice(-10);
        return `
**TRADING ANALYSIS REQUEST**

**Stock:** ${data.symbol} (NSE)
**Current Price:** ₹${data.currentPrice}
**Current Volume:** ${data.volume.toLocaleString()}
**Market Phase:** ${data.marketContext.marketPhase}
**Trading Hours:** ${data.marketContext.tradingHours ? 'OPEN' : 'CLOSED'}

**RECENT PRICE ACTION (Last 10 Candles):**
${recentCandles.map((candle, i) => `${i + 1}. OHLC: ${candle[1]}/${candle[2]}/${candle[3]}/${candle[4]} | Vol: ${candle[5].toLocaleString()}`).join('\n')}

**VOLUME ANALYSIS:**
- Current Volume: ${data.volume.toLocaleString()}
- Average Volume: ${data.volumeFootprint?.avgVolume?.toLocaleString() || 'N/A'}
- Volume Ratio: ${data.volumeFootprint?.volumeRatio?.toFixed(2) || 'N/A'}x
- Volume Spike: ${data.volumeFootprint?.volumeRatio > 4 ? '🚀 YES (400%+)' : '❌ NO'}

**ANALYSIS REQUIRED:**
1. Identify the current trend and momentum
2. Analyze volume footprint for breakout signals
3. Assess risk-reward ratio for potential trades
4. Consider market phase impact on the trade
5. Provide specific entry, stop-loss, and target levels

**OUTPUT FORMAT (JSON):**
{
  "action": "BUY|SELL|HOLD|NO_TRADE",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "entryPrice": number,
  "stopLoss": number,
  "target": number,
  "riskReward": "ratio like 1:2"
}

**RULES:**
- Only recommend BUY/SELL if confidence > 0.7
- Ensure stop-loss is always set (max 2% risk)
- Target should provide minimum 1:2 risk-reward
- Consider volume breakout (400%+ volume spike) as key signal
- Account for Indian market volatility and gap risks
`;
    }
    parseSignalFromAnalysis(analysis, marketData) {
        try {
            // Try to extract JSON from the analysis
            const jsonMatch = analysis.match(/\{[\s\S]*\}/);
            let signalData = {};
            if (jsonMatch) {
                signalData = JSON.parse(jsonMatch[0]);
            }
            // Extract key information with fallbacks
            const action = this.extractAction(analysis, signalData.action);
            const confidence = this.extractConfidence(analysis, signalData.confidence);
            const entryPrice = signalData.entryPrice || marketData.currentPrice;
            const stopLoss = signalData.stopLoss || this.calculateStopLoss(entryPrice, action);
            const target = signalData.target || this.calculateTarget(entryPrice, stopLoss, action);
            return {
                symbol: marketData.symbol,
                action,
                confidence,
                reasoning: signalData.reasoning || analysis.substring(0, 500),
                entryPrice,
                stopLoss,
                target,
                riskRewardRatio: this.calculateRiskReward(entryPrice, stopLoss, target),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('❌ Failed to parse LLM response:', error);
            return this.getDefaultSignal(marketData);
        }
    }
    extractAction(analysis, jsonAction) {
        if (jsonAction)
            return jsonAction;
        const upperAnalysis = analysis.toUpperCase();
        if (upperAnalysis.includes('BUY') && !upperAnalysis.includes("DON'T BUY"))
            return 'BUY';
        if (upperAnalysis.includes('SELL') && !upperAnalysis.includes("DON'T SELL"))
            return 'SELL';
        if (upperAnalysis.includes('HOLD'))
            return 'HOLD';
        return 'NO_TRADE';
    }
    extractConfidence(analysis, jsonConfidence) {
        if (jsonConfidence !== undefined)
            return Math.max(0, Math.min(1, jsonConfidence));
        // Look for confidence indicators in text
        const confidenceMatch = analysis.match(/confidence[:\s]*(\d+(?:\.\d+)?)/i);
        if (confidenceMatch) {
            const conf = parseFloat(confidenceMatch[1]);
            return conf > 1 ? conf / 100 : conf; // Handle both 0.8 and 80 formats
        }
        return 0.5; // Default moderate confidence
    }
    calculateStopLoss(entryPrice, action) {
        const riskPercent = 0.02; // 2% risk
        if (action === 'BUY') {
            return entryPrice * (1 - riskPercent);
        }
        else if (action === 'SELL') {
            return entryPrice * (1 + riskPercent);
        }
        return entryPrice;
    }
    calculateTarget(entryPrice, stopLoss, action) {
        const riskAmount = Math.abs(entryPrice - stopLoss);
        const rewardMultiplier = 2; // 1:2 risk-reward
        if (action === 'BUY') {
            return entryPrice + (riskAmount * rewardMultiplier);
        }
        else if (action === 'SELL') {
            return entryPrice - (riskAmount * rewardMultiplier);
        }
        return entryPrice;
    }
    calculateRiskReward(entryPrice, stopLoss, target) {
        const risk = Math.abs(entryPrice - stopLoss);
        const reward = Math.abs(target - entryPrice);
        return reward / risk;
    }
    getDefaultSignal(marketData) {
        return {
            symbol: marketData.symbol,
            action: 'NO_TRADE',
            confidence: 0,
            reasoning: 'Unable to generate trading signal due to analysis error',
            entryPrice: marketData.currentPrice,
            stopLoss: marketData.currentPrice * 0.98,
            target: marketData.currentPrice * 1.04,
            riskRewardRatio: 2,
            timestamp: new Date().toISOString()
        };
    }
    generateMockSignal(marketData) {
        // Simple volume-based mock signal
        const volumeRatio = marketData.volumeFootprint?.volumeRatio || 1;
        const priceChange = marketData.historicalData.length > 0 ?
            (marketData.currentPrice - marketData.historicalData[marketData.historicalData.length - 1]?.close || marketData.currentPrice) / marketData.currentPrice : 0;
        let action = 'HOLD';
        let confidence = 0.3;
        let reasoning = 'Mock signal based on volume analysis';
        if (volumeRatio > 4 && priceChange > 0.01) {
            action = 'BUY';
            confidence = 0.7;
            reasoning = `Strong volume breakout (${volumeRatio.toFixed(2)}x) with positive price momentum`;
        }
        else if (volumeRatio > 4 && priceChange < -0.01) {
            action = 'SELL';
            confidence = 0.7;
            reasoning = `Strong volume spike (${volumeRatio.toFixed(2)}x) with negative price momentum`;
        }
        else if (volumeRatio < 0.5) {
            action = 'NO_TRADE';
            confidence = 0.1;
            reasoning = 'Low volume conditions - avoid trading';
        }
        return {
            symbol: marketData.symbol,
            action,
            confidence,
            reasoning,
            entryPrice: marketData.currentPrice,
            stopLoss: marketData.currentPrice * (action === 'BUY' ? 0.98 : 1.02),
            target: marketData.currentPrice * (action === 'BUY' ? 1.04 : 0.96),
            riskRewardRatio: 2,
            timestamp: new Date().toISOString()
        };
    }
}
exports.LLMTradingAnalyzer = LLMTradingAnalyzer;
exports.llmAnalyzer = new LLMTradingAnalyzer();
//# sourceMappingURL=LLMTradingAnalyzer.js.map