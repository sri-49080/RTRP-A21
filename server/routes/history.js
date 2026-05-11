const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { authenticateToken } = require('../authMiddleware');

// Get user history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let history = await History.findOne({ userId });
    if (!history) {
      history = new History({ userId, items: [] });
      await history.save();
    }
    res.json(history.items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Add to history
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const item = req.body;
    let history = await History.findOne({ userId });
    if (!history) {
      history = new History({ userId, items: [item] });
    } else {
      // Prevent duplicates by id
      if (!history.items.some(h => h.id === item.id)) {
        history.items.unshift(item);
      }
    }
    await history.save();
    res.status(201).json(history.items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to history', details: error.message });
  }
});

// Update a history item
router.put('/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const updates = req.body;
    let history = await History.findOne({ userId });
    if (!history) return res.status(404).json({ error: 'History not found' });
    history.items = history.items.map(item => item.id === itemId ? { ...item.toObject(), ...updates } : item);
    await history.save();
    res.json(history.items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update history item', details: error.message });
  }
});

// Remove from history
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    let history = await History.findOne({ userId });
    if (!history) return res.status(404).json({ error: 'History not found' });
    history.items = history.items.filter(item => item.id !== itemId);
    await history.save();
    res.json(history.items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from history', details: error.message });
  }
});

module.exports = router;
