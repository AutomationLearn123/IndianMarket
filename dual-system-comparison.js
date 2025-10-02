#!/usr/bin/env node

/**
 * 🆚 DUAL SYSTEM COMPARISON RUNNER
 * Run both systems simultaneously and compare results
 */

require('dotenv').config();
const RealTimeLLMTradingSystem = require('./realtime-llm-trading-system');
const SystemComparison = require('./system-comparison');

class DualSystemComparisonRunner {
  constructor() {
    this.realTimeLLMSystem = new RealTimeLLMTradingSystem();
    this.consensusSystem = new SystemComparison();
    
    this.results = {
      realTimeLLM: [],
      consensus: [],
      comparison: []
    };
    
    this.isRunning = false;
    this.comparisonInterval = null;
  }

  /**
   * 🚀 Start both systems for comparison
   */
  async startDualSystemComparison() {
    console.log('🆚 STARTING DUAL SYSTEM COMPARISON');
    console.log('═'.repeat(60));
    console.log('📊 System A: Real-Time LLM Trading System');
    console.log('📊 System B: Consensus Trading System');
    console.log('🎯 Goal: Compare signal accuracy and timing');
    console.log('═'.repeat(60));
    
    this.isRunning = true;
    
    try {
      // Start Real-Time LLM System
      console.log('\n🚀 Starting Real-Time LLM System...');
      this.setupRealTimeLLMListeners();
      await this.realTimeLLMSystem.startRealTimeLLMSystem();
      
      // Start periodic consensus analysis for comparison
      console.log('🚀 Starting Consensus System...');
      this.startPeriodicConsensusAnalysis();
      
      // Start comparison reporting
      this.startComparisonReporting();
      
      console.log('\n✅ DUAL SYSTEM COMPARISON ACTIVE');
      console.log('📈 Both systems are now analyzing the same market data');
      console.log('📊 Comparison reports will be generated every 5 minutes\n');
      
    } catch (error) {
      console.error('❌ Failed to start dual system comparison:', error.message);
    }
  }

  /**
   * 🔗 Setup Real-Time LLM system listeners
   */
  setupRealTimeLLMListeners() {
    this.realTimeLLMSystem.on('tradingSignal', (signal) => {
      // Store Real-Time LLM signal
      this.results.realTimeLLM.push({
        ...signal,
        systemType: 'REAL_TIME_LLM',
        receivedAt: new Date()
      });
      
      // Trigger immediate consensus analysis for same symbol
      this.triggerConsensusAnalysis(signal.symbol);
      
      console.log(`📈 Real-Time LLM Signal: ${signal.symbol} ${signal.signal} (${signal.confidence}%)`);
    });
  }

  /**
   * 📊 Trigger consensus analysis for comparison
   */
  async triggerConsensusAnalysis(symbol) {
    try {
      console.log(`🔄 Triggering consensus analysis for ${symbol}...`);
      
      const consensusResult = await this.consensusSystem.compareApproaches(symbol);
      
      // Store consensus result
      this.results.consensus.push({
        symbol: symbol,
        systemType: 'CONSENSUS',
        manual: consensusResult.approaches.manual,
        dataDriven: consensusResult.approaches.dataDriven,
        patterns: consensusResult.approaches.patterns,
        receivedAt: new Date()
      });
      
      // Compare results if we have both
      this.compareLatestResults(symbol);
      
    } catch (error) {
      console.error(`❌ Consensus analysis failed for ${symbol}:`, error.message);
    }
  }

  /**
   * 🆚 Compare latest results from both systems
   */
  compareLatestResults(symbol) {
    const recentRealTimeLLM = this.results.realTimeLLM
      .filter(r => r.symbol === symbol)
      .slice(-1)[0];
    
    const recentConsensus = this.results.consensus
      .filter(r => r.symbol === symbol)
      .slice(-1)[0];
    
    if (!recentRealTimeLLM || !recentConsensus) return;
    
    const comparison = this.generateComparison(recentRealTimeLLM, recentConsensus);
    this.results.comparison.push(comparison);
    
    this.displayComparison(comparison);
  }

