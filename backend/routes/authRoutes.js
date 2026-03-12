const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Rotas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword); // ou router.post, conforme sua preferência

// Rotas protegidas
router.post('/logout', protect, logout);

module.exports = router;
