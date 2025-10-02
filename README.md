# Indian Market Trading Signal System# 🇮🇳 Indian Market Trading Signal System



A TypeScript-based real-time trading signal generation system using Kite Connect API and LLM analysis for NSE stocks.A comprehensive real-time trading signal generation system for NSE equity stocks using Kite Connect API and AI-powered analysis.



## 🚀 Quick Start## 🚀 Features



### Core Analysis Systems- **Real-time Data Streaming**: Live NSE stock prices via Kite Connect WebSocket

```bash- **AI-Powered Signals**: OpenAI GPT-4 integration for intelligent trading recommendations

# Rule-based volume footprint analysis- **Volume Footprint Analysis**: Automated detection of volume imbalances and breakouts

node analyze-real.js RELIANCE- **Interactive Dashboard**: Real-time web interface for signal monitoring

- **Multiple Timeframes**: Support for 1min, 5min, 15min, and daily analysis

# LLM-enhanced directional analysis  - **Risk Management**: Built-in stop-loss and target calculations

node analyze-full-llm.js RELIANCE- **NSE Watchlist**: Pre-configured list of top Indian equity stocks



# Institutional-grade Market Profile + CPR analysis## 📁 Project Structure

node analyze-enhanced-profile-cpr.js RELIANCE

``````

IndianMarketManual/

## 📁 Project Structure├── minimal-server.js           # Main Express.js server with all endpoints

├── trading-dashboard.html      # Real-time dashboard interface  

```├── test-complete-flow.js       # Complete flow testing script

├── analyze-real.js                 # Core rule-based trading system├── test-kite-connection.ts     # Kite API connection tester

├── analyze-full-llm.js            # LLM-enhanced analysis system  ├── LLMTradingAnalyzer.ts      # AI trading signal generator

├── analyze-enhanced-profile-cpr.js # Institutional Market Profile system├── src/

├── trading-server.ts              # Main trading server│   ├── server.ts              # TypeScript server implementation

├── unified-trading-server.ts      # Unified WebSocket server│   ├── services/

├── manual-analysis.html           # Manual analysis interface│   │   └── KiteService.ts     # Enhanced Kite Connect service

├── trading-dashboard.html         # Real-time dashboard│   ├── types/

├── package.json                   # Dependencies and scripts│   │   └── index.ts           # TypeScript type definitions

├── tsconfig.json                  # TypeScript configuration│   └── utils/

├── vite.config.ts                 # Vite build configuration│       ├── config.ts          # Configuration management

├── .env.example                   # Environment variables template│       ├── errors.ts          # Custom error classes

├── src/                          # Source code modules│       └── logger.ts          # Winston logger setup

│   ├── services/                 # Trading analysis services└── logs/                      # Application logs

│   ├── types/                    # TypeScript type definitions```

│   └── utils/                    # Utility functions

├── config/                       # Configuration files## 🛠️ Setup & Installation

├── docs/                         # Documentation

│   ├── HOW_TO_RUN.md            # Detailed setup guide### Prerequisites

│   ├── OPTIMAL_TRADING_SCHEDULE.md # Trading timing guide- Node.js v16+ 

│   └── *.md                      # All project documentation- Kite Connect API credentials (API Key, Secret)

├── logs/                         # Application logs- OpenAI API key (optional, for real LLM analysis)

└── archive/                      # Archived/experimental files

```### Installation



## 🎯 Core Features1. **Clone and Install Dependencies**

   ```bash

- **Real-time NSE data** via Kite Connect API   git clone <your-repo>

- **Volume footprint analysis** with 400%+ spike detection   cd IndianMarketManual

- **Opening range breakouts** after 9:15 AM IST   npm install

- **LLM directional prediction** for enhanced signals   ```

- **Market Profile analysis** with VAH/VAL/POC levels

- **CPR analysis** for institutional confluence2. **Environment Configuration**

- **Options trading integration** for ITM Call/Put strategies   Create a `.env` file in the root directory:

   ```env

## 📋 Documentation   KITE_API_KEY=your_kite_api_key

   KITE_API_SECRET=your_kite_secret

All documentation is organized in the `/docs` folder:   OPENAI_API_KEY=your_openai_key_optional

- **[HOW_TO_RUN.md](docs/HOW_TO_RUN.md)** - Complete setup and execution guide   PORT=3001

- **[OPTIMAL_TRADING_SCHEDULE.md](docs/OPTIMAL_TRADING_SCHEDULE.md)** - Best trading times and strategies   ```

- **[NIFTY50_SYMBOLS.md](docs/NIFTY50_SYMBOLS.md)** - Supported stock symbols

- **[ENHANCED_BREAKOUT_SYSTEM.md](docs/ENHANCED_BREAKOUT_SYSTEM.md)** - Advanced analysis features3. **Start the Server**

   ```bash

