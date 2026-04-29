const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

function initWS(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });
  console.log('✅ WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    // Parse URL для получения токена из query параметров
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'No token provided');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = decoded;
      console.log(`🔌 WebSocket connected: ${decoded.username}`);
      
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to PEX WebSocket' }));
    } catch (err) {
      console.error('❌ WebSocket auth failed:', err.message);
      ws.close(4001, 'Invalid token');
      return;
    }

    ws.on('error', (err) => console.error('WebSocket error:', err.message));
    ws.on('close', () => console.log('🔌 WebSocket disconnected'));
  });

  return wss;
}

function broadcastTickerUpdate(ticker, price) {
  if (!wss) return;
  console.log(`📢 Broadcasting ${ticker}: $${price}`);

  const frame = JSON.stringify({
    type: 'TICKER_UPDATE',
    payload: { ticker, price, timestamp: Date.now() },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(frame);
    }
  });
}

module.exports = { initWS, broadcastTickerUpdate };