# 🇮🇳 Indian Market Trading Server - How to Run Guide

This guide shows you how to run the **UNIFIED TRADING SERVER** that combines:
- ✅ **Real-time Kite Connect tick data** (live NSE prices)
- ✅ **OpenAI LLM analysis** (AI-powered signals) 
- ✅ **BUY/SELL/HOLD recommendations** (based on actual market data)

## 📋 Prerequisites

- Node.js installed
- TypeScript installed (`npm install -g typescript`)
- All dependencies installed (`npm install`)
- **OpenAI API key** configured in `.env`
- **Kite Connect API credentials** configured in `.env`

## 🚀 Step 1: Start the Unified Server

Open PowerShell in your project directory and run:

```powershell
cd C:\Users\selva\Project\IndianMarketManual
node temp/unified-trading-server.js
```

**Alternative (if you want to use TypeScript directly):**
```powershell
npx ts-node unified-trading-server.ts
```

## 📬 **Step 1.5: Test Webhook (Optional)**

You can test the webhook endpoint before authentication:

```powershell
# Test webhook with PowerShell (simple version)
$headers = @{"Content-Type" = "application/json"}
$body = '{"order_id":"test123","status":"COMPLETE","tradingsymbol":"RELIANCE","transaction_type":"BUY","filled_quantity":100,"average_price":2450.75}'

(Invoke-WebRequest -Uri "http://localhost:3001/webhooks/kite/postback" -Method POST -Headers $headers -Body $body -UseBasicParsing).Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Postback processed successfully",
  "order_id": "test123",
  "status": "COMPLETE"
}
```

**Server Console Output:**
```
📬 Kite postback received: {
  order_id: 'test123',
  status: 'COMPLETE',
  tradingsymbol: 'RELIANCE',
  transaction_type: 'BUY',
  filled_quantity: 100,
  average_price: 2450.75
}
✅ Order executed: {
  order_id: 'test123',
  symbol: 'RELIANCE', 
  quantity: 100,
  price: 2450.75,
  type: 'BUY'
}
```

**Expected Output:**
```
🚀 Starting Unified Indian Market Trading Server...
📊 Initializing Kite Connect + OpenAI services...
✅ OpenAI initialized
✅ KiteConnect initialized

🎯 =======================================
🇮🇳 Unified Trading Server Ready!
🎯 =======================================

🌐 Server: http://localhost:3001
📊 Status: http://localhost:3001/api/status
📈 Market: CLOSED
⏰ Time: 29/9/2025, 8:00:15 am IST

🔥 Live Trading Endpoints:
   GET  /api/kite/login-url             - Authenticate with Kite
   GET  /api/signals/live/RELIANCE      - Live LLM signal for RELIANCE
   GET  /api/signals/live/TCS           - Live LLM signal for TCS
   GET  /api/signals/watchlist          - All live LLM signals
   GET  /api/data/live/:symbol          - Real-time tick data

🤖 LLM Analysis: OpenAI GPT-4
📡 Data Source: Authentication Required

� Ready for AI-powered live trading signals!
```

> **Note:** Keep this terminal window open. The server must stay running.

## 🧪 Step 2: Authenticate with Kite Connect

**Open a NEW PowerShell window** for testing (keep the server running in the first one).

### Step 2.1: Get Authentication URL
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/kite/login-url" -UseBasicParsing).Content
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "loginUrl": "https://kite.zerodha.com/connect/login?api_key=..."
  },
  "message": "Visit this URL to authenticate with Kite Connect"
}
```

### Step 2.2: Complete Authentication
1. **Copy the loginUrl** from the response above
2. **Open it in your browser**
3. **Login with your Zerodha credentials**
4. **You'll be redirected back** with success message
5. **Real-time data streaming will start automatically**

## 📊 Step 3: Test Live LLM Trading Signals

Now you can get **REAL-TIME** trading signals powered by **OpenAI LLM analysis**:

### Get Live Signal for RELIANCE
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/RELIANCE" -UseBasicParsing).Content
```

### Get Live Signal for TCS  
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/TCS" -UseBasicParsing).Content
```

### Get Live Signal for HDFCBANK
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/HDFCBANK" -UseBasicParsing).Content
```

