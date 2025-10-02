#!/usr/bin/env node

/**
 * FULL LLM ANALYSIS with Historical Context
 * Usage: node analyze-full-llm.js RELIANCE TCS INFY
 * Uses LLM to analyze historical patterns, volume analysis, and imbalance   // Filter candles from market open 9:15 AM
  const post915Candles = historicalData.filter(candle => {
    const candleTime = new Date(candle.date);
    const hours = candleTime.getHours();
    const minutes = candleTime.getMinutes();
    return (hours > 9 || (hours === 9 && minutes >= 15));
  });

  console.log(`🕐 Analyzing ${post915Candles.length} candles from market open 9:15 AM`);
 */

require('dotenv').config();
const { KiteConnect } = require('kiteconnect');
const OpenAI = require('openai');

console.log('🤖 Indian Market Manual Analysis Tool (FULL LLM ANALYSIS)');
console.log('📊 Every 5-Minute Candle Analyzer with Complete AI Analysis from Market Open (9:15 AM)\n');

// Get stock symbols from command line arguments
const symbols = process.argv.slice(2);

if (symbols.length === 0) {
  console.log('❌ No stock symbols provided');
  console.log('📝 Usage: node analyze-full-llm.js RELIANCE TCS INFY');
  console.log('📝 Example: node analyze-full-llm.js RELIANCE');
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
  console.log('🤖 OpenAI LLM initialized for FULL analysis');
} catch (error) {
  console.log('❌ OpenAI API key required for full LLM analysis');
  console.log('📝 Please set OPENAI_API_KEY in .env file');
  process.exit(1);
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

async function getRealTimeDataWithHistory(kc, symbol) {
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

    // Get last 5 days of daily data for context
    const fromDateWeek = new Date(today);
    fromDateWeek.setDate(today.getDate() - 7);
    
    const dailyData = await kc.getHistoricalData(
      instrumentToken,
      'day',
      fromDateWeek,
      toDate
    );

    // Get last 30 minutes of 1-minute data for micro analysis
    const from30Min = new Date(today);
    from30Min.setMinutes(today.getMinutes() - 30);
    
    const minuteData = await kc.getHistoricalData(
      instrumentToken,
      'minute',
      from30Min,
      toDate
    );

    return {
      symbol,
      currentPrice: stockData.last_price,
      volume: stockData.volume,
      ohlc: stockData.ohlc,
      historicalData: historicalData || [],
      dailyData: dailyData || [],
      minuteData: minuteData || []
    };

  } catch (error) {
    console.log(`❌ Error fetching data for ${symbol}:`, error.message);
    return null;
  }
}

