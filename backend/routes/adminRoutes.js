const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getStats,
  getUsers,
  getUserById,
  updateUserPlan,
  toggleUserStatus,
  getTransactions,
  getMessages,
} = require('../controllers/adminController');

router.use(protect, admin); // Todas as rotas admin exigem autenticação e role admin

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/plan', updateUserPlan);
router.put('/users/:id/status', toggleUserStatus);
router.get('/transactions', getTransactions);
router.get('/messages', getMessages);

module.exports = router;
