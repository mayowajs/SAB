const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName:      { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  accountNumber: { type: String, unique: true, default: () => Math.floor(1000000000 + Math.random() * 9000000000).toString() },
  balance:       { type: Number, default: 50000 },
  isAdmin:       { type: Boolean, default: false },
  photo:         { type: String, default: null },
  transactionPin: { type: String, default: null },
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpires: { type: Date, default: null, select: false },
  beneficiaries:  [{ fullName: String, accountNumber: String, addedAt: { type: Date, default: Date.now } }],
  isFrozen:      { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function preSave() {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
