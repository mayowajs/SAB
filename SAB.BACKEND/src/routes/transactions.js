const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { canViewTransaction, isValidAccountNumber, isValidTransferAmount } = require('../utils/validation');
const router = express.Router();

const PAYSTACK = 'https://api.paystack.co';
const headers = { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` };
const escapeHtml = (value) => String(value ?? '—').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

// PDF statement download
router.get('/statement/pdf', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const transactions = await Transaction.find({ $or: [{ sender: req.user.id }, { receiver: req.user.id }] })
      .populate('sender', 'fullName accountNumber')
      .populate('receiver', 'fullName accountNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    const rows = transactions.map((tx) => {
      const isSent = tx.sender._id.toString() === req.user.id;
      const other = isSent ? tx.receiver : tx.sender;
      return `<tr>
        <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
        <td>${isSent ? 'Debit' : 'Credit'}</td>
        <td>${other?.fullName || tx.recipientName || '—'}</td>
        <td>${tx.note || '—'}</td>
        <td style="color:${isSent ? '#e53e3e' : '#38a169'}">${isSent ? '-' : '+'}₦${tx.amount.toLocaleString()}</td>
        <td>${tx.status}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;padding:32px;color:#111}
      h1{font-size:22px;margin-bottom:4px}p{color:#888;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#111;color:#fff;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #f0f0f0}
      tr:last-child td{border-bottom:none}
    </style></head><body>
      <h1>SAB — Account Statement</h1>
      <p>Account: ${user.accountNumber} &nbsp;|&nbsp; Name: ${user.fullName} &nbsp;|&nbsp; Balance: ₦${user.balance.toLocaleString()}</p>
      <table><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Note</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="SAB_Statement.html"');
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/receipt', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('sender', 'fullName accountNumber')
      .populate('receiver', 'fullName accountNumber');
    if (!canViewTransaction(transaction, req.user.id)) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isSent = transaction.sender._id.toString() === req.user.id;
    const otherParty = isSent ? transaction.receiver : transaction.sender;
    const recipientName = transaction.type === 'interbank'
      ? transaction.recipientName
      : otherParty?.fullName;
    const recipientAccount = transaction.type === 'interbank'
      ? transaction.recipientAccount
      : otherParty?.accountNumber;
    const safeReference = (transaction.reference || transaction._id.toString()).replace(/[^a-zA-Z0-9_-]/g, '_');
    const amountPrefix = isSent ? '-' : '+';
    const partyLabel = isSent ? 'Recipient' : 'Sender';
    const partyName = isSent ? recipientName : otherParty?.fullName;
    const partyAccount = isSent ? recipientAccount : otherParty?.accountNumber;
    const transactionDate = new Date(transaction.createdAt).toLocaleString();

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SAB transaction receipt</title><style>
      *{box-sizing:border-box}body{margin:0;padding:32px;background:#f4f5f6;color:#17191c;font:15px Arial,sans-serif}.receipt{max-width:560px;margin:32px auto;padding:36px;background:#fff;border:1px solid #e4e6e8;border-radius:12px}.brand{font-size:13px;font-weight:700;letter-spacing:1px}.brand-mark{display:inline-grid;place-items:center;width:34px;height:34px;margin-right:8px;border-radius:8px;background:#111;color:#fff}.heading{margin:32px 0 6px;font-size:23px}.status{color:#3d7a59;font-size:13px;font-weight:700}.amount{margin:24px 0;font-size:36px;font-weight:700}.row{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid #eceef0}.label{color:#737980}.value{text-align:right;font-weight:600;overflow-wrap:anywhere}.footer{margin-top:26px;color:#737980;font-size:12px;line-height:1.5}.print{margin-top:20px;padding:10px 16px;border:0;border-radius:7px;background:#17191c;color:#fff;font-size:14px;font-weight:700;cursor:pointer}@media print{body{padding:0;background:#fff}.receipt{margin:0 auto;border:0}.print{display:none}}@media(max-width:480px){body{padding:12px}.receipt{margin:12px auto;padding:24px}}
    </style></head><body><main class="receipt"><div class="brand"><span class="brand-mark">SAB</span> SILVER AGE BANK</div><h1 class="heading">Transaction receipt</h1><p class="status">${escapeHtml(transaction.status.toUpperCase())}</p><p class="amount">${amountPrefix}₦${Number(transaction.amount).toLocaleString()}</p><div class="row"><span class="label">${partyLabel}</span><span class="value">${escapeHtml(partyName)}</span></div><div class="row"><span class="label">Account</span><span class="value">${escapeHtml(partyAccount)}</span></div>${transaction.type === 'interbank' ? `<div class="row"><span class="label">Bank</span><span class="value">${escapeHtml(transaction.bankName)}</span></div>` : ''}<div class="row"><span class="label">Type</span><span class="value">${transaction.type === 'interbank' ? 'Bank transfer' : 'SAB transfer'}</span></div><div class="row"><span class="label">Note</span><span class="value">${escapeHtml(transaction.note)}</span></div><div class="row"><span class="label">Date</span><span class="value">${escapeHtml(transactionDate)}</span></div><div class="row"><span class="label">Reference</span><span class="value">${escapeHtml(transaction.reference || transaction._id)}</span></div><p class="footer">This receipt confirms the transaction recorded in your SAB account.</p><button class="print" onclick="window.print()">Print / Save as PDF</button></main></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="SAB_Receipt_${safeReference}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: 'Could not create transaction receipt' });
  }
});

