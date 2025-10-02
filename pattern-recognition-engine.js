#!/usr/bin/env node

/**
 * 🔍 MATHEMATICAL PATTERN RECOGNITION ENGINE
 * Identifies trading patterns from pure data without manual interpretation
 */

class PatternRecognitionEngine {
  constructor() {
    this.patterns = {
      // Volume patterns
      VOLUME_SPIKE: this.detectVolumeSpike.bind(this),
      VOLUME_DIVERGENCE: this.detectVolumeDivergence.bind(this),
      
      // Price patterns
      BREAKOUT: this.detectBreakout.bind(this),
      BREAKDOWN: this.detectBreakdown.bind(this),
      CONSOLIDATION: this.detectConsolidation.bind(this),
      
      // Technical patterns
      MOMENTUM_SHIFT: this.detectMomentumShift.bind(this),
      TREND_REVERSAL: this.detectTrendReversal.bind(this),
      SQUEEZE: this.detectSqueeze.bind(this),
      
      // Order flow patterns
      IMBALANCE: this.detectOrderImbalance.bind(this),
      ABSORPTION: this.detectAbsorption.bind(this)
    };
  }

  /**
   * 🎯 Main pattern analysis function
   */
  analyzePatterns(marketData) {
    const results = {
      timestamp: new Date(),
      symbol: marketData.symbol,
      patterns: {},
      score: 0,
      signal: 'NEUTRAL'
    };

    let bullishScore = 0;
    let bearishScore = 0;

    // Run all pattern detectors
    for (const [patternName, detector] of Object.entries(this.patterns)) {
      try {
        const pattern = detector(marketData);
        results.patterns[patternName] = pattern;
        
        if (pattern.detected) {
          if (pattern.bias === 'BULLISH') bullishScore += pattern.strength;
          if (pattern.bias === 'BEARISH') bearishScore += pattern.strength;
          
          console.log(`🔍 ${patternName}: ${pattern.bias} (${pattern.strength}/10)`);
        }
      } catch (error) {
        console.log(`❌ Error detecting ${patternName}:`, error.message);
      }
    }

    // Calculate overall signal
    results.score = bullishScore - bearishScore;
    if (results.score > 15) results.signal = 'STRONG_BUY';
    else if (results.score > 5) results.signal = 'BUY';
    else if (results.score < -15) results.signal = 'STRONG_SELL';
    else if (results.score < -5) results.signal = 'SELL';

    return results;
  }

  /**
   * 📊 VOLUME PATTERNS
   */
  
  detectVolumeSpike(data) {
    const current = data.volumeAnalysis;
    if (!current) return { detected: false };

    const ratio = parseFloat(current.volumeRatio);
    
    if (ratio >= 3.0) {
      return {
        detected: true,
        bias: 'BULLISH',
        strength: Math.min(10, ratio * 2),
        description: `Massive volume spike: ${ratio}x average`,
        confidence: 90
      };
    } else if (ratio >= 2.0) {
      return {
        detected: true,
        bias: 'BULLISH',
        strength: Math.min(8, ratio * 1.5),
        description: `Strong volume spike: ${ratio}x average`,
        confidence: 75
      };
    }

    return { detected: false };
  }

  detectVolumeDivergence(data) {
    const priceAction = data.priceAction;
    if (!priceAction?.sequence || priceAction.sequence.length < 5) {
      return { detected: false };
    }

    const recent = priceAction.sequence.slice(-5);
    const priceUp = recent[recent.length - 1].close > recent[0].close;
    const volumeUp = recent[recent.length - 1].volume > recent[0].volume;

    if (priceUp && !volumeUp) {
      return {
        detected: true,
        bias: 'BEARISH',
        strength: 6,
        description: 'Price up but volume declining - potential reversal',
        confidence: 70
      };
    } else if (!priceUp && volumeUp) {
      return {
        detected: true,
        bias: 'BULLISH',
        strength: 7,
        description: 'Price down but volume increasing - potential reversal',
        confidence: 75
      };
    }

    return { detected: false };
  }

  /**
   * 📈 PRICE PATTERNS
   */
  
  detectBreakout(data) {
    const current = data.currentState;
    const priceAction = data.priceAction;
    
    if (!current || !priceAction?.sequence) return { detected: false };

    const recentCandles = priceAction.sequence.slice(-10);
    if (recentCandles.length < 5) return { detected: false };

    // Find resistance level (recent highs)
    const highs = recentCandles.map(c => c.high);
    const resistance = Math.max(...highs.slice(0, -2)); // Exclude last 2 candles
    
    const currentPrice = current.lastPrice;
    const volume = data.volumeAnalysis;

    // Breakout conditions
    if (currentPrice > resistance && volume?.volumeRatio > 1.5) {
      const strength = Math.min(10, (currentPrice - resistance) / resistance * 100 * 10);
      return {
        detected: true,
        bias: 'BULLISH',
        strength: strength,
        description: `Breakout above ₹${resistance.toFixed(2)} with volume`,
        confidence: 85
      };
    }

    return { detected: false };
  }

  detectBreakdown(data) {
    const current = data.currentState;
    const priceAction = data.priceAction;
    
    if (!current || !priceAction?.sequence) return { detected: false };

    const recentCandles = priceAction.sequence.slice(-10);
    if (recentCandles.length < 5) return { detected: false };

    // Find support level (recent lows)
    const lows = recentCandles.map(c => c.low);
    const support = Math.min(...lows.slice(0, -2)); // Exclude last 2 candles
    
    const currentPrice = current.lastPrice;
    const volume = data.volumeAnalysis;

    // Breakdown conditions
    if (currentPrice < support && volume?.volumeRatio > 1.5) {
      const strength = Math.min(10, (support - currentPrice) / support * 100 * 10);
      return {
        detected: true,
        bias: 'BEARISH',
        strength: strength,
        description: `Breakdown below ₹${support.toFixed(2)} with volume`,
        confidence: 85
      };
    }

    return { detected: false };
  }

  detectConsolidation(data) {
    const priceAction = data.priceAction;
    if (!priceAction?.sequence || priceAction.sequence.length < 10) {
      return { detected: false };
    }

    const recent = priceAction.sequence.slice(-10);
    const prices = recent.map(c => c.close);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = (high - low) / low * 100;

    // Tight consolidation (less than 2% range)
    if (range < 2.0) {
      return {
        detected: true,
        bias: 'NEUTRAL',
        strength: 5,
        description: `Tight consolidation: ${range.toFixed(2)}% range`,
        confidence: 80
      };
    }

    return { detected: false };
  }

  /**
   * 📊 TECHNICAL PATTERNS
   */
  
  detectMomentumShift(data) {
    const technical = data.technicalIndicators;
    if (!technical) return { detected: false };

    const rsi = parseFloat(technical.rsi);
    if (isNaN(rsi)) return { detected: false };

    if (rsi > 70) {
      return {
        detected: true,
        bias: 'BEARISH',
        strength: Math.min(10, (rsi - 70) / 5),
        description: `Overbought RSI: ${rsi}`,
        confidence: 75
      };
    } else if (rsi < 30) {
      return {
        detected: true,
        bias: 'BULLISH',
        strength: Math.min(10, (30 - rsi) / 5),
        description: `Oversold RSI: ${rsi}`,
        confidence: 75
      };
    }

    return { detected: false };
  }

  detectTrendReversal(data) {
    const priceAction = data.priceAction;
    if (!priceAction?.sequence || priceAction.sequence.length < 5) {
      return { detected: false };
    }

    const recent = priceAction.sequence.slice(-5);
    
    // Calculate short-term trend
    const firstClose = recent[0].close;
    const lastClose = recent[recent.length - 1].close;
    const trendDirection = lastClose > firstClose ? 'UP' : 'DOWN';
    
    // Look for reversal candles
    const lastCandle = recent[recent.length - 1];
    const reversalPattern = this.isReversalCandle(lastCandle, trendDirection);

    if (reversalPattern.detected) {
      return {
        detected: true,
        bias: reversalPattern.bias,
        strength: 7,
        description: `Trend reversal: ${reversalPattern.pattern}`,
        confidence: 70
      };
    }

    return { detected: false };
  }

