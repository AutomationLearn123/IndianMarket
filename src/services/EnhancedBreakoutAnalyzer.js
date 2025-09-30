/**
 * ENHANCED BREAKOUT STRATEGY ANALYZER
 * Implements sophisticated opening range & volume footprint analysis
 */

class EnhancedBreakoutAnalyzer {
  constructor() {
    this.marketOpenTime = '09:15:00'; // NSE market open
    this.firstThirtyMinEnd = '09:45:00'; // First 30 minutes
    this.tickHistory = new Map(); // Store tick history for each symbol
    this.imbalanceHistory = new Map(); // Track consecutive imbalances
    this.openingRanges = new Map(); // Store opening range data
  }

  /**
   * Check if current time is within first 30 minutes of market open
   */
  isWithinFirstThirtyMinutes() {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    const marketOpen = new Date(`${now.toDateString()} ${this.marketOpenTime}`);
    const firstThirtyEnd = new Date(`${now.toDateString()} ${this.firstThirtyMinEnd}`);
    
    return now >= marketOpen && now <= firstThirtyEnd;
  }

  /**
   * Calculate opening range (first 15 minutes high/low)
   */
  updateOpeningRange(symbol, tickData) {
    const now = new Date();
    const marketOpen = new Date(`${now.toDateString()} ${this.marketOpenTime}`);
    const openingRangeEnd = new Date(marketOpen.getTime() + 15 * 60 * 1000); // First 15 minutes
    
    if (now >= marketOpen && now <= openingRangeEnd) {
      if (!this.openingRanges.has(symbol)) {
        this.openingRanges.set(symbol, {
          high: tickData.ohlc.high,
          low: tickData.ohlc.low,
          open: tickData.ohlc.open,
          established: false
        });
      } else {
        const range = this.openingRanges.get(symbol);
        range.high = Math.max(range.high, tickData.last_price);
        range.low = Math.min(range.low, tickData.last_price);
      }
    } else if (now > openingRangeEnd) {
      // Mark opening range as established
      if (this.openingRanges.has(symbol)) {
        this.openingRanges.get(symbol).established = true;
      }
    }
  }

  /**
   * Check for 400%+ volume spike
   */
  checkVolumeSpike(symbol, currentVolume, averageVolume) {
    const volumeRatio = currentVolume / (averageVolume || 1000000);
    
    return {
      isSpike: volumeRatio >= 4.0, // 400% threshold
      ratio: volumeRatio,
      magnitude: volumeRatio >= 4.0 ? 'EXTREME' : 
                volumeRatio >= 3.0 ? 'HIGH' : 
                volumeRatio >= 2.0 ? 'MODERATE' : 'NORMAL'
    };
  }

  /**
   * Track consecutive order imbalances (stacked imbalance)
   */
  updateImbalanceHistory(symbol, buyQty, sellQty) {
    const imbalance = (buyQty - sellQty) / (buyQty + sellQty);
    const imbalanceDirection = imbalance > 0.2 ? 'BUY' : imbalance < -0.2 ? 'SELL' : 'NEUTRAL';
    
    if (!this.imbalanceHistory.has(symbol)) {
      this.imbalanceHistory.set(symbol, []);
    }
    
    const history = this.imbalanceHistory.get(symbol);
    history.push({
      imbalance,
      direction: imbalanceDirection,
      timestamp: new Date(),
      magnitude: Math.abs(imbalance)
    });
    
    // Keep only last 5 readings for stacked analysis
    if (history.length > 5) {
      history.shift();
    }
    
    return this.analyzeStackedImbalance(history);
  }

  /**
   * Analyze if there are 2-3 consecutive periods of similar imbalance
   */
  analyzeStackedImbalance(history) {
    if (history.length < 2) return { isStacked: false, strength: 0 };
    
    const lastThree = history.slice(-3);
    const buyCount = lastThree.filter(h => h.direction === 'BUY').length;
    const sellCount = lastThree.filter(h => h.direction === 'SELL').length;
    
    const isStacked = buyCount >= 2 || sellCount >= 2;
    const stackedDirection = buyCount >= 2 ? 'BUY' : sellCount >= 2 ? 'SELL' : 'NEUTRAL';
    const averageMagnitude = lastThree.reduce((sum, h) => sum + h.magnitude, 0) / lastThree.length;
    
    return {
      isStacked,
      direction: stackedDirection,
      strength: averageMagnitude,
      consecutive: Math.max(buyCount, sellCount),
      stackedCount: isStacked ? Math.max(buyCount, sellCount) : 0
    };
  }

  /**
   * Check opening range breakout
   */
  checkOpeningRangeBreakout(symbol, currentPrice) {
    const range = this.openingRanges.get(symbol);
    if (!range || !range.established) {
      return { isBreakout: false, direction: null, strength: 0 };
    }
    
    const rangeSize = range.high - range.low;
    const breakoutThreshold = rangeSize * 0.1; // 10% buffer
    
    let breakoutDirection = null;
    let strength = 0;
    
    if (currentPrice > range.high + breakoutThreshold) {
      breakoutDirection = 'BULLISH';
      strength = (currentPrice - range.high) / rangeSize;
    } else if (currentPrice < range.low - breakoutThreshold) {
      breakoutDirection = 'BEARISH';
      strength = (range.low - currentPrice) / rangeSize;
    }
    
    return {
      isBreakout: breakoutDirection !== null,
      direction: breakoutDirection,
      strength: Math.min(strength, 2.0), // Cap at 200%
      range: {
        high: range.high,
        low: range.low,
        size: rangeSize
      },
      currentPrice
    };
  }

