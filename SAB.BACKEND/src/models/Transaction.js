const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:          { type: Number, required: true },
  note:            { type: String, default: '' },
  status:          { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  reference:       { type: String, unique: true, sparse: true },
  type:            { type: String, enum: ['internal', 'interbank'], default: 'internal' },
  // interbank fields
  bankName:        { type: String },
  bankCode:        { type: String },
  recipientName:   { type: String },
  recipientAccount:{ type: String },
  paystackRef:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
