/**
 * 🔐 AUTHENTICATION ROUTES
 * Handles Kite Connect OAuth flow
 */

const express = require('express');
const router = express.Router();

module.exports = (kiteService) => {
  // Get Kite Connect login URL
  router.get('/kite/login-url', (req, res) => {
    try {
      const loginUrl = kiteService.getLoginURL();
      res.json({
        success: true,
        data: { loginUrl },
        message: 'Visit this URL to authenticate with Kite Connect'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate login URL',
        message: error.message
      });
    }
  });

  // Kite Connect OAuth callback
  router.get('/kite/callback', async (req, res) => {
    const { request_token, action, status } = req.query;
    
    if (!request_token || status !== 'success') {
      res.status(400).send(`
        <h1 style="color:red;">❌ Authentication Failed</h1>
        <p>Error: ${action || 'Unknown error'}</p>
        <p><a href="/api/auth/kite/login-url">Try again</a></p>
      `);
      return;
    }

    try {
      await kiteService.authenticate(request_token);

      res.send(`
        <h1 style="color:green;">🎉 Authentication Successful!</h1>
        <p>Your Kite Connect account is now authenticated and connected.</p>
        <h3>🚀 Test Live Signals:</h3>
        <div style="background:#f5f5f5; padding:10px; margin:10px 0;">GET /api/signals/live/RELIANCE - Live LLM signal for RELIANCE</div>
        <div style="background:#f5f5f5; padding:10px; margin:10px 0;">GET /api/signals/watchlist - All live signals</div>
        <p><a href="/api/status">Check Server Status</a></p>
      `);
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      res.status(500).send(`
        <h1 style="color:red;">❌ Authentication Failed</h1>
        <p>Error: ${error.message}</p>
        <p><a href="/api/auth/kite/login-url">Try again</a></p>
      `);
    }
  });

  return router;
};
