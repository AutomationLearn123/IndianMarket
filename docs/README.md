# 🇮🇳 Indian Market Trading Signal System

A comprehensive real-time trading signal generation system for NSE equity stocks using Kite Connect API and AI-powered analysis.

## 🚀 Features

- **Real-time Data Streaming**: Live NSE stock prices via Kite Connect WebSocket
- **AI-Powered Signals**: OpenAI GPT-4 integration for intelligent trading recommendations
- **Volume Footprint Analysis**: Automated detection of volume imbalances and breakouts
- **Interactive Dashboard**: Real-time web interface for signal monitoring
- **Multiple Timeframes**: Support for 1min, 5min, 15min, and daily analysis
- **Risk Management**: Built-in stop-loss and target calculations
- **NSE Watchlist**: Pre-configured list of top Indian equity stocks

## 📁 Project Structure

```
IndianMarketManual/
├── minimal-server.js           # Main Express.js server with all endpoints
├── trading-dashboard.html      # Real-time dashboard interface  
├── test-complete-flow.js       # Complete flow testing script
├── test-kite-connection.ts     # Kite API connection tester
├── LLMTradingAnalyzer.ts      # AI trading signal generator
├── src/
│   ├── server.ts              # TypeScript server implementation
│   ├── services/
│   │   └── KiteService.ts     # Enhanced Kite Connect service
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── utils/
│       ├── config.ts          # Configuration management
│       ├── errors.ts          # Custom error classes
│       └── logger.ts          # Winston logger setup
└── logs/                      # Application logs
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v16+ 
- Kite Connect API credentials (API Key, Secret)
- OpenAI API key (optional, for real LLM analysis)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo>
   cd IndianMarketManual
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   KITE_API_KEY=your_kite_api_key
   KITE_API_SECRET=your_kite_secret
   OPENAI_API_KEY=your_openai_key_optional
   PORT=3001
   ```

3. **Start the Server**
   ```bash
   node minimal-server.js
   ```

4. **Access the Dashboard**
   Open `trading-dashboard.html` in your browser

## 🔧 API Endpoints

### Authentication
- `GET /` - Welcome page with login instructions
- `GET /login` - Redirect to Kite Connect login
- `POST /kite/callback` - Handle Kite Connect authentication callback

### Market Data
- `GET /api/status` - Server and authentication status
- `GET /api/data/current/:symbol` - Current market data for a symbol
- `GET /api/data/historical/:symbol` - Historical OHLCV data
- `GET /api/data/llm-format/:symbol` - LLM-ready formatted data with volume analysis

### Trading Signals
- `GET /api/signals/generate/:symbol` - Generate AI trading signal for specific stock
- `GET /api/signals/watchlist` - Generate signals for entire watchlist
- `GET /api/stream/status` - WebSocket streaming status

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