**Expected Live Signal Response:**
```json
{
  "success": true,
  "data": {
    "signal": {
      "symbol": "RELIANCE",
      "action": "BUY",
      "confidence": 0.85,
      "reasoning": "Strong bullish breakout: 2.1% gain with 2.3x volume and 15.2% buy imbalance",
      "entryPrice": 2465.75,
      "stopLoss": 2428.25,
      "target": 2540.30,
      "riskRewardRatio": 1.99,
      "timestamp": "2025-09-29T...",
      "marketData": {
        "currentPrice": 2465.75,
        "volume": 2300000,
        "volumeRatio": 2.3,
        "priceChange": 2.1,
        "ohlc": {
          "open": 2440.0,
          "high": 2470.0,
          "low": 2435.0,
          "close": 2448.0
        }
      }
    }
  },
  "dataSource": "live_kite_data",
  "analysisType": "openai_llm_analysis",
  "timestamp": "2025-09-29T...",
  "disclaimer": "Trading signals are for educational purposes. Trade at your own risk."
}
```

### Get All Live Watchlist Signals
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/watchlist" -UseBasicParsing).Content
```

## 📈 Step 4: Test Real-Time Data

### Get Live Tick Data
```powershell
# Live tick data for RELIANCE
(Invoke-WebRequest -Uri "http://localhost:3001/api/data/live/RELIANCE" -UseBasicParsing).Content

# Live tick data for TCS
(Invoke-WebRequest -Uri "http://localhost:3001/api/data/live/TCS" -UseBasicParsing).Content
```

### Check Server Status
```powershell
(Invoke-WebRequest -Uri "http://localhost:3001/api/status" -UseBasicParsing).Content
```

## 🌐 Step 5: Test the Dashboard

### Browser Test
1. **Open your browser**
2. **Navigate to:** `http://localhost:3001`
3. **You should see:** JSON response with server information and live endpoints

### Trading Dashboard
1. **Open:** `trading-dashboard.html` in your browser
2. **Update the API URL** to use the new endpoints if needed
3. **You should see:** Real-time trading signals powered by LLM

## 🛑 Step 6: Stop the Server

To stop the server:
1. **Go back to the terminal running the server**
2. **Press:** `Ctrl + C`
3. **You should see:** "🛑 Shutting down server..."

## 📝 Complete Test Sequence

**Terminal 1 (Server):**
```powershell
cd C:\Users\selva\Project\IndianMarketManual
npx ts-node unified-trading-server.ts
```

**Terminal 2 (Testing Commands):**
```powershell
cd C:\Users\selva\Project\IndianMarketManual

# Step 1: Get authentication URL
(Invoke-WebRequest -Uri "http://localhost:3001/api/kite/login-url" -UseBasicParsing).Content

# Step 2: Complete authentication in browser (copy-paste the URL)

# Step 3: Test live LLM signals (after authentication)
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/RELIANCE" -UseBasicParsing).Content
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/TCS" -UseBasicParsing).Content
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/live/HDFCBANK" -UseBasicParsing).Content

# Step 4: Get all live signals
(Invoke-WebRequest -Uri "http://localhost:3001/api/signals/watchlist" -UseBasicParsing).Content

# Step 5: Check real-time data
(Invoke-WebRequest -Uri "http://localhost:3001/api/data/live/RELIANCE" -UseBasicParsing).Content
(Invoke-WebRequest -Uri "http://localhost:3001/api/status" -UseBasicParsing).Content
```

## ✅ Expected Results Checklist

- [ ] **Server Status:** Shows Kite authenticated and LLM available
- [ ] **Authentication:** Kite Connect login successful
- [ ] **Live Data:** Real-time tick data streaming
- [ ] **LLM Signals:** AI-powered BUY/SELL/HOLD recommendations
- [ ] **Watchlist:** Multiple live signals with confidence scores
- [ ] **Real-time Updates:** Data refreshes during market hours

## 🎯 **What Makes This Special:**

