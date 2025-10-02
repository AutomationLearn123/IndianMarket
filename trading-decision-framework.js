#!/usr/bin/env node

/**
 * 📈 PRACTICAL TRADING DECISION FRAMEWORK
 * How to use the consensus system for actual trading
 */

class TradingDecisionFramework {
  constructor() {
    this.riskRules = {
      HIGH_CONFIDENCE: { minAgreement: 67, maxRisk: 1.5 },
      MODERATE_CONFIDENCE: { minAgreement: 34, maxRisk: 1.0 },
      LOW_CONFIDENCE: { minAgreement: 0, maxRisk: 0.5 }
    };
  }

  /**
   * 🎯 Main decision function
   */
  makeTradingDecision(comparisonResult) {
    console.log(`📈 TRADING DECISION ANALYSIS: ${comparisonResult.symbol}`);
    console.log('═'.repeat(60));
    
    const decision = this.analyzeConsensus(comparisonResult);
    const riskManagement = this.calculateRiskManagement(decision, comparisonResult);
    const timing = this.assessTiming(comparisonResult);
    
    console.log('\n🎯 FINAL TRADING DECISION:');
    console.log('═'.repeat(40));
    console.log(`📊 Action: ${decision.action}`);
    console.log(`📈 Confidence: ${decision.confidence}%`);
    console.log(`💰 Position Size: ${riskManagement.positionSize}% of capital`);
    console.log(`🛑 Stop Loss: ₹${riskManagement.stopLoss}`);
    console.log(`🎯 Target: ₹${riskManagement.target}`);
    console.log(`⏰ Entry Timing: ${timing.recommendation}`);
    console.log(`🧠 Reasoning: ${decision.reasoning}`);
    
    return {
      symbol: comparisonResult.symbol,
      action: decision.action,
      confidence: decision.confidence,
      positionSize: riskManagement.positionSize,
      stopLoss: riskManagement.stopLoss,
      target: riskManagement.target,
      timing: timing.recommendation,
      reasoning: decision.reasoning
    };
  }

  /**
   * 🧮 Analyze consensus from multiple systems
   */
  analyzeConsensus(result) {
    const approaches = result.approaches;
    const signals = [
      approaches.manual?.signal,
      approaches.dataDriven?.signal,
      approaches.patterns?.signal
    ].filter(Boolean);

    // Count signal types
    const buyCount = signals.filter(s => s.includes('BUY')).length;
    const sellCount = signals.filter(s => s.includes('SELL')).length;
    const holdCount = signals.filter(s => s.includes('HOLD') || s === 'NEUTRAL').length;

    // Calculate agreement
    const totalSystems = signals.length;
    let action = 'HOLD';
    let agreement = 0;

    if (buyCount >= 2) {
      action = 'BUY';
      agreement = (buyCount / totalSystems) * 100;
    } else if (sellCount >= 2) {
      action = 'SELL';
      agreement = (sellCount / totalSystems) * 100;
    } else {
      action = 'HOLD';
      agreement = Math.max(buyCount, sellCount, holdCount) / totalSystems * 100;
    }

    // Average confidence from systems that agree
    const agreementSystems = signals.filter(s => s.includes(action) || (action === 'HOLD' && (s.includes('HOLD') || s === 'NEUTRAL')));
    const avgConfidence = this.calculateAverageConfidence(approaches, agreementSystems);

    let reasoning = '';
    if (agreement >= 67) {
      reasoning = `Strong consensus: ${Math.round(agreement)}% of systems agree on ${action}`;
    } else if (agreement >= 34) {
      reasoning = `Moderate consensus: ${Math.round(agreement)}% agreement, proceed with caution`;
    } else {
      reasoning = `Weak consensus: Conflicting signals, recommend HOLD or wait`;
    }

    return {
      action: agreement >= 34 ? action : 'HOLD',
      confidence: Math.round(agreement),
      agreement: Math.round(agreement),
      reasoning: reasoning
    };
  }

  /**
   * 💰 Calculate risk management parameters
   */
  calculateRiskManagement(decision, result) {
    const currentPrice = this.getCurrentPrice(result);
    let positionSize = 0;
    let stopLoss = currentPrice;
    let target = currentPrice;

    // Position sizing based on confidence
    if (decision.confidence >= 70) {
      positionSize = 1.5; // High confidence
    } else if (decision.confidence >= 50) {
      positionSize = 1.0; // Moderate confidence
    } else {
      positionSize = 0.5; // Low confidence
    }

    // Stop loss and target based on action
    if (decision.action === 'BUY') {
      stopLoss = currentPrice * 0.985; // 1.5% stop loss
      target = currentPrice * 1.025;   // 2.5% target
    } else if (decision.action === 'SELL') {
      stopLoss = currentPrice * 1.015; // 1.5% stop loss
      target = currentPrice * 0.975;   // 2.5% target
    }

    return {
      positionSize: positionSize,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target: Math.round(target * 100) / 100,
      riskReward: decision.action === 'HOLD' ? 0 : 1.67 // 2.5% target / 1.5% stop = 1.67
    };
  }

