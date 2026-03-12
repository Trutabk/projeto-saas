const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String,
  url: String, // se armazenar em nuvem
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
