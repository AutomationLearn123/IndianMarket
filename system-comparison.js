#!/usr/bin/env node

/**
 * 🆚 SYSTEM COMPARISON: Manual vs Data-Driven LLM Analysis
 * Compare old manual-based system with new pure data-driven approach
 */

const DataDrivenLLMPredictor = require('./data-driven-llm-predictor');
const PatternRecognitionEngine = require('./pattern-recognition-engine');
const { spawn } = require('child_process');

class SystemComparison {
  constructor() {
    this.dataPredictor = new DataDrivenLLMPredictor();
    this.patternEngine = new PatternRecognitionEngine();
  }

  async compareApproaches(symbol) {
    console.log(`🆚 SYSTEM COMPARISON: ${symbol}`);
    console.log('═'.repeat(60));
    
    const results = {
      symbol: symbol,
      timestamp: new Date().toLocaleString(),
      approaches: {}
    };

    // 1. OLD APPROACH: Manual-enhanced LLM
    console.log('\n📊 OLD APPROACH: Manual-Enhanced LLM Analysis');
    console.log('─'.repeat(50));
    results.approaches.manual = await this.runManualApproach(symbol);

    // 2. NEW APPROACH: Pure Data-Driven LLM
    console.log('\n🧠 NEW APPROACH: Pure Data-Driven LLM');
    console.log('─'.repeat(50));
    results.approaches.dataDriven = await this.runDataDrivenApproach(symbol);

    // 3. PATTERN RECOGNITION: Mathematical only
    console.log('\n🔍 PATTERN ANALYSIS: Mathematical Detection');
    console.log('─'.repeat(50));
    results.approaches.patterns = await this.runPatternAnalysis(symbol);

    // 4. COMPARISON SUMMARY
    console.log('\n🏆 COMPARISON SUMMARY');
    console.log('═'.repeat(60));
    this.displayComparison(results);

    return results;
  }

  async runManualApproach(symbol) {
    try {
      return new Promise((resolve) => {
        const process = spawn('node', ['analyze-full-llm.js', symbol], { 
          shell: true,
          stdio: 'pipe'
        });

        let output = '';
        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.on('close', () => {
          const signal = this.extractSignalFromOutput(output);
          console.log(`📈 Manual System: ${signal.signal} (${signal.confidence}%)`);
          console.log(`💡 Reasoning: ${signal.reasoning}`);
          resolve(signal);
        });
      });
    } catch (error) {
      console.log('❌ Manual approach failed:', error.message);
      return { signal: 'ERROR', confidence: 0, reasoning: 'System error' };
    }
  }

  async runDataDrivenApproach(symbol) {
    try {
      const prediction = await this.dataPredictor.predictMarketMove(symbol);
      console.log(`🧠 Data-Driven: ${prediction.signal} (${prediction.confidence}%)`);
      console.log(`📊 Data Reasoning: ${prediction.reasoning}`);
      return prediction;
    } catch (error) {
      console.log('❌ Data-driven approach failed:', error.message);
      return { signal: 'ERROR', confidence: 0, reasoning: 'System error' };
    }
  }

  async runPatternAnalysis(symbol) {
    try {
      const marketData = await this.dataPredictor.dataCollector.collectComprehensiveData(symbol);
      const patterns = this.patternEngine.analyzePatterns(marketData);
      
      console.log(`🔍 Pattern Recognition: ${patterns.signal} (Score: ${patterns.score})`);
      
      const detectedPatterns = Object.entries(patterns.patterns)
        .filter(([_, pattern]) => pattern.detected)
        .map(([name, pattern]) => `${name}: ${pattern.bias} (${pattern.strength}/10)`)
        .join(', ');
      
      console.log(`📋 Patterns: ${detectedPatterns || 'None detected'}`);
      
      return {
        signal: patterns.signal,
        score: patterns.score,
        patterns: detectedPatterns,
        confidence: Math.abs(patterns.score) * 5 // Convert score to confidence
      };
    } catch (error) {
      console.log('❌ Pattern analysis failed:', error.message);
      return { signal: 'ERROR', score: 0, patterns: 'None', confidence: 0 };
    }
  }

  displayComparison(results) {
    const manual = results.approaches.manual;
    const dataDriven = results.approaches.dataDriven;
    const patterns = results.approaches.patterns;

    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Approach        │ Signal      │ Confidence  │ Method      │');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────┤');
    console.log(`│ Manual LLM      │ ${manual.signal.padEnd(11)} │ ${String(manual.confidence + '%').padEnd(11)} │ Manual+AI   │`);
    console.log(`│ Data-Driven LLM │ ${dataDriven.signal.padEnd(11)} │ ${String(dataDriven.confidence + '%').padEnd(11)} │ Pure Data   │`);
    console.log(`│ Pattern Engine  │ ${patterns.signal.padEnd(11)} │ ${String(Math.round(patterns.confidence) + '%').padEnd(11)} │ Mathematical│`);
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────┘');

    // Consensus analysis
    const signals = [manual.signal, dataDriven.signal, patterns.signal];
    const consensus = this.findConsensus(signals);
    
