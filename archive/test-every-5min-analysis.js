/**
 * TEST YOUR EXACT REQUIREMENT
 * "after 9:45, we need to check whether the breakout happens on every 5 mins candle 
 * after 9:45 and analyse that 5 mins candle for 400% imbalance with 2 or 3 stacked imbalance"
 */

const { Every5MinuteCandleAnalyzer } = require('./src/services/Every5MinuteCandleAnalyzer');

// Mock Kite Connect for testing
const mockKiteConnect = {
  async getInstruments(exchange) {
    return [
      {
        tradingsymbol: 'RELIANCE',
        instrument_token: '738561',
        instrument_type: 'EQ'
      }
    ];
  },

  async getHistoricalData(token, interval, from, to) {
    // Mock 5-minute candles from 9:45 AM onwards
    console.log(`📊 Mock: Getting ${interval} data from ${from} to ${to}`);
    
    // Simulate 6 five-minute candles (9:45, 9:50, 9:55, 10:00, 10:05, 10:10)
    return [
      ['2024-12-30 09:45:00', 2450.0, 2455.0, 2448.0, 2453.0, 150000],  // Normal volume
      ['2024-12-30 09:50:00', 2453.0, 2465.0, 2452.0, 2463.0, 80000],   // Lower volume
      ['2024-12-30 09:55:00', 2463.0, 2468.0, 2461.0, 2467.0, 450000],  // 400%+ volume spike!
      ['2024-12-30 10:00:00', 2467.0, 2470.0, 2465.0, 2469.0, 120000],  // Normal volume
      ['2024-12-30 10:05:00', 2469.0, 2485.0, 2468.0, 2482.0, 520000],  // BREAKOUT + Volume spike!
      ['2024-12-30 10:10:00', 2482.0, 2488.0, 2480.0, 2486.0, 180000]   // Follow-through
    ];
  },

  async getQuote(symbols) {
    // Mock order book data
    return {
      'NSE:RELIANCE': {
        buy_quantity: 250000,  // Heavy buy imbalance
        sell_quantity: 80000,
        last_price: 2486.0
      }
    };
  }
};

// Mock opening range data (9:15-9:45 AM)
const mockOpeningRangeData = {
  high: 2460.0,    // Breakout level
  low: 2440.0,     // Support level
  open: 2448.0,
  close: 2453.0,
  volume: 380000,
  timeframe: '9:15-9:45 AM'
};

async function testEvery5MinuteAnalysis() {
  console.log('🚀 TESTING YOUR EXACT REQUIREMENT');
  console.log('="=".repeat(60)');
  
  const analyzer = new Every5MinuteCandleAnalyzer(mockKiteConnect);
  
  console.log('\n🎯 REQUIREMENT: Check EVERY 5-minute candle after 9:45 for:');
  console.log('   1️⃣ Breakout happening on that specific candle');
  console.log('   2️⃣ 400% volume spike on that candle');
  console.log('   3️⃣ 2-3 stacked imbalances on that candle');
  console.log('\n' + '='.repeat(60));
  
  try {
    const result = await analyzer.analyzeEvery5MinuteCandlePost945('RELIANCE', mockOpeningRangeData);
    
    if (result.error) {
      console.error('❌ Analysis failed:', result.error);
      return;
    }
    
    console.log(`\n📊 ANALYSIS RESULTS for ${result.symbol}:`);
    console.log(`   • Total 5-minute candles analyzed: ${result.totalCandlesAnalyzed}`);
    console.log(`   • Opening range: ${result.openingRange.low} - ${result.openingRange.high}`);
    console.log(`   • Perfect setup found: ${result.hasPerfectSetup ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📈 DETAILED CANDLE-BY-CANDLE ANALYSIS:');
    console.log('='.repeat(80));
    
    result.candleAnalyses.forEach((candle, index) => {
      console.log(`\n🕐 CANDLE ${candle.candleIndex}: ${candle.candleTime}`);
      console.log(`   📊 OHLC: O:${candle.candleOHLC.open} H:${candle.candleOHLC.high} L:${candle.candleOHLC.low} C:${candle.candleOHLC.close}`);
      console.log(`   📈 Volume: ${candle.candleOHLC.volume.toLocaleString()}`);
      
      // Breakout analysis
      const breakout = candle.breakoutAnalysis;
      console.log(`   🎯 BREAKOUT: ${breakout.isBreakout ? '✅' : '❌'} ${breakout.note}`);
      
      // Volume analysis  
      const volume = candle.volumeAnalysis;
      console.log(`   📊 VOLUME: ${volume.is400PercentSpike ? '✅' : '❌'} ${volume.spikeLevel} (${volume.volumeRatio?.toFixed(1)}x)`);
      
      // Stacked imbalance analysis
      const imbalance = candle.stackedImbalanceAnalysis;
      console.log(`   ⚖️  STACKED: ${imbalance.hasStackedImbalances ? '✅' : '❌'} ${imbalance.stackedDirection} (${imbalance.consecutiveCount} periods)`);
      
      // Overall result for this candle
      if (candle.meetsAllCriteria) {
        console.log(`   🎯 RESULT: ⭐ PERFECT SETUP! All criteria met!`);
        console.log(`   📈 SIGNAL: ${candle.tradingSignal.decision} (${candle.tradingSignal.confidence}% confidence)`);
        console.log(`   💡 REASON: ${candle.tradingSignal.reasoning}`);
      } else {
        console.log(`   ⚠️  RESULT: Incomplete setup - need all 3 criteria on same candle`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL RECOMMENDATION:');
    console.log(`   Decision: ${result.recommendation.decision}`);
    console.log(`   Confidence: ${result.recommendation.confidence}%`);
    console.log(`   Reasoning: ${result.recommendation.reasoning}`);
    
    if (result.foundTradingSignal) {
      console.log(`\n🏆 PERFECT CANDLE FOUND:`);
      console.log(`   Time: ${result.foundTradingSignal.candleTime}`);
      console.log(`   Signal: ${result.foundTradingSignal.tradingSignal.decision}`);
      console.log(`   Strength: ${result.foundTradingSignal.tradingSignal.strength}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEvery5MinuteAnalysis().then(() => {
  console.log('\n✅ Test completed!');
}).catch(error => {
  console.error('❌ Test error:', error.message);
});