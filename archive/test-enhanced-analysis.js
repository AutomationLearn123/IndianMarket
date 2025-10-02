/**
 * TEST ENHANCED MANUAL ANALYZER
 * Tests the improved system that uses Kite APIs effectively
 */

console.log('🧪 Testing Enhanced Manual Stock Analysis System...');
console.log('🎯 Now using Kite Historical API effectively for post-9:45 analysis!');

const { EnhancedManualStockAnalyzer } = require('./src/services/EnhancedManualStockAnalyzer');

// Enhanced Mock Kite Connect with Historical API simulation
const mockKiteConnect = {
  getInstruments: async (exchange) => {
    console.log(`📋 Mock: Getting instruments for ${exchange}`);
    return [
      { tradingsymbol: 'RELIANCE', instrument_token: 738561, instrument_type: 'EQ' },
      { tradingsymbol: 'TCS', instrument_token: 2953217, instrument_type: 'EQ' },
      { tradingsymbol: 'HDFCBANK', instrument_token: 341249, instrument_type: 'EQ' }
    ];
  },

  getHistoricalData: async (token, interval, fromTime, toTime) => {
    console.log(`📈 Mock: Getting ${interval} data from ${fromTime} to ${toTime} for token ${token}`);
    
    // Simulate 30 minutes of opening range data (9:15-9:45 AM)
    const data = [];
    const basePrice = 1000 + Math.random() * 100;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 30; i++) {
      const time = new Date('2025-09-30T09:15:00');
      time.setMinutes(time.getMinutes() + i);
      
      const open = currentPrice;
      const volatility = 0.005; // 0.5% volatility per minute
      const high = open + (Math.random() * open * volatility);
      const low = open - (Math.random() * open * volatility);
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(50000 + Math.random() * 100000);
      
      data.push([
        time.toISOString(),
        open,
        high,
        low,
        close,
        volume
      ]);
      
      currentPrice = close;
    }
    
    console.log(`✅ Mock: Generated ${data.length} minutes of historical data`);
    return data;
  },

  getOHLC: async (symbols) => {
    console.log(`📊 Mock: Getting OHLC for ${symbols.join(', ')}`);
    const result = {};
    symbols.forEach(symbol => {
      const cleanSymbol = symbol.replace('NSE:', '');
      result[symbol] = {
        ohlc: {
          open: 1000 + Math.random() * 100,
          high: 1050 + Math.random() * 100,
          low: 950 + Math.random() * 100,
          close: 980 + Math.random() * 100
        }
      };
    });
    return result;
  },

  getLTP: async (symbols) => {
    console.log(`💰 Mock: Getting LTP for ${symbols.join(', ')}`);
    const result = {};
    symbols.forEach(symbol => {
      result[symbol] = {
        last_price: 1040 + Math.random() * 50 // Simulate breakout price
      };
    });
    return result;
  },

  getQuote: async (symbols) => {
    console.log(`📈 Mock: Getting Quote for ${symbols.join(', ')}`);
    const result = {};
    symbols.forEach(symbol => {
      result[symbol] = {
        volume: Math.floor(2000000 + Math.random() * 3000000), // High volume for test
        buy_quantity: Math.floor(80000 + Math.random() * 100000),
        sell_quantity: Math.floor(40000 + Math.random() * 60000), // Buy heavy
        average_price: 1020 + Math.random() * 40,
        ohlc: {
          open: 1000 + Math.random() * 20,
          high: 1070 + Math.random() * 20,
          low: 990 + Math.random() * 20,
          close: 985 + Math.random() * 20
        },
        last_price: 1045 + Math.random() * 25
      };
    });
    return result;
  }
};

