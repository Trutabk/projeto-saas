const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Plano do usuário
  plan: {
    type: { 
      type: String, 
      enum: ['free', 'bronze', 'prata', 'ouro', 'personalizado'], 
      default: 'free' 
    },
    expiresAt: { type: Date },
    purchasedPlans: [{ type: String }] // histórico de planos adquiridos
  },
  // Controle de mensagens para plano free
  messageCount: { type: Number, default: 0 },
  lastMessageReset: { type: Date, default: Date.now },
  // Tokens de autenticação
  tokens: [{
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
