const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getMyPlan, getMyTransactions } = require('../controllers/userController');
const User = require('../models/User');
const Chat = require('../models/Chat');
const File = require('../models/File');
const { FREE_MESSAGE_LIMIT } = require('../config/limits');

// ======================
// Rotas existentes
// ======================
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/plan', protect, getMyPlan);
router.get('/transactions', protect, getMyTransactions);

// ======================
// Rota de status do usuário (limites e plano)
// ======================
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const now = new Date();
    const hasActivePlan = user.plan.type !== 'free' && user.plan.expiresAt > now;
    res.json({
      plan: user.plan.type,
      expiresAt: user.plan.expiresAt,
      messagesUsed: user.messageCount || 0,
      messagesLimit: hasActivePlan ? Infinity : FREE_MESSAGE_LIMIT,
      isActive: hasActivePlan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao obter status' });
  }
});

// ======================
// NOVAS ROTAS – contagem de mensagens e arquivos
// ======================
router.get('/messages/count', protect, async (req, res) => {
  console.log('📥 Rota /messages/count acessada!'); // Log para depuração
  try {
    const chat = await Chat.findOne({ user: req.user._id });
    const count = chat ? chat.messages.length : 0;
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar mensagens:', error);
    res.status(500).json({ message: 'Erro ao contar mensagens' });
  }
});

router.get('/files/count', protect, async (req, res) => {
  try {
    const count = await File.countDocuments({ user: req.user._id });
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar arquivos:', error);
    res.status(500).json({ message: 'Erro ao contar arquivos' });
  }
});

module.exports = router;