  detectSqueeze(data) {
    const priceAction = data.priceAction;
    const volume = data.volumeAnalysis;
    
    if (!priceAction?.sequence || !volume) return { detected: false };

    const recent = priceAction.sequence.slice(-5);
    const avgRange = recent.reduce((sum, c) => sum + c.range, 0) / recent.length;
    const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
    
    const currentVolume = parseFloat(volume.volumeRatio) * avgVolume;
    
    // Low volatility + increasing volume = potential squeeze
    if (avgRange < 5 && currentVolume > avgVolume * 1.5) {
      return {
        detected: true,
        bias: 'NEUTRAL',
        strength: 8,
        description: 'Volatility squeeze with volume increase',
        confidence: 80
      };
    }

    return { detected: false };
  }

  /**
   * 📋 ORDER FLOW PATTERNS
   */
  
  detectOrderImbalance(data) {
    const volume = data.volumeAnalysis;
    if (!volume) return { detected: false };

    const imbalance = parseFloat(volume.orderImbalance);
    if (isNaN(imbalance)) return { detected: false };

    if (Math.abs(imbalance) > 20) {
      return {
        detected: true,
        bias: imbalance > 0 ? 'BULLISH' : 'BEARISH',
        strength: Math.min(10, Math.abs(imbalance) / 10),
        description: `Order imbalance: ${imbalance}%`,
        confidence: 85
      };
    }

    return { detected: false };
  }

  detectAbsorption(data) {
    const orderBook = data.orderBook;
    if (!orderBook) return { detected: false };

    const bidAskRatio = orderBook.bidAskRatio || 1;
    const spread = orderBook.spread || 0;

    // High volume with tight spread suggests absorption
    if (bidAskRatio > 2.0 && spread < 1.0) {
      return {
        detected: true,
        bias: 'BULLISH',
        strength: 6,
        description: `Volume absorption: ${bidAskRatio.toFixed(2)} bid/ask ratio`,
        confidence: 70
      };
    } else if (bidAskRatio < 0.5 && spread < 1.0) {
      return {
        detected: true,
        bias: 'BEARISH',
        strength: 6,
        description: `Volume absorption: ${bidAskRatio.toFixed(2)} bid/ask ratio`,
        confidence: 70
      };
    }

    return { detected: false };
  }

  /**
   * 🕯️ Helper functions
   */
  
  isReversalCandle(candle, trend) {
    const bodySize = Math.abs(candle.close - candle.open);
    const wickSize = candle.upperWick + candle.lowerWick;
    
    // Hammer/Hanging Man
    if (candle.lowerWick > bodySize * 2 && candle.upperWick < bodySize) {
      return {
        detected: true,
        pattern: 'HAMMER',
        bias: trend === 'DOWN' ? 'BULLISH' : 'BEARISH'
      };
    }
    
    // Shooting Star/Inverted Hammer
    if (candle.upperWick > bodySize * 2 && candle.lowerWick < bodySize) {
      return {
        detected: true,
        pattern: 'SHOOTING_STAR',
        bias: trend === 'UP' ? 'BEARISH' : 'BULLISH'
      };
    }

    return { detected: false };
  }
}

module.exports = PatternRecognitionEngine;

// Test usage
if (require.main === module) {
  const ComprehensiveDataCollector = require('./comprehensive-data-collector');
  const engine = new PatternRecognitionEngine();
  const collector = new ComprehensiveDataCollector();
  
  const symbol = process.argv[2] || 'RELIANCE';
  
  collector.collectComprehensiveData(symbol)
    .then(data => {
      console.log(`🔍 PATTERN ANALYSIS: ${symbol}`);
      console.log('═'.repeat(50));
      
      const patterns = engine.analyzePatterns(data);
      
      console.log(`\n🎯 OVERALL SIGNAL: ${patterns.signal}`);
      console.log(`📊 Score: ${patterns.score}`);
      console.log('\n📋 DETECTED PATTERNS:');
      
      Object.entries(patterns.patterns).forEach(([name, pattern]) => {
        if (pattern.detected) {
          console.log(`  ✅ ${name}: ${pattern.description}`);
        }
      });
    })
    .catch(console.error);
}