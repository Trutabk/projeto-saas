const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Obter perfil do usuário
// @route   GET /api/user/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -tokens');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar perfil
// @route   PUT /api/user/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        plan: updatedUser.plan,
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Obter plano atual e histórico
// @route   GET /api/user/plan
exports.getMyPlan = async (req, res, next) => {
  try {
    res.json(req.user.plan);
  } catch (error) {
    next(error);
  }
};

// @desc    Obter transações do usuário
// @route   GET /api/user/transactions
exports.getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt');
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