    console.log(`\n🎯 CONSENSUS: ${consensus.result}`);
    console.log(`📊 Agreement: ${consensus.agreement}%`);
    
    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    if (consensus.agreement >= 66) {
      console.log(`✅ HIGH CONFIDENCE: ${consensus.result} - All systems agree`);
    } else if (consensus.agreement >= 33) {
      console.log(`⚠️  MODERATE CONFIDENCE: Consider ${consensus.result} with caution`);
    } else {
      console.log(`❌ LOW CONFIDENCE: Conflicting signals - HOLD or wait for clarity`);
    }

    // Which system performed best analysis
    console.log('\n🏆 ANALYSIS QUALITY:');
    console.log(`📈 Manual System: ${this.rateAnalysisQuality(manual)}/10 (Combines experience + AI)`);
    console.log(`🧠 Data-Driven: ${this.rateAnalysisQuality(dataDriven)}/10 (Pure mathematical patterns)`);
    console.log(`🔍 Pattern Engine: ${this.rateAnalysisQuality(patterns)}/10 (Statistical detection)`);
  }

  findConsensus(signals) {
    const buySignals = signals.filter(s => s.includes('BUY')).length;
    const sellSignals = signals.filter(s => s.includes('SELL')).length;
    const holdSignals = signals.filter(s => s.includes('HOLD')).length;

    let result = 'HOLD';
    let agreement = 0;

    if (buySignals >= 2) {
      result = 'BUY';
      agreement = (buySignals / signals.length) * 100;
    } else if (sellSignals >= 2) {
      result = 'SELL';
      agreement = (sellSignals / signals.length) * 100;
    } else {
      agreement = (holdSignals / signals.length) * 100;
    }

    return { result, agreement: Math.round(agreement) };
  }

  rateAnalysisQuality(result) {
    let score = 5; // Base score
    
    if (result.confidence > 80) score += 3;
    else if (result.confidence > 60) score += 2;
    else if (result.confidence > 40) score += 1;
    
    if (result.reasoning && result.reasoning.length > 50) score += 1;
    if (result.signal !== 'ERROR' && result.signal !== 'HOLD') score += 1;
    
    return Math.min(10, score);
  }

  extractSignalFromOutput(output) {
    const lines = output.split('\n');
    let signal = 'UNKNOWN';
    let confidence = 50;
    let reasoning = 'Unable to parse output';

    // More comprehensive parsing
    lines.forEach(line => {
      // Signal detection - multiple patterns
      if (line.includes('SIGNAL:') || line.includes('Signal:') || line.includes('🎯 Signal:')) {
        const match = line.match(/(BUY|SELL|HOLD)/i);
        if (match) signal = match[1].toUpperCase();
      }
      
      // Confidence detection - multiple patterns
      if (line.includes('Confidence:') || line.includes('CONFIDENCE:') || line.includes('📈 Confidence:')) {
        const match = line.match(/(\d+)%/);
        if (match) confidence = parseInt(match[1]);
      }
      
      // Alternative confidence patterns
      if (line.includes('confidence') && line.match(/(\d+)%/)) {
        const match = line.match(/(\d+)%/);
        if (match) confidence = parseInt(match[1]);
      }
      
      // Reasoning detection - multiple patterns
      if (line.includes('Reasoning:') || line.includes('REASONING:') || line.includes('🧠 Reasoning:')) {
        reasoning = line.split(':')[1]?.trim() || reasoning;
      }
      
      // Alternative reasoning patterns
      if (line.includes('reasoning') || line.includes('because') || line.includes('due to')) {
        if (line.length > 50) { // Only capture substantial reasoning
          reasoning = line.trim();
        }
      }
    });

    // Fallback: try to extract any BUY/SELL/HOLD from the entire output
    if (signal === 'UNKNOWN') {
      const buyCount = (output.match(/BUY/gi) || []).length;
      const sellCount = (output.match(/SELL/gi) || []).length;
      const holdCount = (output.match(/HOLD/gi) || []).length;
      
      if (buyCount > sellCount && buyCount > holdCount) signal = 'BUY';
      else if (sellCount > buyCount && sellCount > holdCount) signal = 'SELL';
      else if (holdCount > 0) signal = 'HOLD';
    }

    // Extract confidence from any percentage in output if not found
    if (confidence === 50) {
      const percentages = output.match(/(\d+)%/g);
      if (percentages && percentages.length > 0) {
        const nums = percentages.map(p => parseInt(p.replace('%', '')));
        const validConfidences = nums.filter(n => n >= 30 && n <= 100);
        if (validConfidences.length > 0) {
          confidence = validConfidences[0]; // Take first valid confidence
        }
      }
    }

    return { signal, confidence, reasoning };
  }
}

// Run comparison
if (require.main === module) {
  const comparison = new SystemComparison();
  const symbol = process.argv[2] || 'ICICIBANK';
  
  comparison.compareApproaches(symbol)
    .then(results => {
      console.log('\n✅ COMPARISON COMPLETE');
      
      // Optionally save results to file
      const fs = require('fs');
      fs.writeFileSync('system-comparison.json', JSON.stringify(results, null, 2));
      console.log('📁 Results saved to system-comparison.json');
    })
    .catch(console.error);
}

module.exports = SystemComparison;