### 🤖 **AI-Powered Analysis:**
- **OpenAI GPT-4** analyzes real market data
- **Volume footprint** analysis for breakout detection
- **Order book imbalance** detection (buy vs sell pressure)
- **Risk-reward optimization** with stop-loss and targets

### 📊 **Real-Time Data:**
- **Live NSE tick data** via Kite Connect WebSocket
- **Sub-second updates** during market hours
- **10 major stocks** included (RELIANCE, TCS, HDFCBANK, etc.)
- **OHLC, volume, and order book** data

### 🎯 **Smart Signals:**
- **BUY:** High confidence bullish breakouts with volume
- **SELL:** Strong bearish breakdowns with selling pressure  
- **HOLD:** Neutral conditions or low confidence moves
- **Entry/Exit Points:** Specific prices with risk management

## 🚨 Troubleshooting

### Port Already in Use
```powershell
taskkill /F /IM node.exe
```

### TypeScript Compilation Errors
```powershell
npx tsc
```

### Missing Dependencies
```powershell
npm install
```

### Connection Refused
- Make sure the server is running in Terminal 1
- Check if port 3001 is available
- Verify firewall settings

### API Key Issues
- Check `.env` file for correct OpenAI API key
- Verify Kite Connect credentials
- Ensure no extra spaces or quotes in environment variables

## 🔄 Data Types: Mock vs Real-Time

### 📊 **IMPORTANT: Data Type Explanation**

**Current Implementation:**
- **`trading-server.ts`** = **MOCK DATA** (Static test values)
- **`minimal-server.js`** = **REAL-TIME DATA** (Live NSE prices via Kite Connect)

### Option 1: TypeScript Server (Mock Data)
```powershell
npx ts-node trading-server.ts
```
**Features:** 
- ❌ **Mock/Static Data** - Same prices every time
- ✅ Complete AI trading signals with OpenAI
- ✅ All endpoints working
- 🎯 **Use for:** Testing, development, demo

### Option 2: Minimal Kite Server (Real Data)
```powershell
node minimal-server.js
```
**Features:**
- ✅ **Real-time Live Data** - Actual NSE prices
- ✅ Kite Connect WebSocket streaming
- ✅ Live market data during trading hours
- 🎯 **Use for:** Live trading, real signals

### Option 3: Using NPM Scripts
```powershell
npm run dev:server    # Development server (mock data)
npm run build && npm start    # Production build (mock data)
```

## 🚨 **Getting Real-Time Data Steps:**

### Step 1: Use Real-Time Server
```powershell
# Stop any running server first
taskkill /F /IM node.exe

# Start real-time server
node minimal-server.js
```

### Step 2: Authenticate with Kite Connect
```powershell
# Get login URL
(Invoke-WebRequest -Uri "http://localhost:3001/api/kite/login-url" -UseBasicParsing).Content
```

### Step 3: Complete Authentication
1. Copy the login URL from response
2. Open it in browser
3. Login with your Zerodha credentials
4. You'll be redirected back with authentication

### Step 4: Test Real Data
```powershell
# Get live tick data
(Invoke-WebRequest -Uri "http://localhost:3001/api/data/ticks" -UseBasicParsing).Content

# Get historical data
(Invoke-WebRequest -Uri "http://localhost:3001/api/data/historical/RELIANCE" -UseBasicParsing).Content
```

## 📈 Market Phases

The server automatically detects Indian market phases:
- **Pre-market:** 9:00 AM - 9:15 AM IST
- **Regular:** 9:15 AM - 3:30 PM IST
- **Post-market:** 3:30 PM - 4:00 PM IST
- **Closed:** Outside trading hours or weekends

## 🎯 Next Steps

1. **Test all endpoints** following this guide
2. **Configure Kite Connect** for live market data
3. **Set up real trading** with proper risk management
4. **Monitor signals** during market hours
5. **Customize stock watchlist** as needed

## 📞 Support

For issues or questions:
- Check the server logs in the terminal
- Verify API keys in `.env` file
- Ensure all dependencies are installed
- Test individual endpoints one by one

---

**🇮🇳 Happy Trading with AI-Powered Signals! 🚀**
