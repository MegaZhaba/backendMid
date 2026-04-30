require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { initWS } = require('./ws');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ИСПРАВЛЕННЫЕ НАСТРОЙКИ CORS
const allowedOrigins = [
  'https://frontend-mid-773j.vercel.app',
  'https://frontend-mid-773j.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Разрешаем запросы без origin (как от curl) и из разрешенных источников
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // ✅ ВАЖНО: разрешаем credentials
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Обработка preflight запросов
app.options('*', cors());

app.use(express.json());

// Routes
app.use('/api/auth', require('./authRoutes'));
app.use('/api/stocks', require('./stockRoutes'));
app.use('/api/trade', require('./tradeRoutes'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// WebSocket
const server = http.createServer(app);
initWS(server);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`✅ PEX server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });