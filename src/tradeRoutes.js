const router  = require('express').Router();
const auth    = require('./authMiddleware');
const { Stock, User, Holding } = require('./models');

// POST /api/trade/buy
router.post('/buy', auth, async (req, res) => {
  try {
    const { stockId, shares } = req.body;
    const qty = parseInt(shares, 10);
    if (!stockId || !qty || qty <= 0)
      return res.status(400).json({ error: 'stockId and positive shares required' });

    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    const user  = await User.findById(req.user);
    const total = stock.price * qty;

    if (user.walletBalance < total)
      return res.status(400).json({
        error: `Insufficient funds. Need $${total.toFixed(2)}, have $${user.walletBalance.toFixed(2)}`
      });

    user.walletBalance -= total;
    await user.save();

    const holding = await Holding.findOneAndUpdate(
      { user: user._id, stock: stock._id },
      { $inc: { shares: qty } },
      { upsert: true, new: true }
    );

    res.json({
      message: `Bought ${qty} share(s) of $${stock.ticker}`,
      walletBalance: user.walletBalance,
      holding: { ticker: stock.ticker, shares: holding.shares },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/sell
router.post('/sell', auth, async (req, res) => {
  try {
    const { stockId, shares } = req.body;
    const qty = parseInt(shares, 10);
    if (!stockId || !qty || qty <= 0)
      return res.status(400).json({ error: 'stockId and positive shares required' });

    const stock   = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    const user    = await User.findById(req.user);
    const holding = await Holding.findOne({ user: user._id, stock: stock._id });

    if (!holding || holding.shares < qty)
      return res.status(400).json({ error: `Not enough shares. You have ${holding?.shares || 0}` });

    holding.shares     -= qty;
    user.walletBalance += stock.price * qty;
    await Promise.all([holding.save(), user.save()]);

    res.json({
      message: `Sold ${qty} share(s) of $${stock.ticker}`,
      walletBalance: user.walletBalance,
      holding: { ticker: stock.ticker, shares: holding.shares },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade/portfolio
router.get('/portfolio', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user, shares: { $gt: 0 } })
      .populate('stock', 'ticker name price');
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;