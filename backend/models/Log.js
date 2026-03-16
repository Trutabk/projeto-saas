const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);
