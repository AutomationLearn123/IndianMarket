/**
 * DATA STORAGE INSPECTOR - View Real-Time Tracking Data
 * Add this to your server for debugging/monitoring
 */

// Add this route to working-unified-server.js for inspection
app.get('/api/debug/storage/:symbol', (req, res) => {
  const { symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();

  const now = new Date();
  const marketOpen = new Date(`${now.toDateString()} 09:15:00`);
  const isFirstThirtyMin = enhancedAnalyzer.isWithinFirstThirtyMinutes();

  // Get all tracking data for the symbol
  const debugData = {
    symbol: symbolUpper,
    timestamp: now.toISOString(),
    marketStatus: {
      isMarketOpen: now.getHours() >= 9 && now.getHours() < 16,
      isFirstThirtyMinutes: isFirstThirtyMin,
      minutesSinceOpen: Math.max(0, Math.floor((now - marketOpen) / (1000 * 60)))
    },
    
    // Opening Range Data
    openingRange: enhancedAnalyzer.openingRanges.get(symbolUpper) || null,
    
    // Imbalance History (last 5 readings)
    imbalanceHistory: enhancedAnalyzer.imbalanceHistory.get(symbolUpper) || [],
    
    // Latest tick data
    latestTick: latestTickData.get(symbolUpper) || null,
    
    // Current analysis state
    currentAnalysis: symbolUpper in STOCK_INSTRUMENTS ? 'TRACKED' : 'NOT_TRACKED'
  };

  // Add volume analysis if we have data
  if (debugData.latestTick) {
    const volumeAnalysis = enhancedAnalyzer.checkVolumeSpike(
      symbolUpper,
      debugData.latestTick.volume || 0,
      debugData.latestTick.averageVolume || 1000000
    );
    debugData.volumeAnalysis = volumeAnalysis;

    // Add breakout analysis
    const breakoutAnalysis = enhancedAnalyzer.checkOpeningRangeBreakout(
      symbolUpper,
      debugData.latestTick.last_price
    );
    debugData.breakoutAnalysis = breakoutAnalysis;
  }

  res.json({
    success: true,
    data: debugData,
    instructions: {
      message: "Real-time tracking data for " + symbolUpper,
      endpoints: {
        live_signal: `/api/signals/live/${symbolUpper}`,
        all_storage: "/api/debug/storage-overview",
        reset_data: `/api/debug/reset/${symbolUpper}`
      }
    }
  });
});

// Overview of all tracked symbols
app.get('/api/debug/storage-overview', (req, res) => {
  const overview = {
    timestamp: new Date().toISOString(),
    isFirstThirtyMinutes: enhancedAnalyzer.isWithinFirstThirtyMinutes(),
    
    // Summary counts
    summary: {
      totalSymbols: Object.keys(STOCK_INSTRUMENTS).length,
      symbolsWithTicks: latestTickData.size,
      symbolsWithRanges: enhancedAnalyzer.openingRanges.size,
      symbolsWithImbalanceHistory: enhancedAnalyzer.imbalanceHistory.size
    },
    
    // Active symbols with data
    activeSymbols: Array.from(latestTickData.keys()).map(symbol => {
      const tick = latestTickData.get(symbol);
      const range = enhancedAnalyzer.openingRanges.get(symbol);
      const history = enhancedAnalyzer.imbalanceHistory.get(symbol) || [];
      
      return {
        symbol,
        lastPrice: tick?.last_price,
        volume: tick?.volume,
        hasOpeningRange: !!range,
        imbalanceHistoryLength: history.length,
        lastUpdate: tick?.timestamp || tick?.last_trade_time
      };
    }),
    
    // Memory usage approximation
    memoryUsage: {
      openingRanges: enhancedAnalyzer.openingRanges.size + ' symbols',
      imbalanceHistory: Array.from(enhancedAnalyzer.imbalanceHistory.values())
        .reduce((total, history) => total + history.length, 0) + ' records',
      latestTicks: latestTickData.size + ' symbols'
    }
  };

  res.json({
    success: true,
    data: overview,
    instructions: {
      message: "Complete system storage overview",
      debugSymbol: "/api/debug/storage/RELIANCE",
      resetAll: "/api/debug/reset-all"
    }
  });
});

// Reset tracking data (for testing)
app.get('/api/debug/reset/:symbol', (req, res) => {
  const { symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();
  
  // Clear symbol-specific data
  enhancedAnalyzer.openingRanges.delete(symbolUpper);
  enhancedAnalyzer.imbalanceHistory.delete(symbolUpper);
  latestTickData.delete(symbolUpper);
  
  res.json({
    success: true,
    message: `Cleared tracking data for ${symbolUpper}`,
    timestamp: new Date().toISOString()
  });
});

// Reset all tracking data
app.get('/api/debug/reset-all', (req, res) => {
  enhancedAnalyzer.openingRanges.clear();
  enhancedAnalyzer.imbalanceHistory.clear();
  latestTickData.clear();
  
  res.json({
    success: true,
    message: 'Cleared all tracking data',
    timestamp: new Date().toISOString()
  });
});