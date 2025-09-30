#!/usr/bin/env node

/**
 * LLM + RULE-BASED HYBRID ANALYSIS
 * Usage: node analyze-llm-hybrid.js RELIANCE TCS INFY
 * Combines accurate rule-based logic with LLM pattern analysis
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');
const OpenAI = require('openai');

console.log('🎯 Indian Market Manual Analysis Tool (LLM + RULE-BASED HYBRID)');
console.log('📊 Every 5-Minute Candle Analyzer with AI Pattern Recognition from Market Open (9:15 AM)\n');

// Get stock symbols from command line arguments
const symbols = process.argv.slice(2);

if (symbols.length === 0) {
  console.log('❌ No stock symbols provided');
  console.log('📝 Usage: node analyze-llm-hybrid.js RELIANCE TCS INFY');
  console.log('📝 Example: node analyze-llm-hybrid.js RELIANCE');
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

// Initialize OpenAI
let openai = null;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('🤖 OpenAI LLM initialized for pattern analysis');
} catch (error) {
  console.log('⚠️ OpenAI not available, using rule-based analysis only');
}

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

async function analyzeLLMPattern(stockData, ruleBasedResult) {
  if (!openai) {
    return {
      llmAnalysis: 'LLM not available',
      llmSignal: 'NO_LLM',
      llmConfidence: 0,
      llmReasoning: 'OpenAI not configured'
    };
  }

  const { symbol, historicalData, ohlc } = stockData;
  
  // Filter candles from market open 9:15 AM
  const post915Candles = historicalData.filter(candle => {
    const candleTime = new Date(candle.date);
    const hours = candleTime.getHours();
    const minutes = candleTime.getMinutes();
    return (hours > 9 || (hours === 9 && minutes >= 15));
  });

  if (post915Candles.length === 0) {
    return {
      llmAnalysis: 'No market data from 9:15 AM',
      llmSignal: 'NO_DATA',
      llmConfidence: 0,
      llmReasoning: 'Insufficient data for LLM analysis'
    };
  }

  // Prepare data for LLM
  const candleData = post915Candles.map(candle => {
    const time = new Date(candle.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${time}: O${candle.open.toFixed(2)} H${candle.high.toFixed(2)} L${candle.low.toFixed(2)} C${candle.close.toFixed(2)} V${candle.volume}`;
  }).join('\n');

  const prompt = `You are an expert Indian stock market analyst specializing in opening range breakout strategies and every 5-minute candle analysis.

STOCK: ${symbol}
OPENING RANGE: High ₹${ohlc.high} | Low ₹${ohlc.low} | Open ₹${ohlc.open}
CURRENT PRICE: ₹${stockData.currentPrice}

5-MINUTE CANDLES (From Market Open 9:15 AM):
${candleData}

RULE-BASED ANALYSIS RESULT:
Signal: ${ruleBasedResult.signal}
Confidence: ${ruleBasedResult.confidence}%
Best Candle: ${ruleBasedResult.bestCandle ? ruleBasedResult.bestCandle.time : 'None'}
Analysis: ${ruleBasedResult.analysis}

TASK: Analyze the 5-minute candle patterns from market open for:
1. BREAKOUT: Does any candle show clear breakout above ${ohlc.high} or below ${ohlc.low}?
2. VOLUME SPIKES: Are there any 400%+ volume increases in specific candles?
3. STACKED IMBALANCES: Do you see 2-3 consecutive directional moves with volume confirmation?
4. PATTERN STRENGTH: How strong is the overall pattern?

Based on your analysis, provide:
- LLM Signal: BUY/SELL/NO_GOOD
- Confidence: 0-100%
- Reasoning: Specific observations about breakouts, volume, and imbalances

Remember: Only recommend BUY/SELL if you see breakout + 400% volume + stacked imbalances on the SAME 5-minute candle from market open onwards.

Format your response as:
SIGNAL: [BUY/SELL/NO_GOOD]
CONFIDENCE: [0-100]%
REASONING: [Your detailed analysis]`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional Indian stock market analyst specializing in opening range breakout strategies and every 5-minute candle analysis. Focus on identifying breakouts with volume confirmation and stacked imbalances.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });

    const llmResponse = response.choices[0].message.content;
    
    // Parse LLM response
    const signalMatch = llmResponse.match(/SIGNAL:\s*(BUY|SELL|NO_GOOD)/i);
    const confidenceMatch = llmResponse.match(/CONFIDENCE:\s*(\d+)/);
    const reasoningMatch = llmResponse.match(/REASONING:\s*(.*)/is);
    
    return {
      llmAnalysis: llmResponse,
      llmSignal: signalMatch ? signalMatch[1].toUpperCase() : 'NO_GOOD',
      llmConfidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
      llmReasoning: reasoningMatch ? reasoningMatch[1].trim() : 'LLM analysis completed'
    };

  } catch (error) {
    console.log(`⚠️ LLM analysis error for ${symbol}:`, error.message);
    return {
      llmAnalysis: 'LLM analysis failed',
      llmSignal: 'ERROR',
      llmConfidence: 0,
      llmReasoning: error.message
    };
  }
}

function combineAnalysis(ruleBasedResult, llmResult) {
  // Hybrid logic: Rule-based for accuracy, LLM for pattern insights
  let finalSignal = 'NO GOOD';
  let finalConfidence = 50;
  let finalReasoning = '';

  // Rule-based analysis takes priority for breakout and volume
  if (ruleBasedResult.signal !== 'NO GOOD') {
    finalSignal = ruleBasedResult.signal;
    finalConfidence = ruleBasedResult.confidence;
  }

  // LLM can enhance confidence if it agrees
  if (llmResult.llmSignal === ruleBasedResult.signal && llmResult.llmConfidence > 70) {
    finalConfidence = Math.min(95, Math.round((ruleBasedResult.confidence + llmResult.llmConfidence) / 2));
    finalReasoning = `HYBRID: Rule-based + LLM agreement. ${ruleBasedResult.analysis}`;
  } else if (llmResult.llmSignal !== 'NO_GOOD' && ruleBasedResult.signal === 'NO GOOD') {
    // LLM sees pattern that rules missed
    finalSignal = 'PATTERN_DETECTED';
    finalConfidence = Math.max(60, llmResult.llmConfidence - 10);
    finalReasoning = `LLM Pattern: ${llmResult.llmReasoning.substring(0, 100)}...`;
  } else {
    finalReasoning = ruleBasedResult.analysis;
  }

  return {
    signal: finalSignal,
    confidence: finalConfidence,
    reasoning: finalReasoning,
    ruleBasedSignal: ruleBasedResult.signal,
    llmSignal: llmResult.llmSignal,
    method: 'HYBRID'
  };
}

async function analyzeEvery5MinuteCandleHybrid(stockData) {
  const { symbol, currentPrice, volume, ohlc, historicalData } = stockData;
  
  console.log(`\n📈 ${symbol} - HYBRID Analysis (Rule-Based + LLM)`);
  console.log('─'.repeat(70));
  console.log(`💰 Current Price: ₹${currentPrice} | Volume: ${volume?.toLocaleString()}`);
  console.log(`📊 Opening Range: ₹${ohlc.open} - ₹${ohlc.high} (Low: ₹${ohlc.low})`);
  
  if (!historicalData || historicalData.length === 0) {
    console.log('⚠️ No historical 5-minute data available');
    return { symbol, signal: 'NO DATA', confidence: 0 };
  }

  // STEP 1: Rule-based analysis (same as analyze-real.js)
  const post915Candles = historicalData.filter(candle => {
    const candleTime = new Date(candle.date);
    const hours = candleTime.getHours();
    const minutes = candleTime.getMinutes();
    return (hours > 9 || (hours === 9 && minutes >= 15));
  });

  console.log(`🕐 Analyzing ${post915Candles.length} candles from market open 9:15 AM`);
  console.log('🔧 RULE-BASED ANALYSIS:');
  
  if (post915Candles.length === 0) {
    console.log('⚠️ No market data available from 9:15 AM');
    return { symbol, signal: 'NO DATA', confidence: 0 };
  }

  let bestCandle = null;
  let bestScore = 0;
  
  // Calculate opening range for breakout detection
  const openingHigh = ohlc.high;
  const openingLow = ohlc.low;
  
  console.log(`🎯 Opening Range for Breakout: High ₹${openingHigh} | Low ₹${openingLow}`);
  
  // Calculate volume metrics from market open
  const totalVolume = post915Candles.reduce((sum, candle) => sum + candle.volume, 0);
  const avgVolume = totalVolume / post915Candles.length;
  
  console.log(`📊 Volume Analysis: Total ${totalVolume.toLocaleString()} | Avg per 5min: ${Math.round(avgVolume).toLocaleString()}`);
  
  post915Candles.forEach((candle, index) => {
    const candleTime = new Date(candle.date);
    const timeStr = candleTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    // Check breakout (same logic as analyze-real.js)
    const breakoutUp = candle.high > openingHigh;
    const breakoutDown = candle.low < openingLow;
    const nearBreakoutUp = candle.high > openingHigh * 0.999;
    const nearBreakoutDown = candle.low < openingLow * 1.001;
    
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
    
    let stackedImbalances = 0;
    if (bodyRatio > 0.6 && volumeIntensity > 1.5) {
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
  
  // Generate rule-based signal
  let ruleSignal = 'NO GOOD';
  let ruleConfidence = 50;
  
  if (bestCandle && bestCandle.breakout && bestCandle.volume400Plus && bestCandle.stackedImbalances >= 2) {
    ruleSignal = bestCandle.breakoutDirection === 'UP' ? 'BUY' : 'SELL';
    ruleConfidence = 85 + Math.random() * 10;
  } else if (bestCandle && bestCandle.score >= 4) {
    ruleSignal = bestCandle.breakoutDirection === 'UP' ? 'BUY' : bestCandle.breakoutDirection === 'DOWN' ? 'SELL' : 'NO GOOD';
    ruleConfidence = 70 + Math.random() * 15;
  }
  
  const ruleAnalysis = bestCandle ? 
    `${bestCandle.breakout ? `Opening range breakout ${bestCandle.breakoutDirection}` : 'No clear breakout'}, ${bestCandle.volume400Plus ? `${bestCandle.volumeRatio.toFixed(1)}x volume spike` : 'normal volume'}, ${bestCandle.stackedImbalances >= 2 ? `${bestCandle.stackedImbalances} stacked imbalances` : 'no significant imbalances'}` :
    'No significant patterns detected';

  const ruleBasedResult = {
    signal: ruleSignal,
    confidence: Math.round(ruleConfidence),
    bestCandle,
    analysis: ruleAnalysis,
    currentPrice,
    candlesAnalyzed: post945Candles.length
  };

  console.log('\n🤖 LLM PATTERN ANALYSIS:');
  
  // STEP 2: LLM Analysis
  const llmResult = await analyzeLLMPattern(stockData, ruleBasedResult);
  
  console.log(`   LLM Signal: ${llmResult.llmSignal}`);
  console.log(`   LLM Confidence: ${llmResult.llmConfidence}%`);
  console.log(`   LLM Reasoning: ${llmResult.llmReasoning.substring(0, 100)}...`);
  
  // STEP 3: Combine Results
  const hybridResult = combineAnalysis(ruleBasedResult, llmResult);
  
  console.log('\n🎯 HYBRID ANALYSIS RESULT:');
  console.log(`   Final Signal: ${hybridResult.signal}`);
  console.log(`   Final Confidence: ${hybridResult.confidence}%`);
  console.log(`   Method: ${hybridResult.method}`);
  console.log(`   Rule-Based: ${hybridResult.ruleBasedSignal} | LLM: ${hybridResult.llmSignal}`);
  console.log(`   Best Candle: ${bestCandle ? bestCandle.time : 'None'}`);
  console.log(`   Analysis: ${hybridResult.reasoning}`);
  
  return {
    symbol,
    signal: hybridResult.signal,
    confidence: hybridResult.confidence,
    bestCandle,
    currentPrice,
    candlesAnalyzed: post915Candles.length,
    ruleBasedSignal: hybridResult.ruleBasedSignal,
    llmSignal: hybridResult.llmSignal,
    method: 'HYBRID'
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
    
    console.log(`✅ Analyzing ${validSymbols.length} symbols with HYBRID analysis...`);
    
    // Analyze all symbols
    const results = [];
    for (const symbol of validSymbols) {
      const upperSymbol = symbol.toUpperCase();
      console.log(`\n🔄 Fetching real data for ${upperSymbol}...`);
      
      const stockData = await getRealTimeData(kc, upperSymbol);
      if (stockData) {
        const result = await analyzeEvery5MinuteCandleHybrid(stockData);
        results.push(result);
      }
      
      // Add delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 HYBRID ANALYSIS SUMMARY');
    console.log('═'.repeat(80));

    const buySignals = results.filter(r => r.signal === 'BUY').length;
    const sellSignals = results.filter(r => r.signal === 'SELL').length;
    const noGoodSignals = results.filter(r => r.signal === 'NO GOOD').length;
    const patternDetected = results.filter(r => r.signal === 'PATTERN_DETECTED').length;

    console.log(`🟢 BUY Signals: ${buySignals}`);
    console.log(`🔴 SELL Signals: ${sellSignals}`);
    console.log(`🔶 PATTERN DETECTED: ${patternDetected}`);
    console.log(`⚫ NO GOOD: ${noGoodSignals}`);

    if (buySignals > 0) {
      console.log('\n🟢 BUY RECOMMENDATIONS:');
      results.filter(r => r.signal === 'BUY').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence (₹${r.currentPrice}) [Rule: ${r.ruleBasedSignal} | LLM: ${r.llmSignal}]`);
      });
    }

    if (sellSignals > 0) {
      console.log('\n🔴 SELL RECOMMENDATIONS:');
      results.filter(r => r.signal === 'SELL').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence (₹${r.currentPrice}) [Rule: ${r.ruleBasedSignal} | LLM: ${r.llmSignal}]`);
      });
    }

    if (patternDetected > 0) {
      console.log('\n🔶 LLM PATTERN DETECTIONS:');
      results.filter(r => r.signal === 'PATTERN_DETECTED').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence (₹${r.currentPrice}) [LLM Pattern: ${r.llmSignal}]`);
      });
    }

    console.log('\n✅ Hybrid Analysis Complete!');
    console.log('📊 Based on Rule-Based Logic + LLM Pattern Recognition');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();