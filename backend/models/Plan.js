const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, enum: ['bronze', 'prata', 'ouro', 'personalizado'], required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  features: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
