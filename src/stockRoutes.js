const router = require('express').Router();
const auth   = require('./authMiddleware');
const { Stock } = require('./models');
const { broadcastTickerUpdate } = require('./ws');

// GET /api/stocks — list all stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find().populate('owner', 'username');
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stocks/create — create own stock (one per user)
router.post('/create', auth, async (req, res) => {
  try {
    const { ticker, name, price } = req.body;
    if (!ticker || !name || !price)
      return res.status(400).json({ error: 'ticker, name, price required' });

    const existing = await Stock.findOne({ owner: req.user });
    if (existing)
      return res.status(409).json({ error: 'You already own a stock' });

    const stock = await Stock.create({
      ticker: ticker.toUpperCase(),
      name,
      price: parseFloat(price),
      owner: req.user,
    });

    res.status(201).json(stock);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ticker already taken' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/stocks/:id/price — owner updates price → broadcast
router.put('/:id/price', auth, async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || isNaN(price) || parseFloat(price) <= 0)
      return res.status(400).json({ error: 'Valid price required' });

    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    // 403 if not owner
    if (stock.owner.toString() !== req.user)
      return res.status(403).json({ message: 'Forbidden' });

    stock.price = parseFloat(price);
    await stock.save();

    broadcastTickerUpdate(stock.ticker, stock.price);

    res.json({ ticker: stock.ticker, price: stock.price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;