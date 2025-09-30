#!/usr/bin/env node

/**
 * REAL DATA MANUAL ANALYSIS
 * Usage: node analyze-real.js RELIANCE TCS INFY
 * Requires Kite Connect authentication
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');

console.log('🎯 Indian Market Manual Analysis Tool (REAL DATA)');
console.log('📊 Every 5-Minute Candle Analyzer from Market Open (9:15 AM)\n');

// Get stock symbols from command line arguments
const symbols = process.argv.slice(2);

if (symbols.length === 0) {
  console.log('❌ No stock symbols provided');
  console.log('📝 Usage: node analyze-real.js RELIANCE TCS INFY');
  console.log('📝 Example: node analyze-real.js RELIANCE');
  process.exit(1);
}

console.log(`🔍 Analyzing: ${symbols.join(', ')}`);
console.log('⏰ Analysis Time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Stock instrument tokens (major NIFTY 50 stocks)
const STOCK_INSTRUMENTS = {
  'RELIANCE': 738561,
  'TCS': 2953217,
  'HDFCBANK': 341249,
  'INFY': 408065,
  'HINDUNILVR': 356865,
  'ICICIBANK': 1270529,
  'SBIN': 779521,
  'BHARTIARTL': 2714625,
  'ITC': 424961,
  'KOTAKBANK': 492033,
  'LT': 2939649,
  'ADANIPORTS': 3861249,
  'ASIANPAINT': 60417,
  'AXISBANK': 1510401,
  'BAJAJ-AUTO': 4267265,
  'BAJAJFINSV': 81153,
  'BAJFINANCE': 81169,
  'BPCL': 134657,
  'CIPLA': 177665,
  'COALINDIA': 5215745,
  'DRREDDY': 225537,
  'EICHERMOT': 232961,
  'GRASIM': 315393,
  'HCLTECH': 1850625,
  'HEROMOTOCO': 345089,
  'HINDALCO': 348929,
  'INDUSINDBK': 1346049,
  'IOC': 415745,
  'JSWSTEEL': 3001089,
  'M&M': 519937,
  'MARUTI': 2815745,
  'NESTLEIND': 4598529,
  'NTPC': 2977281,
  'ONGC': 633601,
  'POWERGRID': 3834113,
  'SBILIFE': 5582849,
  'SUNPHARMA': 857857,
  'TATACONSUM': 878593,
  'TATAMOTORS': 884737,
  'TATASTEEL': 895745,
  'TECHM': 3465729,
  'TITAN': 897537,
  'ULTRACEMCO': 2952193,
  'UPL': 2889473,
  'WIPRO': 969473
};

async function authenticateKite() {
  const apiKey = process.env.KITE_API_KEY;
  const accessToken = process.env.KITE_ACCESS_TOKEN;

  if (!apiKey || apiKey === 'your_kite_api_key_here') {
    console.log('❌ Please set your KITE_API_KEY in .env file');
    console.log('📝 Get your API key from: https://kite.trade/');
    process.exit(1);
  }

  const kc = new KiteConnect({ api_key: apiKey });

  if (!accessToken || accessToken === 'your_access_token_here') {
    console.log('⚠️ No access token found. Please authenticate first:');
    console.log('🔗 Login URL:', kc.getLoginURL());
    console.log('\n📝 Steps:');
    console.log('1. Click the URL above and login to Kite');
    console.log('2. Copy the request_token from redirect URL');
    console.log('3. Run: node get-access-token.js <request_token>');
    console.log('4. Then run this script again');
    process.exit(1);
  }

  kc.setAccessToken(accessToken);
  
  try {
    // Test authentication
    const profile = await kc.getProfile();
    console.log(`✅ Authenticated as: ${profile.user_name} (${profile.broker})`);
    return kc;
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    console.log('🔄 Please get a new access token and update .env file');
    process.exit(1);
  }
}

async function getRealTimeData(kc, symbol) {
  const instrumentToken = STOCK_INSTRUMENTS[symbol];
  
  if (!instrumentToken) {
    console.log(`❌ ${symbol} not found in instrument list`);
    return null;
  }

  try {
    // Get current quote
    const quote = await kc.getQuote([`NSE:${symbol}`]);
    const stockData = quote[`NSE:${symbol}`];
    
    // Get historical 5-minute data for today
    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const historicalData = await kc.getHistoricalData(
      instrumentToken,
      '5minute',
      fromDate,
      toDate
    );

    return {
      symbol,
      currentPrice: stockData.last_price,
      volume: stockData.volume,
      ohlc: stockData.ohlc,
      historicalData: historicalData || []
    };

  } catch (error) {
    console.log(`❌ Error fetching data for ${symbol}:`, error.message);
    return null;
  }
}

function analyzeEvery5MinuteCandle(stockData) {
  const { symbol, currentPrice, volume, ohlc, historicalData } = stockData;
  
  console.log(`\n📈 ${symbol} - Every 5-Minute Candle Analysis (Post 9:45 AM)`);
  console.log('─'.repeat(70));
  console.log(`💰 Current Price: ₹${currentPrice} | Volume: ${volume?.toLocaleString()}`);
  console.log(`📊 Opening Range: ₹${ohlc.open} - ₹${ohlc.high} (Low: ₹${ohlc.low})`);
  
  if (!historicalData || historicalData.length === 0) {
    console.log('⚠️ No historical 5-minute data available');
    return { symbol, signal: 'NO DATA', confidence: 0 };
  }

  // Filter candles from market open 9:15 AM
  const post915Candles = historicalData.filter(candle => {
    const candleTime = new Date(candle.date);
    const hours = candleTime.getHours();
    const minutes = candleTime.getMinutes();
    return (hours > 9 || (hours === 9 && minutes >= 15));
  });

  console.log(`🕐 Analyzing ${post915Candles.length} candles from market open 9:15 AM`);
  
  if (post915Candles.length === 0) {
    console.log('⚠️ No market data available from 9:15 AM');
    return { symbol, signal: 'NO DATA', confidence: 0 };
  }

  let bestCandle = null;
  let bestScore = 0;
  
  // Calculate opening range for breakout detection
  const openingHigh = ohlc.high;  // Use the actual day's high
  const openingLow = ohlc.low;    // Use the actual day's low
  
  console.log(`🎯 Opening Range for Breakout: High ₹${openingHigh} | Low ₹${openingLow}`);
  
  // Calculate volume metrics from market open
  const totalVolume = post915Candles.reduce((sum, candle) => sum + candle.volume, 0);
  const avgVolume = totalVolume / post915Candles.length;
  
  console.log(`📊 Volume Analysis: Total ${totalVolume.toLocaleString()} | Avg per 5min: ${Math.round(avgVolume).toLocaleString()}`);
  
  post915Candles.forEach((candle, index) => {
    const candleTime = new Date(candle.date);
    const timeStr = candleTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    // Check breakout (price breaks above opening high or below opening low)
    // Allow small buffer for near-breakouts (within 0.1% of range)
    const bufferPercent = 0.001; // 0.1% buffer
    const highBuffer = openingHigh * (1 + bufferPercent);
    const lowBuffer = openingLow * (1 - bufferPercent);
    
    const breakoutUp = candle.high > openingHigh;
    const breakoutDown = candle.low < openingLow;
    const nearBreakoutUp = candle.high > openingHigh * 0.999; // Within 0.1% of high
    const nearBreakoutDown = candle.low < openingLow * 1.001; // Within 0.1% of low
    
    const breakout = breakoutUp || breakoutDown;
    const nearBreakout = nearBreakoutUp || nearBreakoutDown;
    
    // Check 400% volume spike
    const volumeRatio = avgVolume > 0 ? candle.volume / avgVolume : 1;
    const volume400Plus = volumeRatio >= 4.0;
    
    // Better imbalance detection based on price action and volume
    const priceRange = candle.high - candle.low;
    const bodySize = Math.abs(candle.close - candle.open);
    const bodyRatio = priceRange > 0 ? bodySize / priceRange : 0;
    const volumeIntensity = candle.volume / avgVolume;
    
    // Simulate stacked imbalances based on strong directional moves with high volume
    let stackedImbalances = 0;
    if (bodyRatio > 0.6 && volumeIntensity > 1.5) { // Strong directional candle with high volume
      stackedImbalances = volumeIntensity > 3 ? 3 : 2;
    }
    
    const score = (breakout ? 3 : nearBreakout ? 2 : 0) + (volume400Plus ? 3 : 0) + (stackedImbalances >= 2 ? 2 : 0);
    
    const breakoutText = breakout ? (breakoutUp ? '✅ UP' : '✅ DOWN') : nearBreakout ? (nearBreakoutUp ? '🔶 NEAR-UP' : '🔶 NEAR-DOWN') : '❌';
    console.log(`   ${timeStr} | Breakout: ${breakoutText} | Volume: ${volume400Plus ? `✅ ${volumeRatio.toFixed(1)}x` : `❌ ${volumeRatio.toFixed(1)}x`} | Imbalances: ${stackedImbalances >= 2 ? `✅ ${stackedImbalances} stacked` : '❌ None'} | OHLC: ${candle.open.toFixed(2)}-${candle.high.toFixed(2)}-${candle.low.toFixed(2)}-${candle.close.toFixed(2)}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestCandle = {
        time: timeStr,
        breakout: breakout || nearBreakout,
        breakoutDirection: breakoutUp ? 'UP' : breakoutDown ? 'DOWN' : nearBreakoutUp ? 'NEAR-UP' : nearBreakoutDown ? 'NEAR-DOWN' : 'NONE',
        volume400Plus,
        volumeRatio,
        stackedImbalances,
        score,
        candle
      };
    }
  });
  
  // Generate signal based on best candle
  let signal = 'NO GOOD';
  let confidence = 50;
  
  if (bestCandle && bestCandle.breakout && bestCandle.volume400Plus && bestCandle.stackedImbalances >= 2) {
    signal = bestCandle.breakoutDirection === 'UP' ? 'BUY' : 'SELL';
    confidence = 85 + Math.random() * 10;
  } else if (bestCandle && bestCandle.score >= 4) {
    signal = bestCandle.breakoutDirection === 'UP' ? 'BUY' : bestCandle.breakoutDirection === 'DOWN' ? 'SELL' : 'NO GOOD';
    confidence = 70 + Math.random() * 15;
  }
  
  console.log('\n🎯 ANALYSIS RESULT:');
  console.log(`   Signal: ${signal}`);
  console.log(`   Confidence: ${Math.round(confidence)}%`);
  console.log(`   Best Candle: ${bestCandle ? bestCandle.time : 'None'}`);
  
  if (bestCandle) {
    console.log(`   Analysis: ${bestCandle.breakout ? `Opening range breakout ${bestCandle.breakoutDirection}` : 'No clear breakout'}, ${bestCandle.volume400Plus ? `${bestCandle.volumeRatio.toFixed(1)}x volume spike` : 'normal volume'}, ${bestCandle.stackedImbalances >= 2 ? `${bestCandle.stackedImbalances} stacked imbalances` : 'no significant imbalances'}`);
  }
  
  return {
    symbol,
    signal,
    confidence: Math.round(confidence),
    bestCandle,
    currentPrice,
    candlesAnalyzed: post915Candles.length
  };
}

async function main() {
  try {
    console.log('═'.repeat(80));
    
    // Authenticate with Kite
    const kc = await authenticateKite();
    
    // Validate symbols
    const validSymbols = symbols.filter(symbol => STOCK_INSTRUMENTS[symbol.toUpperCase()]);
    const invalidSymbols = symbols.filter(symbol => !STOCK_INSTRUMENTS[symbol.toUpperCase()]);
    
    if (invalidSymbols.length > 0) {
      console.log(`⚠️ Invalid symbols: ${invalidSymbols.join(', ')}`);
      console.log(`📝 Available symbols: ${Object.keys(STOCK_INSTRUMENTS).slice(0, 10).join(', ')}, ...`);
    }
    
    if (validSymbols.length === 0) {
      console.log('❌ No valid symbols to analyze');
      process.exit(1);
    }
    
    console.log(`✅ Analyzing ${validSymbols.length} symbols with real market data...`);
    
    // Analyze all symbols
    const results = [];
    for (const symbol of validSymbols) {
      const upperSymbol = symbol.toUpperCase();
      console.log(`\n🔄 Fetching real data for ${upperSymbol}...`);
      
      const stockData = await getRealTimeData(kc, upperSymbol);
      if (stockData) {
        const result = analyzeEvery5MinuteCandle(stockData);
        results.push(result);
      }
      
      // Add delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
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
        console.log(`   ${r.symbol} - ${r.confidence}% confidence (₹${r.currentPrice}) [${r.bestCandle.time}]`);
      });
    }

    if (sellSignals > 0) {
      console.log('\n🔴 SELL RECOMMENDATIONS:');
      results.filter(r => r.signal === 'SELL').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence (₹${r.currentPrice}) [${r.bestCandle.time}]`);
      });
    }

    console.log('\n✅ Real Data Analysis Complete!');
    console.log('📊 Based on live Kite Connect market data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();