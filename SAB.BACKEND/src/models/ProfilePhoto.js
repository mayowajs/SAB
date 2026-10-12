const mongoose = require('mongoose');

const profilePhotoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProfilePhoto', profilePhotoSchema);