  /**
   * Main enhanced breakout analysis
   */
  analyzeEnhancedBreakout(symbol, marketData) {
    // Update data structures
    this.updateOpeningRange(symbol, marketData);
    
    // 1. Check if within first 30 minutes
    const isFirstThirtyMin = this.isWithinFirstThirtyMinutes();
    
    // 2. Check 400% volume spike
    const volumeAnalysis = this.checkVolumeSpike(
      symbol, 
      marketData.volume, 
      marketData.averageVolume
    );
    
    // 3. Check stacked imbalance
    const stackedImbalance = this.updateImbalanceHistory(
      symbol,
      marketData.buy_quantity,
      marketData.sell_quantity
    );
    
    // 4. Check opening range breakout
    const rangeBreakout = this.checkOpeningRangeBreakout(symbol, marketData.last_price);
    
    // 5. Enhanced signal generation
    return this.generateEnhancedSignal(symbol, marketData, {
      isFirstThirtyMin,
      volumeAnalysis,
      stackedImbalance,
      rangeBreakout
    });
  }

  /**
   * Generate enhanced trading signal based on all factors
   */
  generateEnhancedSignal(symbol, marketData, analysis) {
    const { isFirstThirtyMin, volumeAnalysis, stackedImbalance, rangeBreakout } = analysis;
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reasoning = [];
    
    // PREMIUM BREAKOUT SIGNALS (High confidence)
    if (isFirstThirtyMin && volumeAnalysis.isSpike && stackedImbalance.isStacked && rangeBreakout.isBreakout) {
      action = rangeBreakout.direction === 'BULLISH' ? 'BUY' : 'SELL';
      confidence = 0.95;
      reasoning.push(`🔥 PREMIUM BREAKOUT: First 30min + ${volumeAnalysis.ratio.toFixed(1)}x volume + ${stackedImbalance.consecutive} stacked imbalances + range breakout`);
    }
    
    // STRONG VOLUME SPIKE SIGNALS (400%+ volume)
    else if (volumeAnalysis.isSpike && stackedImbalance.isStacked) {
      action = stackedImbalance.direction;
      confidence = 0.85;
      reasoning.push(`💥 VOLUME SPIKE: ${volumeAnalysis.ratio.toFixed(1)}x volume (${volumeAnalysis.magnitude}) + ${stackedImbalance.consecutive} stacked ${stackedImbalance.direction} imbalances`);
    }
    
    // OPENING RANGE BREAKOUT with volume confirmation
    else if (rangeBreakout.isBreakout && volumeAnalysis.ratio >= 2.0) {
      action = rangeBreakout.direction === 'BULLISH' ? 'BUY' : 'SELL';
      confidence = 0.80;
      reasoning.push(`📈 RANGE BREAKOUT: ${rangeBreakout.direction} breakout with ${volumeAnalysis.ratio.toFixed(1)}x volume`);
    }
    
    // FIRST 30 MINUTES MOMENTUM
    else if (isFirstThirtyMin && volumeAnalysis.ratio >= 3.0) {
      const priceChange = ((marketData.last_price - marketData.ohlc.close) / marketData.ohlc.close) * 100;
      action = priceChange > 0 ? 'BUY' : 'SELL';
      confidence = 0.75;
      reasoning.push(`⏰ OPENING MOMENTUM: First 30min with ${volumeAnalysis.ratio.toFixed(1)}x volume and ${Math.abs(priceChange).toFixed(2)}% move`);
    }
    
    const finalReasoning = reasoning.join(' | ') || 'No significant breakout patterns detected';
    
    return {
      symbol,
      action,
      confidence,
      reasoning: finalReasoning,
      entryPrice: marketData.last_price,
      stopLoss: this.calculateStopLoss(marketData.last_price, action, rangeBreakout),
      target: this.calculateTarget(marketData.last_price, action, rangeBreakout),
      timestamp: new Date().toISOString(),
      analysis: {
        isFirstThirtyMin,
        volumeSpike: volumeAnalysis,
        stackedImbalance,
        rangeBreakout,
        signalStrength: confidence > 0.8 ? 'STRONG' : confidence > 0.6 ? 'MODERATE' : 'WEAK'
      }
    };
  }

  calculateStopLoss(entryPrice, action, rangeBreakout) {
    if (rangeBreakout.isBreakout && rangeBreakout.range) {
      // Use opening range as stop loss reference
      return action === 'BUY' ? 
        Math.min(entryPrice * 0.985, rangeBreakout.range.low * 0.998) :
        Math.max(entryPrice * 1.015, rangeBreakout.range.high * 1.002);
    }
    
    // Default 1.5% stop loss
    return action === 'BUY' ? entryPrice * 0.985 : entryPrice * 1.015;
  }

  calculateTarget(entryPrice, action, rangeBreakout) {
    if (rangeBreakout.isBreakout && rangeBreakout.range) {
      // Use range size for target calculation
      const rangeSize = rangeBreakout.range.size;
      return action === 'BUY' ? 
        entryPrice + (rangeSize * 1.5) :
        entryPrice - (rangeSize * 1.5);
    }
    
    // Default 3% target
    return action === 'BUY' ? entryPrice * 1.03 : entryPrice * 0.97;
  }
}

module.exports = { EnhancedBreakoutAnalyzer };