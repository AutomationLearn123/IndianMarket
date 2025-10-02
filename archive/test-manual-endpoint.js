/**
 * TEST MANUAL ANALYSIS ENDPOINT
 * Test your selected stocks: ADANIPORTS,BAJAJFINSV,BAJFINANCE,HCLTECH,HEROMOTOCO,HINDALCO,INFY,LT,POWERGRID,RELIANCE,SBIN,WIPRO
 */

const symbols = [
  "ADANIPORTS", "BAJAJFINSV", "BAJFINANCE", "HCLTECH", 
  "HEROMOTOCO", "HINDALCO", "INFY", "LT", 
  "POWERGRID", "RELIANCE", "SBIN", "WIPRO"
];

const testData = {
  symbols: symbols
};

console.log('🚀 Testing Manual Analysis Endpoint...');
console.log('📊 Selected Stocks:', symbols.join(', '));
console.log('🎯 POST Request to: http://localhost:3001/api/analyze-manual-stocks');
console.log('📋 Payload:', JSON.stringify(testData, null, 2));

// Use fetch to test the endpoint
const testAnalysis = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/analyze-manual-stocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('\n✅ SUCCESS! Analysis completed:');
    console.log('='.repeat(60));
    console.log(`📊 Total stocks analyzed: ${result.recommendations?.length || 0}`);
    console.log(`📈 Summary:`, result.summary);
    
    if (result.recommendations) {
      console.log('\n🎯 DETAILED RESULTS:');
      console.log('='.repeat(60));
      
      result.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.symbol}:`);
        console.log(`   📈 Signal: ${rec.recommendation}`);
        console.log(`   🎯 Confidence: ${rec.confidence}%`);
        console.log(`   💡 Reasoning: ${rec.reasoning?.substring(0, 100)}...`);
        
        if (rec.every5MinAnalysis) {
          console.log(`   🕐 5-Min Analysis: ${rec.every5MinAnalysis.hasPerfectSetup ? '✅ PERFECT SETUP' : '⚠️ No perfect setup'}`);
          if (rec.every5MinAnalysis.hasPerfectSetup) {
            console.log(`   🏆 Perfect Candle: ${rec.every5MinAnalysis.foundTradingSignal.candleTime}`);
          }
        }
      });
    }
    
    console.log('\n🎉 Manual analysis test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if server is running on http://localhost:3001');
    console.log('2. Verify the endpoint exists: POST /api/analyze-manual-stocks');
    console.log('3. Check server logs for errors');
  }
};

// Run the test
testAnalysis();