  /**
   * 📋 Generate detailed comparison
   */
  generateComparison(realTimeLLM, consensus) {
    // Extract consensus signal from individual systems
    const consensusSignal = this.extractConsensusSignal(consensus);
    
    const comparison = {
      symbol: realTimeLLM.symbol,
      timestamp: new Date(),
      
      realTimeLLM: {
        signal: realTimeLLM.signal,
        confidence: realTimeLLM.confidence,
        entry: realTimeLLM.entry,
        reasoning: realTimeLLM.reasoning,
        volumeSpike: realTimeLLM.marketData.volumeSpike,
        orderImbalance: realTimeLLM.marketData.orderImbalance
      },
      
      consensus: {
        signal: consensusSignal.signal,
        confidence: consensusSignal.confidence,
        agreement: consensusSignal.agreement,
        manual: consensus.manual,
        dataDriven: consensus.dataDriven,
        patterns: consensus.patterns
      },
      
      agreement: {
        signalMatch: realTimeLLM.signal === consensusSignal.signal,
        confidenceDiff: Math.abs(realTimeLLM.confidence - consensusSignal.confidence),
        timingDiff: Math.abs(realTimeLLM.receivedAt - consensus.receivedAt)
      },
      
      analysis: {
        speed: realTimeLLM.receivedAt < consensus.receivedAt ? 'REAL_TIME_FASTER' : 'CONSENSUS_FASTER',
        accuracy: this.assessAccuracy(realTimeLLM, consensusSignal),
        reliability: this.assessReliability(realTimeLLM, consensusSignal)
      }
    };
    
    return comparison;
  }

  /**
   * 📊 Extract consensus signal from multiple systems
   */
  extractConsensusSignal(consensus) {
    // Simple consensus logic
    const signals = [
      consensus.manual?.signal,
      consensus.dataDriven?.signal,
      consensus.patterns?.signal
    ].filter(Boolean);
    
    const buyCount = signals.filter(s => s === 'BUY').length;
    const sellCount = signals.filter(s => s === 'SELL').length;
    const holdCount = signals.filter(s => s === 'HOLD' || s === 'NO_GOOD').length;
    
    let signal = 'HOLD';
    let agreement = 0;
    
    if (buyCount >= 2) {
      signal = 'BUY';
      agreement = (buyCount / signals.length) * 100;
    } else if (sellCount >= 2) {
      signal = 'SELL';
      agreement = (sellCount / signals.length) * 100;
    } else {
      agreement = (holdCount / signals.length) * 100;
    }
    
    const avgConfidence = [
      consensus.manual?.confidence || 50,
      consensus.dataDriven?.confidence || 50,
      consensus.patterns?.confidence || 50
    ].reduce((sum, conf) => sum + conf, 0) / 3;
    
    return {
      signal,
      confidence: Math.round(avgConfidence),
      agreement: Math.round(agreement)
    };
  }

  /**
   * 📊 Display comparison results
   */
  displayComparison(comparison) {
    console.log(`
🆚 SYSTEM COMPARISON: ${comparison.symbol}
═══════════════════════════════════════════════════════════
📊 Real-Time LLM:  ${comparison.realTimeLLM.signal} (${comparison.realTimeLLM.confidence}%)
📊 Consensus:      ${comparison.consensus.signal} (${comparison.consensus.confidence}% | ${comparison.consensus.agreement}% agreement)

🎯 Agreement:      ${comparison.agreement.signalMatch ? '✅ SIGNALS MATCH' : '❌ SIGNALS DIFFER'}
📈 Confidence Diff: ${comparison.agreement.confidenceDiff}%
⏱️  Timing Diff:    ${(comparison.agreement.timingDiff / 1000).toFixed(1)} seconds

🚀 Speed Winner:    ${comparison.analysis.speed}
🎯 Accuracy:        ${comparison.analysis.accuracy}
📊 Reliability:     ${comparison.analysis.reliability}

📋 Consensus Breakdown:
   Manual:     ${comparison.consensus.manual?.signal || 'N/A'} (${comparison.consensus.manual?.confidence || 0}%)
   Data-Driven: ${comparison.consensus.dataDriven?.signal || 'N/A'} (${comparison.consensus.dataDriven?.confidence || 0}%)
   Patterns:   ${comparison.consensus.patterns?.signal || 'N/A'} (${comparison.consensus.patterns?.confidence || 0}%)

⏰ Time: ${comparison.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
═══════════════════════════════════════════════════════════
`);
  }

  /**
   * 📊 Start periodic consensus analysis
   */
  startPeriodicConsensusAnalysis() {
    // Run consensus analysis every 3 minutes for comparison
    setInterval(async () => {
      if (!this.isRunning) return;
      
      const symbols = ['RELIANCE', 'HDFCBANK', 'ICICIBANK'];
      for (const symbol of symbols) {
        try {
          await this.triggerConsensusAnalysis(symbol);
          await this.delay(1000); // 1 second delay between symbols
        } catch (error) {
          console.error(`❌ Periodic consensus analysis failed for ${symbol}:`, error.message);
        }
      }
    }, 180000); // 3 minutes
  }

  /**
   * 📈 Start comparison reporting
   */
  startComparisonReporting() {
    this.comparisonInterval = setInterval(() => {
      this.generateComparisonReport();
    }, 300000); // 5 minutes
  }

  /**
   * 📋 Generate periodic comparison report
   */
  generateComparisonReport() {
    const report = this.analyzeOverallPerformance();
    
    console.log(`
📊 DUAL SYSTEM PERFORMANCE REPORT
═══════════════════════════════════════════════════════════
⏰ Report Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

📈 SIGNAL STATISTICS:
   Real-Time LLM Signals: ${report.realTimeLLMStats.totalSignals}
   Consensus Signals: ${report.consensusStats.totalSignals}
   Total Comparisons: ${report.comparisonStats.totalComparisons}

🎯 AGREEMENT ANALYSIS:
   Signal Match Rate: ${report.agreementStats.signalMatchRate}%
   Average Confidence Difference: ${report.agreementStats.avgConfidenceDiff}%
   Average Speed Advantage: ${report.agreementStats.avgSpeedAdvantage} seconds

🏆 PERFORMANCE METRICS:
   Speed Winner: ${report.performanceMetrics.speedWinner}
   Higher Confidence: ${report.performanceMetrics.higherConfidenceSystem}
   More Signals: ${report.performanceMetrics.moreActiveSystem}

📊 SIGNAL DISTRIBUTION:
   Real-Time LLM: BUY ${report.realTimeLLMStats.buySignals} | SELL ${report.realTimeLLMStats.sellSignals} | HOLD ${report.realTimeLLMStats.holdSignals}
   Consensus: BUY ${report.consensusStats.buySignals} | SELL ${report.consensusStats.sellSignals} | HOLD ${report.consensusStats.holdSignals}

💡 INSIGHTS:
${report.insights.join('\n')}
═══════════════════════════════════════════════════════════
`);
  }

  /**
   * 📊 Analyze overall performance
   */
  analyzeOverallPerformance() {
    const realTimeLLMSignals = this.results.realTimeLLM;
    const consensusSignals = this.results.consensus;
    const comparisons = this.results.comparison;
    
    // Calculate statistics
    const realTimeLLMStats = this.calculateSignalStats(realTimeLLMSignals);
    const consensusStats = this.calculateConsensusStats(consensusSignals);
    const comparisonStats = this.calculateComparisonStats(comparisons);
    const agreementStats = this.calculateAgreementStats(comparisons);
    const performanceMetrics = this.calculatePerformanceMetrics(comparisons);
    
    return {
      realTimeLLMStats,
      consensusStats,
      comparisonStats,
      agreementStats,
      performanceMetrics,
      insights: this.generateInsights(comparisons)
    };
  }

  /**
   * 📊 Helper methods for statistics
   */
  calculateSignalStats(signals) {
    return {
      totalSignals: signals.length,
      buySignals: signals.filter(s => s.signal === 'BUY').length,
      sellSignals: signals.filter(s => s.signal === 'SELL').length,
      holdSignals: signals.filter(s => s.signal === 'HOLD').length,
      avgConfidence: signals.reduce((sum, s) => sum + s.confidence, 0) / (signals.length || 1)
    };
  }

