const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Pix' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  mercadopagoId: { type: String },
  qrCode: { type: String },
  qrCodeBase64: { type: String },
  paymentInfo: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
