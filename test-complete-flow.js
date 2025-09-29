const fetch = require('node-fetch');

// Test complete trading signal generation flow
async function testTradingSignalFlow() {
  console.log('🚀 Testing Complete Trading Signal Generation Flow\n');

  const baseUrl = 'http://localhost:3001';

  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Test 1: Check server status
    console.log('1️⃣ Testing server status...');
    const statusResponse = await fetch(`${baseUrl}/api/status`);
    const statusData = await statusResponse.json();
    console.log('   Status:', statusData.authenticated ? '✅ Authenticated' : '❌ Not Authenticated');
    console.log('   Streaming:', statusData.streaming ? '✅ Active' : '❌ Not Active');
    
    if (!statusData.authenticated) {
      console.log('\n⚠️  Please authenticate first by visiting:', statusData.loginUrl);
      return;
    }

    // Test 2: Get current market data for RELIANCE
    console.log('\n2️⃣ Testing current market data...');
    const currentDataResponse = await fetch(`${baseUrl}/api/data/current/RELIANCE`);
    const currentData = await currentDataResponse.json();
    
    if (currentData.success) {
      console.log('   ✅ Current data retrieved');
      console.log(`   Price: ₹${currentData.data.price || 'N/A'}`);
      console.log(`   Volume: ${currentData.data.volume || 'N/A'}`);
    } else {
      console.log('   ❌ Failed to get current data:', currentData.error);
    }

    // Test 3: Get historical data
    console.log('\n3️⃣ Testing historical data...');
    const historicalResponse = await fetch(`${baseUrl}/api/data/historical/RELIANCE?interval=5minute&days=1`);
    const historicalData = await historicalResponse.json();
    
    if (historicalData.success) {
      console.log('   ✅ Historical data retrieved');
      console.log(`   Candles: ${historicalData.data.length} records`);
      if (historicalData.data.length > 0) {
        const latest = historicalData.data[historicalData.data.length - 1];
        console.log(`   Latest: Open=${latest.open}, Close=${latest.close}, Volume=${latest.volume}`);
      }
    } else {
      console.log('   ❌ Failed to get historical data:', historicalData.error);
    }

    // Test 4: Get LLM-formatted data
    console.log('\n4️⃣ Testing LLM-formatted data...');
    const llmDataResponse = await fetch(`${baseUrl}/api/data/llm-format/RELIANCE`);
    const llmData = await llmDataResponse.json();
    
    if (llmData.success) {
      console.log('   ✅ LLM-formatted data retrieved');
      console.log(`   Volume Analysis Ratio: ${llmData.data.volumeAnalysis?.volumeRatio?.toFixed(2) || 'N/A'}`);
      console.log(`   Market Phase: ${llmData.data.marketContext?.phase || 'N/A'}`);
      console.log(`   Recent Candles: ${llmData.data.recentCandles?.length || 0} records`);
    } else {
      console.log('   ❌ Failed to get LLM-formatted data:', llmData.error);
    }

    // Test 5: Generate trading signal
    console.log('\n5️⃣ Testing trading signal generation...');
    const signalResponse = await fetch(`${baseUrl}/api/signals/generate/RELIANCE`);
    const signalData = await signalResponse.json();
    
    if (signalData.success) {
      console.log('   ✅ Trading signal generated');
      const signal = signalData.data.signal;
      console.log(`   Signal: ${signal.action} (Confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
      console.log(`   Entry: ₹${signal.entryPrice?.toFixed(2) || 'N/A'}`);
      console.log(`   Target: ₹${signal.target?.toFixed(2) || 'N/A'}`);
      console.log(`   Stop Loss: ₹${signal.stopLoss?.toFixed(2) || 'N/A'}`);
      console.log(`   Risk:Reward = 1:${signal.riskRewardRatio || 'N/A'}`);
      console.log(`   Reasoning: ${signal.reasoning || 'N/A'}`);
    } else {
      console.log('   ❌ Failed to generate signal:', signalData.error);
    }

    // Test 6: Get watchlist signals
    console.log('\n6️⃣ Testing watchlist signals...');
    const watchlistResponse = await fetch(`${baseUrl}/api/signals/watchlist`);
    const watchlistData = await watchlistResponse.json();
    
    if (watchlistData.success) {
      console.log('   ✅ Watchlist signals generated');
      const data = watchlistData.data;
      console.log(`   Total Analyzed: ${data.totalAnalyzed}`);
      console.log(`   High Confidence: ${data.highConfidenceSignals}`);
      console.log(`   Buy Signals: ${data.buySignals}`);
      console.log(`   Sell Signals: ${data.sellSignals}`);
      
      console.log('\n   Top 3 Signals:');
      data.signals.slice(0, 3).forEach((item, index) => {
        const signal = item.signal;
        console.log(`   ${index + 1}. ${signal.symbol}: ${signal.action} (${(signal.confidence * 100).toFixed(1)}%)`);
      });
    } else {
      console.log('   ❌ Failed to get watchlist signals:', watchlistData.error);
    }

    console.log('\n✅ Complete flow test finished!');
    console.log('\n📊 Next Steps:');
    console.log('   1. Set up OpenAI API key for real LLM analysis');
    console.log('   2. Test with live market data during trading hours');
    console.log('   3. Implement real-time signal monitoring dashboard');
    console.log('   4. Add position management and order execution');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTradingSignalFlow();
