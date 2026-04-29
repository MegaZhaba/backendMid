const mongoose = require('mongoose');

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 10000 },
}, { timestamps: true });

// ── Stock ─────────────────────────────────────────────────────────────────────
const stockSchema = new mongoose.Schema({
  ticker:  { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:    { type: String, required: true },
  price:   { type: Number, required: true, min: 0.01 },
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ── Holding ───────────────────────────────────────────────────────────────────
// One doc per (user, stock) pair
const holdingSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  stock:  { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  shares: { type: Number, default: 0 },
}, { timestamps: true });

holdingSchema.index({ user: 1, stock: 1 }, { unique: true });

const User    = mongoose.model('User',    userSchema);
const Stock   = mongoose.model('Stock',   stockSchema);
const Holding = mongoose.model('Holding', holdingSchema);

module.exports = { User, Stock, Holding };