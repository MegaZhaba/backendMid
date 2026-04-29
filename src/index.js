require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const mongoose  = require('mongoose');
const { initWS } = require('./ws');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./authRoutes'));
app.use('/api/stocks', require('./stockRoutes'));
app.use('/api/trade',  require('./tradeRoutes'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── HTTP + WebSocket Server ───────────────────────────────────────────────────
const server = http.createServer(app);
initWS(server);

// ── MongoDB ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`PEX server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });