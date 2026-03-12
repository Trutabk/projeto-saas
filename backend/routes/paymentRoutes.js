const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createPixPayment, 
  webhook, 
  checkStatus 
} = require('../controllers/paymentController');

// Rota para criar pagamento Pix (protegida)
router.post('/create-pix', protect, createPixPayment);

// Rota para verificar status do pagamento (polling) - protegida
router.get('/status/:transactionId', protect, checkStatus);

// Rota do webhook (pública, não requer autenticação)
// Deve usar express.json() para processar o corpo da requisição
router.post('/webhook', express.json(), webhook);

module.exports = router; // <-- Exportação correta (apenas o router)
