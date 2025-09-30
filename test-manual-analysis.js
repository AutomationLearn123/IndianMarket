/**
 * SIMPLE TEST FOR MANUAL ANALYSIS
 * Test the manual stock analysis system independently
 */

console.log('🧪 Testing Manual Stock Analysis System...');

// Test the ManualStockAnalyzer class directly
const { ManualStockAnalyzer } = require('./src/services/ManualStockAnalyzer');

// Mock Kite Connect for testing
const mockKiteConnect = {
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
      const cleanSymbol = symbol.replace('NSE:', '');
      result[symbol] = {
        last_price: 1000 + Math.random() * 100
      };
    });
    return result;
  },

  getQuote: async (symbols) => {
    console.log(`📈 Mock: Getting Quote for ${symbols.join(', ')}`);
    const result = {};
    symbols.forEach(symbol => {
      const cleanSymbol = symbol.replace('NSE:', '');
      result[symbol] = {
        volume: Math.floor(100000 + Math.random() * 500000),
        buy_quantity: Math.floor(50000 + Math.random() * 100000),
        sell_quantity: Math.floor(40000 + Math.random() * 80000),
        average_price: 1000 + Math.random() * 100,
        ohlc: {
          open: 1000 + Math.random() * 100,
          high: 1050 + Math.random() * 100,
          low: 950 + Math.random() * 100,
          close: 980 + Math.random() * 100
        },
        last_price: 1000 + Math.random() * 100
      };
    });
    return result;
  }
};

// Mock LLM Analyzer
const mockLLMAnalyzer = {
  analyzeForTrading: async (prompt) => {
    console.log('🤖 Mock: LLM Analysis starting...');
    
    // Simulate analysis based on prompt content
    const isVolumeMention = prompt.includes('400%');
    const isBuyImbalance = prompt.includes('BUY_HEAVY');
    const isSellImbalance = prompt.includes('SELL_HEAVY');
    
    let decision = 'NO GOOD';
    let confidence = 50 + Math.random() * 20;
    
    if (isVolumeMention && isBuyImbalance) {
      decision = 'BUY';
      confidence = 80 + Math.random() * 15;
    } else if (isVolumeMention && isSellImbalance) {
      decision = 'SELL';
      confidence = 75 + Math.random() * 15;
    }
    
    const reasoning = `Mock Analysis: ${decision} recommendation based on ${isVolumeMention ? '400% volume spike' : 'normal volume'} and ${isBuyImbalance ? 'buy-heavy' : isSellImbalance ? 'sell-heavy' : 'balanced'} order imbalance. Confidence: ${Math.round(confidence)}%`;
    
    return reasoning;
  }
};

// Test the manual analyzer
async function testManualAnalysis() {
  try {
    console.log('\n🎯 Creating Manual Stock Analyzer...');
    const analyzer = new ManualStockAnalyzer(mockKiteConnect, mockLLMAnalyzer);
    
    console.log('\n📊 Testing with sample stocks: RELIANCE, TCS, HDFCBANK');
    const testSymbols = ['RELIANCE', 'TCS', 'HDFCBANK'];
    
    const results = await analyzer.analyzeSelectedStocks(testSymbols);
    
    console.log('\n✅ ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total Stocks: ${results.totalStocks}`);
    console.log(`BUY Signals: ${results.summary.buySignals}`);
    console.log(`SELL Signals: ${results.summary.sellSignals}`);
    console.log(`NO GOOD Signals: ${results.summary.noGoodSignals}`);
    console.log('='.repeat(50));
    
    results.recommendations.forEach((stock, index) => {
      console.log(`\n${index + 1}. ${stock.symbol}`);
      console.log(`   Decision: ${stock.recommendation}`);
      console.log(`   Confidence: ${stock.confidence}%`);
      console.log(`   Reasoning: ${stock.reasoning?.substring(0, 100)}...`);
      
      if (stock.data?.currentData) {
        console.log(`   Price: ₹${stock.data.currentData.lastPrice?.toFixed(2)}`);
        console.log(`   Volume: ${stock.data.currentData.volume?.toLocaleString()}`);
      }
    });
    
    console.log('\n🎉 Manual Analysis Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testManualAnalysis().then(() => {
  console.log('\n✅ All tests completed');
}).catch(error => {
  console.error('\n💥 Test suite failed:', error);
});