#!/usr/bin/env node

/**
 * SIMPLE COMMAND LINE MANUAL ANALYSIS
 * Usage: node analyze.js RELIANCE TCS INFY
 */

console.log('🎯 Indian Market Manual Analysis Tool');
console.log('📊 Every 5-Minute Candle Analyzer\n');

// Get stock symbols from command line arguments
const symbols = process.argv.slice(2);

if (symbols.length === 0) {
  console.log('❌ No stock symbols provided');
  console.log('📝 Usage: node analyze.js RELIANCE TCS INFY');
  console.log('📝 Example: node analyze.js RELIANCE');
  process.exit(1);
}

console.log(`🔍 Analyzing: ${symbols.join(', ')}`);
console.log('⏰ Analysis Time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('═'.repeat(80));

// Mock Every 5-Minute Candle Analysis (simulating your exact requirements)
function analyzeEvery5MinuteCandle(symbol) {
  console.log(`\n📈 ${symbol} - Every 5-Minute Candle Analysis (Post 9:45 AM)`);
  console.log('─'.repeat(50));
  
  // Simulate analysis of multiple 5-minute candles
  const candlesAnalyzed = Math.floor(Math.random() * 5) + 3; // 3-7 candles
  let bestCandle = null;
  let bestScore = 0;
  
  for (let i = 0; i < candlesAnalyzed; i++) {
    const time = `${9 + Math.floor(i/12)}:${45 + (i * 5) % 60}`;
    const breakout = Math.random() > 0.6;
    const volume400Plus = Math.random() > 0.7;
    const stackedImbalances = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 2 : 0;
    
    const score = (breakout ? 3 : 0) + (volume400Plus ? 3 : 0) + (stackedImbalances >= 2 ? 2 : 0);
    
    console.log(`   ${time} | Breakout: ${breakout ? '✅' : '❌'} | Volume: ${volume400Plus ? '✅ 400%+' : '❌ Normal'} | Imbalances: ${stackedImbalances >= 2 ? `✅ ${stackedImbalances} stacked` : '❌ None'}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestCandle = {
        time,
        breakout,
        volume400Plus,
        stackedImbalances,
        score
      };
    }
  }
  
  // Generate signal based on best candle
  let signal = 'NO GOOD';
  let confidence = 50;
  
  if (bestCandle && bestCandle.breakout && bestCandle.volume400Plus && bestCandle.stackedImbalances >= 2) {
    signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
    confidence = 85 + Math.random() * 10;
  } else if (bestCandle && bestCandle.score >= 4) {
    signal = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'NO GOOD';
    confidence = 70 + Math.random() * 15;
  }
  
  console.log('\n🎯 ANALYSIS RESULT:');
  console.log(`   Signal: ${signal}`);
  console.log(`   Confidence: ${Math.round(confidence)}%`);
  console.log(`   Best Candle: ${bestCandle ? bestCandle.time : 'None'}`);
  console.log(`   Current Price: ₹${symbol === 'RELIANCE' ? '1368.60' : (1000 + Math.random() * 500).toFixed(2)}`);
  
  if (bestCandle) {
    console.log(`   Analysis: ${bestCandle.breakout ? 'Opening range breakout detected' : 'No clear breakout'}, ${bestCandle.volume400Plus ? '400%+ volume spike' : 'normal volume'}, ${bestCandle.stackedImbalances >= 2 ? `${bestCandle.stackedImbalances} stacked imbalances` : 'no significant imbalances'}`);
  }
  
  return {
    symbol,
    signal,
    confidence: Math.round(confidence),
    bestCandle,
    candlesAnalyzed
  };
}

// Analyze all symbols
const results = [];
symbols.forEach(symbol => {
  const result = analyzeEvery5MinuteCandle(symbol.toUpperCase());
  results.push(result);
});

// Summary
console.log('\n' + '═'.repeat(80));
console.log('📊 SUMMARY');
console.log('═'.repeat(80));

const buySignals = results.filter(r => r.signal === 'BUY').length;
const sellSignals = results.filter(r => r.signal === 'SELL').length;
const noGoodSignals = results.filter(r => r.signal === 'NO GOOD').length;

console.log(`🟢 BUY Signals: ${buySignals}`);
console.log(`🔴 SELL Signals: ${sellSignals}`);
console.log(`⚫ NO GOOD: ${noGoodSignals}`);

if (buySignals > 0) {
  console.log('\n🟢 BUY RECOMMENDATIONS:');
  results.filter(r => r.signal === 'BUY').forEach(r => {
    console.log(`   ${r.symbol} - ${r.confidence}% confidence (Best: ${r.bestCandle.time})`);
  });
}

if (sellSignals > 0) {
  console.log('\n🔴 SELL RECOMMENDATIONS:');
  results.filter(r => r.signal === 'SELL').forEach(r => {
    console.log(`   ${r.symbol} - ${r.confidence}% confidence (Best: ${r.bestCandle.time})`);
  });
}

console.log('\n✅ Analysis Complete!');
console.log('📝 Note: This is mock analysis for testing. Real system requires Kite Connect authentication for live data.');