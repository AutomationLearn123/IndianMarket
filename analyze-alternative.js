#!/usr/bin/env node

/**
 * ALTERNATIVE DATA SOURCE ANALYZER
 * Uses free APIs when Kite Connect is unavailable
 */

require('dotenv').config();
const axios = require('axios');

// Free market data sources
const DATA_SOURCES = {
  // Yahoo Finance (free, no auth needed)
  yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart/',
  
  // Alpha Vantage (free tier available)
  alphavantage: 'https://www.alphavantage.co/query',
  
  // NSE India (official, limited data)
  nse: 'https://www.nseindia.com/api/quote-equity'
};

async function analyzeWithAlternativeData(symbol) {
  console.log(`🔍 Alternative Analysis: ${symbol}`);
  console.log('═══════════════════════════════════════');
  
  try {
    // Convert NSE symbol to Yahoo format
    const yahooSymbol = `${symbol}.NS`;
    
    console.log('📊 Fetching data from Yahoo Finance...');
    const response = await axios.get(`${DATA_SOURCES.yahoo}${yahooSymbol}`, {
      params: {
        interval: '1m',
        range: '1d'
      }
    });
    
    const data = response.data.chart.result[0];
    const meta = data.meta;
    const timestamps = data.timestamp;
    const quotes = data.indicators.quote[0];
    
    console.log('✅ Data retrieved successfully');
    console.log(`📈 ${symbol} - Current Price: ₹${meta.regularMarketPrice}`);
    console.log(`📊 Volume: ${meta.regularMarketVolume.toLocaleString()}`);
    console.log(`🕐 Last Updated: ${new Date(meta.regularMarketTime * 1000).toLocaleString()}`);
    
    // Simple volume analysis
    const avgVolume = quotes.volume.reduce((a, b) => a + b, 0) / quotes.volume.length;
    const currentVolume = quotes.volume[quotes.volume.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    console.log('\n🔍 Quick Analysis:');
    console.log(`📊 Current Volume: ${currentVolume.toLocaleString()}`);
    console.log(`📊 Average Volume: ${Math.round(avgVolume).toLocaleString()}`);
    console.log(`📊 Volume Ratio: ${volumeRatio.toFixed(2)}x`);
    
    if (volumeRatio > 2) {
      console.log('🚀 HIGH VOLUME DETECTED - Potential breakout');
    } else if (volumeRatio < 0.5) {
      console.log('😴 Low volume - Consolidation phase');
    } else {
      console.log('📊 Normal volume levels');
    }
    
    // Price analysis
    const prices = quotes.close.filter(p => p !== null);
    const currentPrice = prices[prices.length - 1];
    const openPrice = quotes.open[0];
    const change = ((currentPrice - openPrice) / openPrice) * 100;
    
    console.log(`\n📈 Price Movement: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
    
    if (Math.abs(change) > 2) {
      console.log('⚡ Significant price movement detected');
      
      if (change > 2) {
        console.log('📞 POTENTIAL CALL OPTION OPPORTUNITY');
      } else {
        console.log('📉 POTENTIAL PUT OPTION OPPORTUNITY');
      }
    }
    
  } catch (error) {
    console.log('❌ Error fetching alternative data:', error.message);
    console.log('💡 Try with a different symbol or check internet connection');
  }
}

// Run analysis
const symbol = process.argv[2] || 'RELIANCE';
analyzeWithAlternativeData(symbol);