## 🔧 Prerequisites   node minimal-server.js

   ```

1. Node.js and npm installed

2. Kite Connect API credentials (KITE_API_KEY, KITE_ACCESS_TOKEN)4. **Access the Dashboard**

3. OpenAI API key for LLM analysis (optional)   Open `trading-dashboard.html` in your browser

4. Set up environment variables in `.env` file

## 🔧 API Endpoints

## 💡 Usage Tips

### Authentication

- **Prime trading hours**: 9:45-10:30 AM IST for best signals- `GET /` - Welcome page with login instructions

- **Start with**: `analyze-real.js` for proven rule-based analysis- `GET /login` - Redirect to Kite Connect login

- **For options**: Use equity signals to select ITM Call/Put options- `POST /kite/callback` - Handle Kite Connect authentication callback

- **Risk management**: 2-3% risk per trade with proper position sizing

### Market Data

## 📈 Performance- `GET /api/status` - Server and authentication status

- `GET /api/data/current/:symbol` - Current market data for a symbol

- **Rule-based system**: Consistent volume footprint breakouts- `GET /api/data/historical/:symbol` - Historical OHLCV data

- **LLM-enhanced**: Directional prediction with higher accuracy- `GET /api/data/llm-format/:symbol` - LLM-ready formatted data with volume analysis

- **Institutional system**: Market Profile confluence for premium signals

### Trading Signals

---- `GET /api/signals/generate/:symbol` - Generate AI trading signal for specific stock

- `GET /api/signals/watchlist` - Generate signals for entire watchlist

See `/docs` folder for detailed documentation and trading guides.- `GET /api/stream/status` - WebSocket streaming status

## 🎯 Usage Guide

### 1. Authentication Flow
1. Start the server: `node minimal-server.js`
2. Visit `http://localhost:3001` 
3. Click the login link to authenticate with Kite Connect
4. Grant permissions and complete the OAuth flow

### 2. Testing the System
```bash
# Test complete flow
node test-complete-flow.js

# Test individual Kite connection
npx ts-node test-kite-connection.ts
```

### 3. Dashboard Monitoring
1. Open `trading-dashboard.html` in browser
2. Check connection status indicators
3. Use refresh buttons to get latest signals
4. Enable auto-refresh for continuous monitoring

### 4. Sample API Calls
```javascript
// Get trading signal for RELIANCE
const signal = await fetch('http://localhost:3001/api/signals/generate/RELIANCE');

// Get all watchlist signals  
const watchlist = await fetch('http://localhost:3001/api/signals/watchlist');

// Get current market data
const data = await fetch('http://localhost:3001/api/data/current/TCS');
```

## 🧠 AI Signal Generation

The system uses sophisticated analysis combining:

- **Volume Footprint Analysis**: Detects 400%+ volume imbalances
- **Price Action Patterns**: Identifies breakouts and trend changes  
- **Market Context**: Considers opening gaps, time of day, volatility
- **Risk Management**: Calculates optimal stop-loss and targets
- **Confidence Scoring**: Rates signals from 0-100% confidence

### Sample Signal Output
```json
{
  "symbol": "RELIANCE",
  "action": "BUY",
  "confidence": 0.8,
  "entryPrice": 2450.50,
  "target": 2499.51,
  "stopLoss": 2401.49,
  "riskRewardRatio": 2,
  "reasoning": "Strong volume breakout detected with 4.2x normal volume..."
}
```

## 📊 NSE Watchlist Stocks

The system monitors these top NSE stocks:
- **Banking**: HDFCBANK, ICICIBANK, SBIN, AXISBANK
- **IT**: TCS, INFY, WIPRO, HCLTECH
- **Energy**: RELIANCE, ONGC, POWERGRID
- **Auto**: MARUTI, M&M, TATAMOTORS
- **FMCG**: HINDUNILVR, ITC, NESTLEIND
- **Pharma**: DRREDDY, CIPLA, SUNPHARMA
- **And many more...**

## ⚡ Real-Time Features

- **Live WebSocket**: Receives tick-by-tick price and volume data
- **Auto Signals**: Generates signals automatically when conditions are met
- **Market Hours**: Active monitoring from 9:15 AM to 3:30 PM IST
- **Volume Analysis**: Real-time volume imbalance detection
- **Dashboard Updates**: Auto-refreshes every 30 seconds during market hours

## 🛡️ Risk Management

- **Stop Loss**: Automatic 2% stop-loss calculation
- **Position Sizing**: Risk-based position size recommendations  
- **Risk-Reward**: Minimum 1:2 risk-reward ratio enforcement
- **Market Hours**: Only generates signals during active trading hours
- **Confidence Thresholds**: High-confidence signals (>70%) highlighted

## 🔍 Debugging & Logs

- **Console Logs**: Real-time server activity monitoring
- **Error Handling**: Comprehensive error catching and reporting
- **Test Scripts**: Multiple test utilities for verification
- **Status Endpoints**: Health check and connection status APIs

## 📈 Performance Optimization

- **Data Caching**: Historical data cached for faster access
- **Selective Streaming**: Only subscribes to active watchlist symbols
- **Batch Processing**: Processes multiple signals efficiently
- **Rate Limiting**: Respects API rate limits and quotas

## 🚧 Future Enhancements

- [ ] Real order execution via Kite Connect
- [ ] Advanced chart patterns recognition
- [ ] Portfolio management and tracking
- [ ] SMS/Email alert notifications
- [ ] Mobile app for signal monitoring
- [ ] Backtesting framework for strategy validation
- [ ] Multi-timeframe analysis integration

## 📝 License

This project is for educational and research purposes. Please ensure compliance with your broker's API terms and conditions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Create a Pull Request

## ⚠️ Disclaimer

This software is for educational purposes only. Trading in financial markets involves risk. Always do your own research and consult with financial advisors before making investment decisions.

---

**Built with ❤️ for the Indian trading community**