// Get all Nigerian banks from Paystack
router.get('/banks', auth, async (req, res) => {
  try {
    const { data } = await axios.get(`${PAYSTACK}/bank?currency=NGN&perPage=100`, { headers });
    res.json(data.data);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch banks' });
  }
});

// Verify inter-bank account name (Paystack account resolution)
router.post('/verify-bank-account', auth, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    const { data } = await axios.get(
      `${PAYSTACK}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers }
    );
    res.json({ accountName: data.data.account_name, accountNumber: data.data.account_number });
  } catch (err) {
    const msg = err.response?.data?.message || 'Could not verify account';
    res.status(400).json({ message: msg });
  }
});

// Search SAB users by name
router.get('/search-users', auth, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) return res.json([]);
    const users = await User.find({
      fullName: { $regex: name.trim(), $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('fullName accountNumber').limit(8);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify SAB recipient by account number
router.get('/verify/:accountNumber', auth, async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber }).select('fullName accountNumber');
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    res.json({ fullName: user.fullName, accountNumber: user.accountNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Internal SAB-to-SAB transfer
router.post('/transfer', auth, async (req, res) => {
  let session;
  try {
    const { accountNumber, amount, note } = req.body;
    if (!isValidAccountNumber(accountNumber) || !isValidTransferAmount(amount)) {
      return res.status(400).json({ message: 'Enter a valid account number and positive amount' });
    }
    if (note !== undefined && (typeof note !== 'string' || note.length > 200)) {
      return res.status(400).json({ message: 'Transfer note must be 200 characters or fewer' });
    }

    session = await mongoose.startSession();
    let completedTransfer;
    await session.withTransaction(async () => {
      const sender = await User.findById(req.user.id).session(session);
      const receiver = await User.findOne({ accountNumber }).session(session);

      if (!sender) throw Object.assign(new Error('Sender not found'), { status: 404 });
      if (!receiver) throw Object.assign(new Error('Receiver not found'), { status: 404 });
      if (sender._id.equals(receiver._id)) throw Object.assign(new Error('Cannot transfer to yourself'), { status: 400 });
      if (sender.isFrozen) throw Object.assign(new Error('Your account is frozen. Contact support.'), { status: 403 });
      if (sender.balance < amount) throw Object.assign(new Error('Insufficient balance'), { status: 400 });

      sender.balance -= amount;
      receiver.balance += amount;
      await sender.save({ session });
      await receiver.save({ session });

      const ref = 'SAB' + Date.now() + Math.floor(Math.random() * 1000);
      const [transaction] = await Transaction.create([{
        sender: sender._id,
        receiver: receiver._id,
        amount,
        note: note || '',
        status: 'success',
        reference: ref,
        type: 'internal',
      }], { session });

      await transaction.populate('sender', 'fullName accountNumber');
      await transaction.populate('receiver', 'fullName accountNumber');
      completedTransfer = {
        transaction,
        balance: sender.balance,
        receiverId: receiver._id.toString(),
        senderName: sender.fullName,
      };
    });

    // Notify receiver via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(completedTransfer.receiverId).emit('notification', {
        message: `You received ₦${amount.toLocaleString()} from ${completedTransfer.senderName}`,
        type: 'credit',
        amount,
        from: completedTransfer.senderName,
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      message: 'Transfer successful',
      balance: completedTransfer.balance,
      transaction: completedTransfer.transaction,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  } finally {
    if (session) await session.endSession();
  }
});

// Inter-bank transfer via Paystack
router.post('/interbank-transfer', auth, async (req, res) => {
  try {
    const { accountNumber, bankCode, bankName, accountName, amount, note } = req.body;
    if (
      !isValidAccountNumber(accountNumber) ||
      typeof bankCode !== 'string' || !/^\d{2,10}$/.test(bankCode) ||
      typeof accountName !== 'string' || accountName.trim().length < 2 || accountName.length > 100 ||
      !isValidTransferAmount(amount)
    ) {
      return res.status(400).json({ message: 'Enter valid recipient and transfer details' });
    }
    if (note !== undefined && (typeof note !== 'string' || note.length > 200)) {
      return res.status(400).json({ message: 'Transfer note must be 200 characters or fewer' });
    }

    const sender = await User.findById(req.user.id);
    if (sender.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    const ref = 'SAB' + Date.now() + Math.floor(Math.random() * 1000);

    // Step 1: Create transfer recipient on Paystack
    const recipientRes = await axios.post(`${PAYSTACK}/transferrecipient`, {
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }, { headers });

    const recipientCode = recipientRes.data.data.recipient_code;

    // Step 2: Initiate transfer (amount in kobo)
    const transferRes = await axios.post(`${PAYSTACK}/transfer`, {
      source: 'balance',
      amount: amount * 100,
      recipient: recipientCode,
      reason: note || 'SAB Transfer',
      reference: ref,
    }, { headers });

    const transferData = transferRes.data.data;
    const status = transferData.status === 'success' ? 'success' : 'pending';

    // Step 3: Deduct balance only after Paystack accepts the request
    sender.balance -= amount;
    await sender.save();

    const transaction = await Transaction.create({
      sender: sender._id,
      amount, note: note || '',
      status,
      reference: ref,
      type: 'interbank',
      bankName,
      bankCode,
      recipientName: accountName,
      recipientAccount: accountNumber,
      paystackRef: transferData.transfer_code,
    });

    res.status(201).json({
      message: status === 'success' ? 'Transfer successful' : 'Transfer initiated',
      balance: sender.balance,
      transaction,
      status,
    });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(400).json({ message: msg });
  }
});

// Get my transactions with pagination + search
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = { $or: [{ sender: req.user.id }, { receiver: req.user.id }] };

    const transactions = await Transaction.find(query)
      .populate('sender', 'fullName accountNumber')
      .populate('receiver', 'fullName accountNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    const filtered = search
      ? transactions.filter((t) =>
          t.sender?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          t.receiver?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          t.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
          t.bankName?.toLowerCase().includes(search.toLowerCase()) ||
          t.reference?.toLowerCase().includes(search.toLowerCase()) ||
          t.note?.toLowerCase().includes(search.toLowerCase())
        )
      : transactions;

    res.json({ transactions: filtered, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(404).json({ message: 'Transaction not found' });
    const tx = await Transaction.findById(req.params.id)
      .populate('sender', 'fullName accountNumber')
      .populate('receiver', 'fullName accountNumber');
    if (!canViewTransaction(tx, req.user.id))
      return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