async function analyzeFullLLM(stockData) {
  const { symbol, currentPrice, volume, ohlc, historicalData, dailyData, minuteData } = stockData;
  
  console.log(`\n📈 ${symbol} - FULL LLM Analysis`);
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
  console.log('🤖 FULL LLM ANALYSIS IN PROGRESS...');

  if (post915Candles.length === 0) {
    console.log('⚠️ No market data available from 9:15 AM');
    return { symbol, signal: 'NO DATA', confidence: 0 };
  }

  // Prepare comprehensive data for LLM
  const dailyContext = dailyData.map(day => {
    const date = new Date(day.date).toLocaleDateString('en-IN');
    return `${date}: O${day.open.toFixed(2)} H${day.high.toFixed(2)} L${day.low.toFixed(2)} C${day.close.toFixed(2)} V${day.volume}`;
  }).join('\n');

  const candleData = post915Candles.map(candle => {
    const time = new Date(candle.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const bodySize = Math.abs(candle.close - candle.open);
    const wickUp = candle.high - Math.max(candle.open, candle.close);
    const wickDown = Math.min(candle.open, candle.close) - candle.low;
    return `${time}: O${candle.open.toFixed(2)} H${candle.high.toFixed(2)} L${candle.low.toFixed(2)} C${candle.close.toFixed(2)} V${candle.volume} [Body:${bodySize.toFixed(2)}, UpWick:${wickUp.toFixed(2)}, DownWick:${wickDown.toFixed(2)}]`;
  }).join('\n');

  const minuteContext = minuteData.slice(-20).map(min => {
    const time = new Date(min.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${time}: ${min.close.toFixed(2)} V${min.volume}`;
  }).join('\n');

  const prompt = `You are an elite Indian stock market analyst with 20+ years of experience in opening range breakout strategies, volume footprint analysis, and every 5-minute candle pattern recognition.

ANALYSIS TIMESTAMP: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
STOCK: ${symbol}
CURRENT PRICE: ₹${currentPrice}
CURRENT VOLUME: ${volume?.toLocaleString()}
OPENING RANGE: Open ₹${ohlc.open} | High ₹${ohlc.high} | Low ₹${ohlc.low}

HISTORICAL CONTEXT (Last 7 Days):
${dailyContext}

TODAY'S 5-MINUTE CANDLES (From Market Open 9:15 AM):
${candleData}

RECENT 1-MINUTE ACTIVITY (Last 20 minutes):
${minuteContext}

YOUR EXPERTISE AREAS:
1. OPENING RANGE BREAKOUT: Identify true breakouts above ₹${ohlc.high} or below ₹${ohlc.low}
2. VOLUME FOOTPRINT ANALYSIS: Detect 400%+ volume spikes and their significance
3. STACKED IMBALANCES: Find 2-3 consecutive directional moves with volume confirmation
4. PATTERN RECOGNITION: Cup & handle, flags, pennants, volume accumulation patterns
5. MARKET MICROSTRUCTURE: Order flow analysis, support/resistance levels
6. RISK ASSESSMENT: Entry/exit points, stop-loss recommendations

CRITICAL ANALYSIS REQUIREMENTS:
✅ Opening Range Breakout: Does ANY 5-minute candle show clean breakout?
✅ Volume Confirmation: Is there 400%+ volume spike on breakout candle?
✅ Stacked Imbalances: Are there 2-3 consecutive moves in same direction?
✅ Pattern Strength: How clean and decisive is the pattern?
✅ Historical Context: How does today compare to recent sessions?
✅ Risk/Reward: What are realistic targets and stop-losses?

TRADING RULES:
- Only recommend BUY/SELL if you see: Breakout + 400% Volume + Stacked Imbalances
- Consider the overall trend from daily data
- Factor in current market time and remaining session
- Assess pattern quality (clean vs. choppy)
- Provide specific entry, target, and stop-loss levels

OUTPUT FORMAT:
SIGNAL: [BUY/SELL/NO_GOOD]
CONFIDENCE: [0-100]%
ENTRY_PRICE: ₹[specific price]
TARGET_PRICE: ₹[specific price]
STOP_LOSS: ₹[specific price]
RISK_REWARD: [ratio]
BREAKOUT_DETECTED: [YES/NO - specific candle time]
VOLUME_SPIKE: [YES/NO - how many times average]
STACKED_IMBALANCES: [YES/NO - how many consecutive]
PATTERN_TYPE: [specific pattern name]
HISTORICAL_CONTEXT: [how today compares to recent days]
REASONING: [detailed technical analysis explaining your decision]
RISK_FACTORS: [what could invalidate this signal]

Remember: Be extremely selective. Only recommend trades with high probability of success. Consider the Indian market context and NSE trading patterns from market open onwards.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an elite Indian stock market analyst with deep expertise in opening range breakout strategies, volume footprint analysis, and NSE trading patterns. You have 20+ years of experience in the Indian markets and understand the nuances of post-9:45 AM trading behavior. Be extremely selective and only recommend high-probability trades.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0,
      seed: 42
    });

    const llmResponse = response.choices[0].message.content;
    
    // Parse LLM response
    const signalMatch = llmResponse.match(/SIGNAL:\s*(BUY|SELL|NO_GOOD)/i);
    const confidenceMatch = llmResponse.match(/CONFIDENCE:\s*(\d+)/);
    const entryMatch = llmResponse.match(/ENTRY_PRICE:\s*₹?(\d+\.?\d*)/);
    const targetMatch = llmResponse.match(/TARGET_PRICE:\s*₹?(\d+\.?\d*)/);
    const stopLossMatch = llmResponse.match(/STOP_LOSS:\s*₹?(\d+\.?\d*)/);
    const reasoningMatch = llmResponse.match(/REASONING:\s*(.*?)(?=RISK_FACTORS:|$)/is);
    const breakoutMatch = llmResponse.match(/BREAKOUT_DETECTED:\s*(YES|NO)/i);
    const volumeMatch = llmResponse.match(/VOLUME_SPIKE:\s*(YES|NO)/i);
    const imbalanceMatch = llmResponse.match(/STACKED_IMBALANCES:\s*(YES|NO)/i);
    const patternMatch = llmResponse.match(/PATTERN_TYPE:\s*(.*?)(?=\n|$)/i);
    
    const signal = signalMatch ? signalMatch[1].toUpperCase() : 'NO_GOOD';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
    const entryPrice = entryMatch ? parseFloat(entryMatch[1]) : currentPrice;
    const targetPrice = targetMatch ? parseFloat(targetMatch[1]) : null;
    const stopLoss = stopLossMatch ? parseFloat(stopLossMatch[1]) : null;
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Full LLM analysis completed';
    
    console.log('\n🎯 LLM ANALYSIS RESULT:');
    console.log(`   Signal: ${signal}`);
    console.log(`   Confidence: ${confidence}%`);
    console.log(`   Entry Price: ₹${entryPrice}`);
    if (targetPrice) console.log(`   Target Price: ₹${targetPrice}`);
    if (stopLoss) console.log(`   Stop Loss: ₹${stopLoss}`);
    console.log(`   Breakout Detected: ${breakoutMatch ? breakoutMatch[1] : 'Unknown'}`);
    console.log(`   Volume Spike: ${volumeMatch ? volumeMatch[1] : 'Unknown'}`);
    console.log(`   Stacked Imbalances: ${imbalanceMatch ? imbalanceMatch[1] : 'Unknown'}`);
    console.log(`   Pattern Type: ${patternMatch ? patternMatch[1].trim() : 'Unknown'}`);
    console.log(`   Reasoning: ${reasoning.substring(0, 150)}...`);
    
    return {
      symbol,
      signal,
      confidence,
      entryPrice,
      targetPrice,
      stopLoss,
      reasoning,
      fullAnalysis: llmResponse,
      currentPrice,
      candlesAnalyzed: post915Candles.length,
      method: 'FULL_LLM',
      breakoutDetected: breakoutMatch ? breakoutMatch[1] === 'YES' : false,
      volumeSpike: volumeMatch ? volumeMatch[1] === 'YES' : false,
      stackedImbalances: imbalanceMatch ? imbalanceMatch[1] === 'YES' : false,
      patternType: patternMatch ? patternMatch[1].trim() : 'Unknown'
    };

  } catch (error) {
    console.log(`❌ LLM analysis error for ${symbol}:`, error.message);
    return {
      symbol,
      signal: 'ERROR',
      confidence: 0,
      reasoning: error.message,
      currentPrice,
      candlesAnalyzed: post915Candles.length,
      method: 'FULL_LLM'
    };
  }
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
    
    console.log(`✅ Analyzing ${validSymbols.length} symbols with FULL LLM analysis...`);
    
    // Analyze all symbols
    const results = [];
    for (const symbol of validSymbols) {
      const upperSymbol = symbol.toUpperCase();
      console.log(`\n🔄 Fetching comprehensive data for ${upperSymbol}...`);
      
      const stockData = await getRealTimeDataWithHistory(kc, upperSymbol);
      if (stockData) {
        const result = await analyzeFullLLM(stockData);
        results.push(result);
      }
      
      // Add delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('🤖 FULL LLM ANALYSIS SUMMARY');
    console.log('═'.repeat(80));

    const buySignals = results.filter(r => r.signal === 'BUY').length;
    const sellSignals = results.filter(r => r.signal === 'SELL').length;
    const noGoodSignals = results.filter(r => r.signal === 'NO_GOOD').length;

    console.log(`🟢 BUY Signals: ${buySignals}`);
    console.log(`🔴 SELL Signals: ${sellSignals}`);
    console.log(`⚫ NO GOOD: ${noGoodSignals}`);

    if (buySignals > 0) {
      console.log('\n🟢 LLM BUY RECOMMENDATIONS:');
      results.filter(r => r.signal === 'BUY').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence`);
        console.log(`      Entry: ₹${r.entryPrice} | Target: ₹${r.targetPrice || 'TBD'} | Stop: ₹${r.stopLoss || 'TBD'}`);
        console.log(`      Pattern: ${r.patternType} | Breakout: ${r.breakoutDetected ? '✅' : '❌'} | Volume: ${r.volumeSpike ? '✅' : '❌'} | Imbalances: ${r.stackedImbalances ? '✅' : '❌'}`);
      });
    }

    if (sellSignals > 0) {
      console.log('\n🔴 LLM SELL RECOMMENDATIONS:');
      results.filter(r => r.signal === 'SELL').forEach(r => {
        console.log(`   ${r.symbol} - ${r.confidence}% confidence`);
        console.log(`      Entry: ₹${r.entryPrice} | Target: ₹${r.targetPrice || 'TBD'} | Stop: ₹${r.stopLoss || 'TBD'}`);
        console.log(`      Pattern: ${r.patternType} | Breakout: ${r.breakoutDetected ? '✅' : '❌'} | Volume: ${r.volumeSpike ? '✅' : '❌'} | Imbalances: ${r.stackedImbalances ? '✅' : '❌'}`);
      });
    }

    console.log('\n✅ Full LLM Analysis Complete!');
    console.log('🤖 Based on AI analysis of historical context, patterns, and volume footprints');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();