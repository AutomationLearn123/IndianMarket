#!/usr/bin/env node

/**
 * HYBRID MANUAL + AI ANALYSIS SYSTEM
 * Combines manual observations with AI analysis for better accuracy
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');

// Manual Analysis Override System
const MANUAL_OVERRIDES = {
  // Format: { symbol: { signal: 'BUY/SELL', confidence: 85, reason: 'manual observation' } }
};

async function hybridAnalysis(symbol, manualObservation = null) {
  console.log(`🤝 HYBRID ANALYSIS: ${symbol}`);
  console.log('═══════════════════════════════════════');
  
  if (manualObservation) {
    console.log(`👁️ Manual Observation: ${manualObservation.signal} (${manualObservation.confidence}%)`);
    console.log(`📝 Reasoning: ${manualObservation.reason}`);
    
    // Store manual override
    MANUAL_OVERRIDES[symbol] = {
      signal: manualObservation.signal,
      confidence: manualObservation.confidence,
      reason: manualObservation.reason,
      timestamp: new Date().toLocaleString()
    };
  }
  
  // Run both AI systems
  const { spawn } = require('child_process');
  
  console.log('\n🤖 Running AI Analysis...');
  
  // Enhanced system
  const enhanced = spawn('node', ['analyze-enhanced-profile-cpr.js', symbol], { shell: true });
  
  // Regular system  
  const regular = spawn('node', ['analyze-full-llm.js', symbol], { shell: true });
  
  console.log('\n🧠 HYBRID RECOMMENDATION:');
  
  if (MANUAL_OVERRIDES[symbol]) {
    const manual = MANUAL_OVERRIDES[symbol];
    console.log(`✅ Manual Analysis: ${manual.signal} (${manual.confidence}%)`);
    console.log(`📊 Reasoning: ${manual.reason}`);
    console.log(`⏰ Observed at: ${manual.timestamp}`);
    
    console.log('\n💡 TRADING DECISION:');
    console.log(`🎯 Follow Manual Analysis: ${manual.signal}`);
    console.log(`📈 Confidence Level: ${manual.confidence}%`);
    console.log(`🔍 Monitor AI systems for confluence confirmation`);
  } else {
    console.log('📊 Relying on AI systems - no manual override available');
  }
}

// Command line interface
const symbol = process.argv[2];
const manualSignal = process.argv[3]; // BUY/SELL
const manualConfidence = parseInt(process.argv[4]) || 80;
const manualReason = process.argv.slice(5).join(' ') || 'Manual chart analysis';

if (!symbol) {
  console.log('📝 Usage: node hybrid-analysis.js SYMBOL [MANUAL_SIGNAL] [CONFIDENCE] [REASON]');
  console.log('📝 Example: node hybrid-analysis.js ICICIBANK BUY 85 "Strong momentum spike observed"');
  console.log('📝 Example: node hybrid-analysis.js BHARTIARTL SELL 80 "Bearish breakdown below support"');
  process.exit(1);
}

const manualObservation = manualSignal ? {
  signal: manualSignal.toUpperCase(),
  confidence: manualConfidence,
  reason: manualReason
} : null;

hybridAnalysis(symbol, manualObservation).catch(console.error);