  /**
   * ⏰ Assess entry timing
   */
  assessTiming(result) {
    const now = new Date();
    const marketOpen = new Date(now.toDateString() + ' 09:15:00');
    const marketClose = new Date(now.toDateString() + ' 15:30:00');
    
    const minutesFromOpen = (now - marketOpen) / (1000 * 60);
    const minutesToClose = (marketClose - now) / (1000 * 60);

    let recommendation = 'WAIT';
    let reason = '';

    if (minutesFromOpen < 0) {
      recommendation = 'WAIT';
      reason = 'Market not yet open';
    } else if (minutesFromOpen < 30) {
      recommendation = 'GOOD';
      reason = 'Early session - good for breakout trades';
    } else if (minutesFromOpen < 120) {
      recommendation = 'EXCELLENT';
      reason = 'Prime trading hours - high liquidity';
    } else if (minutesToClose > 60) {
      recommendation = 'GOOD';
      reason = 'Mid-session - trend following';
    } else if (minutesToClose > 30) {
      recommendation = 'CAUTION';
      reason = 'Late session - reduced liquidity';
    } else {
      recommendation = 'AVOID';
      reason = 'Too close to market close';
    }

    return {
      recommendation: recommendation,
      reason: reason,
      minutesFromOpen: Math.max(0, minutesFromOpen),
      minutesToClose: Math.max(0, minutesToClose)
    };
  }

  /**
   * 🔢 Helper functions
   */
  getCurrentPrice(result) {
    return result.approaches.dataDriven?.rawData?.currentState?.lastPrice || 
           result.approaches.dataDriven?.entryPrice || 
           0;
  }

  calculateAverageConfidence(approaches, agreementSystems) {
    const confidences = [];
    
    if (approaches.manual?.confidence) confidences.push(approaches.manual.confidence);
    if (approaches.dataDriven?.confidence) confidences.push(approaches.dataDriven.confidence);
    if (approaches.patterns?.confidence) confidences.push(approaches.patterns.confidence);
    
    return confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 50;
  }

  /**
   * 📊 Print detailed analysis
   */
  printDetailedAnalysis(result) {
    console.log('\n📊 DETAILED SYSTEM ANALYSIS:');
    console.log('═'.repeat(50));
    
    if (result.approaches.manual) {
      console.log(`🧠 Manual System: ${result.approaches.manual.signal} (${result.approaches.manual.confidence}%)`);
      console.log(`   Reasoning: ${result.approaches.manual.reasoning}`);
    }
    
    if (result.approaches.dataDriven) {
      console.log(`🤖 Data-Driven: ${result.approaches.dataDriven.signal} (${result.approaches.dataDriven.confidence}%)`);
      console.log(`   Analysis: ${result.approaches.dataDriven.reasoning?.substring(0, 100)}...`);
    }
    
    if (result.approaches.patterns) {
      console.log(`🔍 Pattern Engine: ${result.approaches.patterns.signal} (${Math.round(result.approaches.patterns.confidence)}%)`);
      console.log(`   Patterns: ${result.approaches.patterns.patterns}`);
    }
  }
}

// Example usage for HDFCBANK case
function demonstrateHDFCBANKCase() {
  console.log('📈 HDFCBANK CASE STUDY: When Data-Driven Says HOLD but Consensus is BUY');
  console.log('═'.repeat(70));
  
  const framework = new TradingDecisionFramework();
  
  // Mock the HDFCBANK result structure
  const hdfcResult = {
    symbol: 'HDFCBANK',
    approaches: {
      manual: { signal: 'BUY', confidence: 70, reasoning: 'Manual analysis detected bullish pattern' },
      dataDriven: { 
        signal: 'HOLD', 
        confidence: 50, 
        reasoning: 'Insufficient confluence - volume spike but low order imbalance',
        entryPrice: 964.5
      },
      patterns: { 
        signal: 'BUY', 
        confidence: 55, 
        patterns: 'Volume spike, consolidation pattern detected'
      }
    }
  };
  
  framework.printDetailedAnalysis(hdfcResult);
  const decision = framework.makeTradingDecision(hdfcResult);
  
  console.log('\n💡 KEY INSIGHTS:');
  console.log('─'.repeat(40));
  console.log('• Data-driven system is CONSERVATIVE by design');
  console.log('• Manual system caught the pattern your eye sees');
  console.log('• Pattern engine confirmed mathematical signals');
  console.log('• Consensus resolves conflicts intelligently');
  console.log('• Risk is managed through position sizing');
  
  return decision;
}

module.exports = TradingDecisionFramework;

// Run demonstration
if (require.main === module) {
  demonstrateHDFCBANKCase();
}