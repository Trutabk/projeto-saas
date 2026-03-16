const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getStats,
  getUsers,
  exportUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  getTransactions,
  exportTransactions,
  getMessages,
  getLogs,
  getConfig,
  updateFreeLimit,
  updatePrices,
  toggleMaintenance,
} = require('../controllers/adminController');

// Todas as rotas de admin exigem autenticação e permissão de admin
router.use(protect, admin);

// Estatísticas
router.get('/stats', getStats);

// Usuários
router.get('/users', getUsers);
router.get('/users/export', exportUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', toggleUserStatus);

// Transações
router.get('/transactions', getTransactions);
router.get('/transactions/export', exportTransactions);

// Mensagens
router.get('/messages', getMessages);

// Logs
router.get('/logs', getLogs);

// Configurações
router.get('/config', getConfig);
router.post('/config/freeLimit', updateFreeLimit);
router.post('/config/prices', updatePrices);
router.post('/config/maintenance', toggleMaintenance);

module.exports = router;
