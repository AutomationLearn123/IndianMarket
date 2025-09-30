# Manual Stock Analysis Workflow

## 🎯 Your Perfect Trading Setup

This system is designed around **your actual workflow** - no complex automation, just focused analysis for the stocks you manually select during market monitoring.

---

## 📋 Step-by-Step Workflow

### 1. **Manual Market Monitoring** (9:15-9:45 AM)
- **You** watch the market and identify 5-6 interesting stocks
- Look for volume spikes, breakout patterns, unusual activity
- Note stocks showing potential for significant moves

### 2. **Input Your Selections**
- Open: `http://localhost:3001/manual-analysis.html`
- Enter your selected stock symbols (e.g., `RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK`)
- Click "Analyze Selected Stocks"

### 3. **AI Analysis**
The system analyzes each stock for:
- **Opening Range Breakout** (9:15-9:45 AM period)
- **400% Volume Spike** detection
- **Order Book Imbalances** (2-3 stacked periods)
- **Historical Pattern** matching
- **Current Market Conditions**

### 4. **Clear Recommendations**
Get instant results:
- ✅ **BUY** - Strong breakout confirmed with volume
- ❌ **SELL** - Bearish breakdown with confirmation
- ⚠️ **NO GOOD** - Insufficient signals or mixed indicators

---

## 🔧 Technical Setup

### API Endpoint
```bash
POST /api/analyze-manual-stocks
Content-Type: application/json

{
  "symbols": ["RELIANCE", "TCS", "HDFCBANK"]
}
```

### Response Format
```json
{
  "success": true,
  "results": {
    "totalStocks": 3,
    "summary": {
      "buySignals": 1,
      "sellSignals": 0, 
      "noGoodSignals": 2
    },
    "recommendations": [
      {
        "symbol": "RELIANCE",
        "recommendation": "BUY",
        "confidence": 85,
        "reasoning": "Strong opening range breakout with 420% volume spike...",
        "data": {
          "currentData": { "lastPrice": 1375.50, "volume": 2850000 },
          "volumeAnalysis": { "is400PercentSpike": true },
          "orderBookImbalance": { "imbalanceDirection": "BUY_HEAVY" }
        }
      }
    ]
  }
}
```

---

## 🎯 Analysis Criteria

### Breakout Detection
- **Opening Range**: 9:15-9:45 AM high/low levels
- **Breakout Confirmation**: Price breaking above/below with volume
- **Time Validation**: Must be within first 30 minutes for best signals

### Volume Analysis  
- **400% Spike**: Current volume vs historical average
- **Time-based Volume**: Volume concentration in breakout period
- **Volume Profile**: Distribution throughout the day

### Order Book Imbalance
- **Current Snapshot**: Buy vs Sell quantity ratio
- **Stacked Detection**: 2-3 consecutive periods of same-direction imbalance
- **Significant Threshold**: >30% imbalance ratio

### LLM Decision Logic
```
IF (Opening Range Breakout + 400% Volume + Buy Imbalance) 
   THEN "BUY" with 80-95% confidence

IF (Opening Range Breakdown + 400% Volume + Sell Imbalance)
   THEN "SELL" with 80-95% confidence

ELSE "NO GOOD" with 50-70% confidence
```

---

## 🕘 Optimal Timing

### Best Practice Schedule
```
8:10 AM  - Start server (automatic data capture)
9:15 AM  - Market opens, begin manual monitoring
9:45 AM  - End of opening range, input selected stocks
9:50 AM  - Get analysis results, make trading decisions
```

### Market Phases
- **PRE_MARKET** (8:00-9:15): Server preparation
- **OPENING_RANGE** (9:15-9:45): Manual monitoring period  
- **REGULAR_TRADING** (9:45-15:30): Analysis and execution

---

## 🌟 Key Advantages

### 1. **Human + AI Combination**
- You use your experience to filter stocks
- AI handles complex mathematical analysis
- Best of both worlds approach

### 2. **Focused Analysis**
- Only analyze stocks you're actually interested in
- No noise from automated scanning of 1000+ stocks
- Targeted, actionable insights

### 3. **Real-time Data**
- Live market data through Kite Connect
- Current order book imbalances
- Real-time volume and price movements

### 4. **Professional Grade**
- 400% volume threshold (institutional standard)
- Opening range methodology (proven strategy)
- Stacked imbalance detection (order flow analysis)

---

## 🔍 Example Usage

### Morning Routine
```
9:25 AM - Notice RELIANCE showing unusual volume
9:30 AM - TCS breaking above yesterday's high
9:35 AM - HDFCBANK strong buying pressure
9:40 AM - INFY showing profit booking
9:45 AM - Enter symbols: RELIANCE, TCS, HDFCBANK, INFY
9:47 AM - Get results: RELIANCE (BUY 90%), TCS (BUY 75%), HDFCBANK (NO GOOD 60%), INFY (SELL 80%)
```

### Input Format Examples
```
✅ Comma separated: RELIANCE, TCS, HDFCBANK
✅ Space separated: RELIANCE TCS HDFCBANK  
✅ Line separated:
   RELIANCE
   TCS
   HDFCBANK
```

---

## 🚀 Quick Start

1. **Start Server**: `node working-unified-server.js`
2. **Authenticate**: Visit login URL shown in console
3. **Monitor Market**: 9:15-9:45 AM manual observation
4. **Analyze**: Open `manual-analysis.html` and input symbols
5. **Trade**: Use BUY/SELL recommendations with confidence levels

---

This system respects your manual expertise while providing sophisticated technical analysis - exactly what you need for focused, profitable trading decisions!