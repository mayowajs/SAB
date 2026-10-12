const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const User = require('../models/User');
const ProfilePhoto = require('../models/ProfilePhoto');
const auth = require('../middleware/auth');
const { isValidEmail, isValidName, isValidPassword } = require('../utils/validation');
const router = express.Router();
const ADMIN_DEMO_BALANCE = 1_000_000_000_000;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/register', async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isValidName(fullName) || !isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ message: 'Enter a valid name, email, and password of at least 8 characters' });
    }
    const user = await User.create({ fullName: fullName.trim(), email, password });
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, accountNumber: user.accountNumber, balance: user.balance, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD
    ) {
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        adminUser = await User.create({
          fullName: 'SAB Admin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          isAdmin: true,
          balance: ADMIN_DEMO_BALANCE,
        });
      } else {
        adminUser.fullName = 'SAB Admin';
        adminUser.isAdmin = true;
        adminUser.balance = ADMIN_DEMO_BALANCE;
        await adminUser.save();
      }

      const token = jwt.sign({ id: adminUser._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: adminUser._id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          accountNumber: adminUser.accountNumber,
          balance: adminUser.balance,
          isAdmin: true,
          hasPin: !!adminUser.transactionPin,
          photo: adminUser.photo,
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isFrozen)
      return res.status(403).json({ message: 'Your account has been frozen. Contact support.' });
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, accountNumber: user.accountNumber, balance: user.balance, isAdmin: user.isAdmin, hasPin: !!user.transactionPin, photo: user.photo },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/profile', auth, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { fullName, email }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/password', auth, async (req, res) => {
  try {
    const { current, newPass } = req.body;
    if (!isValidPassword(newPass))
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await bcrypt.compare(current, user.password)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPass;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {
    await ProfilePhoto.deleteOne({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a single-use password reset token without revealing whether the email exists.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    const isProduction = process.env.NODE_ENV === 'production';
    const resendApiKey = process.env.RESEND_API_KEY;
    if (isProduction && !resendApiKey) {
      return res.status(503).json({ message: 'Password reset email is not configured yet' });
    }

    const user = await User.findOne({ email });
    const responseMessage = isProduction
      ? 'If the account exists, a password reset link has been sent.'
      : 'If the account exists, its local demo reset link is shown in the backend terminal.';
    if (!user) return res.json({ message: responseMessage });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || (isProduction
      ? 'https://sab-gbolagade.vercel.app'
      : 'http://localhost:5173');
    const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/forgot-password?token=${resetToken}`;
    if (isProduction) {
      try {
        await axios.post('https://api.resend.com/emails', {
          from: process.env.RESEND_FROM_EMAIL || 'SAB <onboarding@resend.dev>',
          to: [email],
          subject: 'Reset your SAB password',
          html: `<p>We received a request to reset your SAB password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
          text: `Reset your SAB password: ${resetUrl}\nThis link expires in 15 minutes. If you did not request this, you can ignore this email.`,
        }, {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        user.passwordResetTokenHash = null;
        user.passwordResetExpires = null;
        await user.save();
        console.error('Password reset email failed:', err.response?.data?.message || err.message);
        return res.status(503).json({ message: 'Could not send password reset email right now' });
      }
    } else {
      console.info(`Local demo password reset link: ${resetUrl}`);
    }
    res.json({ message: responseMessage });
  } catch (err) {
    res.status(500).json({ message: 'Unable to start password reset right now' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token) || !isValidPassword(newPassword)) {
      return res.status(400).json({ message: 'Reset link is invalid or expired' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });

    user.password = newPassword;
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Unable to reset password right now' });
  }
});

router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Upload a JPEG, PNG, WebP, or GIF image' });
    }

    const photoUrl = `/api/auth/photo/${req.user.id}`;
    await ProfilePhoto.findOneAndUpdate(
      { user: req.user.id },
      { contentType: req.file.mimetype, data: req.file.buffer },
      { upsert: true, new: true, runValidators: true }
    );
    await User.findByIdAndUpdate(req.user.id, { photo: photoUrl });
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/photo/:userId', async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid photo reference' });
    }

    const photo = await ProfilePhoto.findOne({ user: req.params.userId }).select('contentType data');
    if (!photo) return res.status(404).json({ message: 'Profile photo not found' });

    res.set('Cache-Control', 'no-store');
    res.type(photo.contentType).send(photo.data);
  } catch (err) {
    res.status(500).json({ message: 'Could not load profile photo' });
  }
});

router.get('/beneficiaries', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('beneficiaries');
    res.json(user.beneficiaries || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/beneficiaries', auth, async (req, res) => {
  try {
    const { fullName, accountNumber } = req.body;
    const user = await User.findById(req.user.id);
    const exists = user.beneficiaries.find((b) => b.accountNumber === accountNumber);
    if (exists) return res.status(400).json({ message: 'Beneficiary already saved' });
    user.beneficiaries.push({ fullName, accountNumber });
    await user.save();
    res.json(user.beneficiaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/beneficiaries/:accountNumber', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.beneficiaries = user.beneficiaries.filter((b) => b.accountNumber !== req.params.accountNumber);
    await user.save();
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/set-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    const hashed = await bcrypt.hash(pin, 10);
    await User.findByIdAndUpdate(req.user.id, { transactionPin: hashed });
    res.json({ message: 'PIN set successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.transactionPin) return res.status(400).json({ message: 'No PIN set. Please set a PIN first.' });
    const match = await bcrypt.compare(pin, user.transactionPin);
    if (!match) return res.status(400).json({ message: 'Incorrect PIN' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, fullName: user.fullName, email: user.email, accountNumber: user.accountNumber, balance: user.balance, isAdmin: user.isAdmin, photo: user.photo || null, hasPin: !!user.transactionPin } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
