const express = require('express');
const User = require('../models/User');
const ProfilePhoto = require('../models/ProfilePhoto');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};

// Get all users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all transactions
router.get('/transactions', auth, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('sender', 'fullName accountNumber')
      .populate('receiver', 'fullName accountNumber')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user balance (admin)
router.patch('/users/:id/balance', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { balance: req.body.balance },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Freeze / unfreeze user
router.patch('/users/:id/freeze', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isFrozen = !user.isFrozen;
    await user.save();
    res.json({ isFrozen: user.isFrozen, message: user.isFrozen ? 'Account frozen' : 'Account unfrozen' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await ProfilePhoto.deleteOne({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