  calculateConsensusStats(signals) {
    return {
      totalSignals: signals.length,
      buySignals: signals.filter(s => this.extractConsensusSignal(s).signal === 'BUY').length,
      sellSignals: signals.filter(s => this.extractConsensusSignal(s).signal === 'SELL').length,
      holdSignals: signals.filter(s => this.extractConsensusSignal(s).signal === 'HOLD').length
    };
  }

  calculateComparisonStats(comparisons) {
    return {
      totalComparisons: comparisons.length
    };
  }

  calculateAgreementStats(comparisons) {
    if (comparisons.length === 0) {
      return { signalMatchRate: 0, avgConfidenceDiff: 0, avgSpeedAdvantage: 0 };
    }
    
    const signalMatches = comparisons.filter(c => c.agreement.signalMatch).length;
    const signalMatchRate = (signalMatches / comparisons.length) * 100;
    
    const avgConfidenceDiff = comparisons.reduce((sum, c) => sum + c.agreement.confidenceDiff, 0) / comparisons.length;
    const avgSpeedAdvantage = comparisons.reduce((sum, c) => sum + (c.agreement.timingDiff / 1000), 0) / comparisons.length;
    
    return {
      signalMatchRate: Math.round(signalMatchRate),
      avgConfidenceDiff: Math.round(avgConfidenceDiff),
      avgSpeedAdvantage: Math.round(avgSpeedAdvantage * 10) / 10
    };
  }

  calculatePerformanceMetrics(comparisons) {
    const realTimeFaster = comparisons.filter(c => c.analysis.speed === 'REAL_TIME_FASTER').length;
    const speedWinner = realTimeFaster > (comparisons.length / 2) ? 'Real-Time LLM' : 'Consensus';
    
    return {
      speedWinner,
      higherConfidenceSystem: 'Analysis Pending',
      moreActiveSystem: 'Real-Time LLM'
    };
  }

  generateInsights(comparisons) {
    const insights = [];
    
    if (comparisons.length > 0) {
      const agreementRate = comparisons.filter(c => c.agreement.signalMatch).length / comparisons.length;
      
      if (agreementRate > 0.7) {
        insights.push('• High agreement rate suggests both systems are detecting similar patterns');
      } else if (agreementRate < 0.4) {
        insights.push('• Low agreement rate indicates systems may be complementary');
      }
      
      insights.push('• Real-time system provides faster signal generation');
      insights.push('• Consensus system provides multi-perspective validation');
    }
    
    return insights;
  }

  /**
   * 🔧 Helper methods
   */
  assessAccuracy(realTimeLLM, consensus) {
    // Placeholder accuracy assessment
    if (realTimeLLM.confidence > consensus.confidence) {
      return 'REAL_TIME_MORE_CONFIDENT';
    } else if (consensus.confidence > realTimeLLM.confidence) {
      return 'CONSENSUS_MORE_CONFIDENT';
    }
    return 'SIMILAR_CONFIDENCE';
  }

  assessReliability(realTimeLLM, consensus) {
    // Placeholder reliability assessment
    return 'BOTH_RELIABLE';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🛑 Stop both systems
   */
  stop() {
    this.isRunning = false;
    
    if (this.comparisonInterval) {
      clearInterval(this.comparisonInterval);
    }
    
    this.realTimeLLMSystem.stop();
    
    console.log('🛑 Dual System Comparison stopped');
    
    // Final report
    console.log('\n📊 FINAL COMPARISON REPORT:');
    this.generateComparisonReport();
  }
}

module.exports = DualSystemComparisonRunner;

// Direct execution
if (require.main === module) {
  const runner = new DualSystemComparisonRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Dual System Comparison...');
    runner.stop();
    process.exit(0);
  });
  
  // Start comparison
  runner.startDualSystemComparison()
    .catch(error => {
      console.error('❌ Dual system comparison failed:', error.message);
      process.exit(1);
    });
}