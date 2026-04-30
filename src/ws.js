const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

function initWS(httpServer) {
  wss = new WebSocket.Server({ 
    server: httpServer,
    // Разрешаем все пути для WebSocket
    path: '/'
  });
  
  console.log('✅ WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt');
    
    // Получаем токен из URL query параметра
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    console.log('Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('No token, closing connection');
      ws.close(4001, 'No token provided');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = decoded;
      console.log(`✅ WebSocket connected: ${decoded.username}`);
      
      ws.send(JSON.stringify({ 
        type: 'CONNECTED', 
        message: 'Connected to PEX WebSocket',
        user: decoded.username 
      }));
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