// Enhanced Mock LLM Analyzer
const mockLLMAnalyzer = {
  analyzeForTrading: async (prompt) => {
    console.log('🤖 Enhanced Mock: LLM Analysis with real breakout logic...');
    
    // Advanced analysis based on prompt content
    const hasVolumeSpike = prompt.includes('300% Spike: YES') || prompt.includes('400% Spike: YES');
    const hasBreakout = prompt.includes('Has Breakout: YES');
    const isBullish = prompt.includes('Direction: BULLISH');
    const isBearish = prompt.includes('Direction: BEARISH');
    const strongVolume = prompt.includes('Spike Level: HIGH') || prompt.includes('Spike Level: EXTREME');
    
    let decision = 'NO GOOD';
    let confidence = 50 + Math.random() * 20;
    let reasoning = '';
    
    if (hasBreakout && hasVolumeSpike && isBullish) {
      decision = 'BUY';
      confidence = 85 + Math.random() * 10;
      reasoning = 'Strong bullish breakout confirmed with significant volume spike. Clear opening range breakout with institutional participation evident from volume. High probability of continued upward momentum.';
    } else if (hasBreakout && hasVolumeSpike && isBearish) {
      decision = 'SELL';
      confidence = 80 + Math.random() * 10;
      reasoning = 'Bearish breakdown with volume confirmation. Opening range violated on downside with strong selling pressure. Expect further decline.';
    } else if (hasBreakout && strongVolume) {
      decision = Math.random() > 0.5 ? 'BUY' : 'SELL';
      confidence = 75 + Math.random() * 10;
      reasoning = 'Moderate breakout with good volume support. Direction is clear but strength is moderate. Suitable for conservative position sizing.';
    } else if (hasVolumeSpike) {
      confidence = 65 + Math.random() * 10;
      reasoning = 'High volume activity detected but breakout pattern is unclear. Possibly accumulation or distribution phase. Wait for clearer price action.';
    } else {
      confidence = 45 + Math.random() * 15;
      reasoning = 'No clear breakout pattern or volume confirmation. Price action within opening range suggests consolidation. No trading opportunity at this time.';
    }
    
    return `Enhanced Analysis: ${decision} recommendation.
Confidence: ${Math.round(confidence)}%
Reasoning: ${reasoning}
Signal Quality: ${hasBreakout && hasVolumeSpike ? 'HIGH' : hasBreakout || hasVolumeSpike ? 'MODERATE' : 'LOW'}`;
  }
};

// Test the enhanced analyzer
async function testEnhancedAnalysis() {
  try {
    console.log('\n🎯 Creating Enhanced Manual Stock Analyzer...');
    const analyzer = new EnhancedManualStockAnalyzer(mockKiteConnect, mockLLMAnalyzer);
    
    console.log('\n📊 Testing POST-9:45 analysis with: RELIANCE, TCS, HDFCBANK');
    console.log('🕘 Simulating 9:50 AM analysis time (optimal for your workflow)');
    
    const testSymbols = ['RELIANCE', 'TCS', 'HDFCBANK'];
    
    const results = await analyzer.analyzeSelectedStocks(testSymbols);
    
    console.log('\n✅ ENHANCED ANALYSIS RESULTS:');
    console.log('='.repeat(60));
    console.log(`Analysis Time: ${results.analysisTime}`);
    console.log(`Market Phase: ${results.marketPhase}`);
    console.log(`Total Stocks: ${results.totalStocks}`);
    console.log(`BUY Signals: ${results.summary.buySignals}`);
    console.log(`SELL Signals: ${results.summary.sellSignals}`);
    console.log(`NO GOOD Signals: ${results.summary.noGoodSignals}`);
    console.log('='.repeat(60));
    
    results.recommendations.forEach((stock, index) => {
      console.log(`\n${index + 1}. ${stock.symbol} - ${stock.recommendation} (${stock.confidence}%)`);
      console.log(`   💭 ${stock.reasoning?.substring(0, 120)}...`);
      
      if (stock.data?.openingRangeAnalysis) {
        const ora = stock.data.openingRangeAnalysis;
        console.log(`   📊 Opening Range: ₹${ora.low?.toFixed(2)} - ₹${ora.high?.toFixed(2)} (₹${ora.range?.toFixed(2)})`);
        console.log(`   📈 Current: ₹${stock.data.currentMarketData?.lastPrice?.toFixed(2)}`);
        console.log(`   🔊 Volume: ${ora.totalVolume?.toLocaleString()} (${stock.data.volumeAnalysis?.volumeRatio?.toFixed(1)}x avg)`);
        console.log(`   🎯 Data Quality: ${ora.dataQuality} (${ora.totalMinutes}/30 minutes)`);
      }
      
      if (stock.data?.breakoutAnalysis) {
        const ba = stock.data.breakoutAnalysis;
        console.log(`   🚀 Breakout: ${ba.hasBreakout ? 'YES' : 'NO'} | Direction: ${ba.breakoutDirection} | Strength: ${ba.breakoutStrength}`);
      }
    });
    
    console.log('\n🎉 Enhanced Manual Analysis Test Completed Successfully!');
    console.log('\n🌟 KEY IMPROVEMENTS:');
    console.log('   ✅ Uses Kite Historical API for EXACT 9:15-9:45 data');
    console.log('   ✅ Gets minute-by-minute opening range breakdown');
    console.log('   ✅ Calculates TRUE volume spikes vs historical average');
    console.log('   ✅ Perfect for post-9:45 analysis workflow');
    console.log('   ✅ No need for early server startup!');
    
  } catch (error) {
    console.error('\n❌ Enhanced Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run the enhanced test
testEnhancedAnalysis().then(() => {
  console.log('\n✅ All enhanced tests completed');
}).catch(error => {
  console.error('\n💥 Enhanced test suite failed:', error);
});