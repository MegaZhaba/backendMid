const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

/**
 * Attach the raw ws.WebSocketServer to an existing http.Server.
 * Token is passed via Sec-WebSocket-Protocol header (browser limitation).
 */
function initWS(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, req) => {
    // ── Auth via Sec-WebSocket-Protocol ──────────────────────────────────────
    const protocols = req.headers['sec-websocket-protocol'];
    const token = protocols ? protocols.split(',').map(s => s.trim())[0] : null;

    if (!token) {
      ws.close(4001, 'No token');
      return;
    }

    try {
      ws.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Acknowledge the subprotocol so browsers don't reject the handshake
    ws.on('error', (err) => console.error('WS error:', err.message));

    console.log(`WS connected: ${ws.user.username}`);
  });

  return wss;
}


function broadcastTickerUpdate(ticker, price) {
  if (!wss) return;

  const frame = JSON.stringify({
    type: 'TICKER_UPDATE',
    payload: { ticker, price },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(frame);
    }
  });
}

module.exports = { initWS, broadcastTickerUpdate };