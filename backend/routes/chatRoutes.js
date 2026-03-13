const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  sendMessage,
  createConversation,
  listConversations,
  getConversationMessages,
  deleteConversation,
  renameConversation
} = require('../controllers/chatController');

// ======================
// Rotas de conversas
// ======================
router.post('/conversations', protect, createConversation);
router.get('/conversations', protect, listConversations);
router.get('/conversations/:id/messages', protect, getConversationMessages);
router.delete('/conversations/:id', protect, deleteConversation);
router.put('/conversations/:id', protect, renameConversation);

// ======================
// Rota para enviar mensagem em uma conversa específica
// ======================
router.post('/message/:conversationId', protect, upload.array('files', 5), sendMessage);

module.exports = router;
