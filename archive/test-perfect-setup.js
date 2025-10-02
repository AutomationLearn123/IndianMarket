/**
 * TEST WITH PERFECT SETUP
 * Shows what happens when ALL 3 criteria are met on the SAME 5-minute candle
 */

const { Every5MinuteCandleAnalyzer } = require('./src/services/Every5MinuteCandleAnalyzer');

// Mock Kite Connect with PERFECT SETUP scenario
const mockKiteConnect = {
  async getInstruments(exchange) {
    return [
      {
        tradingsymbol: 'TATASTEEL',
        instrument_token: '895745',
        instrument_type: 'EQ'
      }
    ];
  },

  async getHistoricalData(token, interval, from, to) {
    console.log(`📊 Mock: Getting ${interval} data from ${from} to ${to}`);
    
    // Create a PERFECT scenario - all criteria met on 10:05 candle
    return [
      // 9:45 - Normal candle
      ['2024-12-30 09:45:00', 850.0, 855.0, 848.0, 853.0, 100000],
      
      // 9:50 - Building up
      ['2024-12-30 09:50:00', 853.0, 858.0, 852.0, 857.0, 90000],
      
      // 9:55 - More buildup
      ['2024-12-30 09:55:00', 857.0, 862.0, 856.0, 860.0, 110000],
      
      // 10:00 - Getting close to breakout
      ['2024-12-30 10:00:00', 860.0, 867.0, 859.0, 866.0, 120000],
      
      // 10:05 - PERFECT SETUP! Breakout + 400% volume + stacked imbalances
      ['2024-12-30 10:05:00', 866.0, 875.0, 865.0, 873.0, 480000], // 4x volume spike!
      
      // 10:10 - Follow through
      ['2024-12-30 10:10:00', 873.0, 878.0, 871.0, 876.0, 150000]
    ];
  },

  async getQuote(symbols) {
    return {
      'NSE:TATASTEEL': {
        buy_quantity: 400000,  // MASSIVE buy imbalance
        sell_quantity: 60000,
        last_price: 876.0
      }
    };
  }
};

// Opening range that will create a perfect breakout scenario
const mockOpeningRangeData = {
  high: 870.0,    // Breakout happens at 875.0 (10:05 candle high)
  low: 845.0,
  open: 850.0,
  close: 853.0,
  volume: 300000,
  timeframe: '9:15-9:45 AM'
};

async function testPerfectSetup() {
  console.log('🏆 TESTING PERFECT SETUP SCENARIO');
  console.log('="=".repeat(60)');
  
  const analyzer = new Every5MinuteCandleAnalyzer(mockKiteConnect);
  
  console.log('\n🎯 SCENARIO: TATASTEEL with perfect 10:05 AM candle');
  console.log('   📈 Breakout: 875.0 > 870.0 (opening range high)');
  console.log('   📊 Volume: 480,000 (4x the average of ~120,000)');
  console.log('   ⚖️  Imbalance: 400k buy vs 60k sell = heavy buy pressure');
  console.log('\n' + '='.repeat(60));
  
  try {
    const result = await analyzer.analyzeEvery5MinuteCandlePost945('TATASTEEL', mockOpeningRangeData);
    
    console.log(`\n📊 ANALYSIS RESULTS for ${result.symbol}:`);
    console.log(`   • Total candles analyzed: ${result.totalCandlesAnalyzed}`);
    console.log(`   • Perfect setup found: ${result.hasPerfectSetup ? '🏆 YES!' : '❌ NO'}`);
    
    if (result.hasPerfectSetup) {
      const perfectCandle = result.foundTradingSignal;
      console.log(`\n🏆 PERFECT CANDLE DETAILS:`);
      console.log(`   🕐 Time: ${perfectCandle.candleTime}`);
      console.log(`   📊 OHLC: O:${perfectCandle.candleOHLC.open} H:${perfectCandle.candleOHLC.high} L:${perfectCandle.candleOHLC.low} C:${perfectCandle.candleOHLC.close}`);
      console.log(`   📈 Volume: ${perfectCandle.candleOHLC.volume.toLocaleString()}`);
      console.log(`   🎯 Breakout: ${perfectCandle.breakoutAnalysis.direction} at ${perfectCandle.breakoutAnalysis.breakoutPrice}`);
      console.log(`   📊 Volume Spike: ${perfectCandle.volumeAnalysis.spikeLevel} (${perfectCandle.volumeAnalysis.volumeRatio?.toFixed(1)}x)`);
      console.log(`   ⚖️  Imbalances: ${perfectCandle.stackedImbalanceAnalysis.consecutiveCount} stacked ${perfectCandle.stackedImbalanceAnalysis.stackedDirection}`);
      
      console.log(`\n🚀 TRADING SIGNAL:`);
      console.log(`   Decision: ${perfectCandle.tradingSignal.decision}`);
      console.log(`   Confidence: ${perfectCandle.tradingSignal.confidence}%`);
      console.log(`   Strength: ${perfectCandle.tradingSignal.strength}`);
      console.log(`   Reasoning: ${perfectCandle.tradingSignal.reasoning}`);
    }
    
    console.log('\n📈 ALL CANDLES SUMMARY:');
    result.candleAnalyses.forEach(candle => {
      const status = candle.meetsAllCriteria ? '🏆 PERFECT' : '⚠️  INCOMPLETE';
      console.log(`   ${candle.candleTime}: ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the perfect setup test
testPerfectSetup().then(() => {
  console.log('\n✅ Perfect setup test completed!');
}).catch(error => {
  console.error('❌ Test error:', error.message);
});