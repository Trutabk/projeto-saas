const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Chat = require('../models/Chat'); // Novo modelo

// @desc    Obter estatísticas do dashboard
// @route   GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalPaid = await Transaction.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('-password -tokens');
    const recentTransactions = await Transaction.find().populate('user', 'name email').sort('-createdAt').limit(5);

    // Contar total de mensagens (soma de todas as mensagens em todos os chats)
    const chats = await Chat.find();
    const totalMessages = chats.reduce((acc, chat) => acc + chat.messages.length, 0);

    res.json({
      totalUsers,
      totalTransactions,
      totalRevenue: totalPaid[0]?.total || 0,
      recentUsers,
      recentTransactions,
      totalMessages, // opcional
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar todos os usuários (com paginação)
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const users = await User.find()
      .select('-password -tokens')
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter usuário por ID
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -tokens');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar plano de um usuário
// @route   PUT /api/admin/users/:id/plan
exports.updateUserPlan = async (req, res, next) => {
  try {
    const { planType, expiresAt } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    user.plan.type = planType;
    if (expiresAt) user.plan.expiresAt = expiresAt;
    if (!user.plan.purchasedPlans.includes(planType)) {
      user.plan.purchasedPlans.push(planType);
    }
    await user.save();
    res.json({ message: 'Plano atualizado', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Ativar/desativar usuário (soft delete)
// @route   PUT /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    user.isActive = isActive;
    await user.save();
    res.json({ message: `Usuário ${isActive ? 'ativado' : 'desativado'}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar todas as transações
// @route   GET /api/admin/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Transaction.countDocuments();
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar todas as mensagens (agora via Chat)
// @route   GET /api/admin/messages
exports.getMessages = async (req, res, next) => {
  try {
    // Busca todos os chats e popula os arquivos das mensagens
    const chats = await Chat.find()
      .populate('user', 'name email')
      .populate('messages.files')
      .sort('-updatedAt')
      .limit(100); // Limite para evitar sobrecarga

    // Formata para retornar apenas as mensagens com info do usuário
    const allMessages = chats.flatMap(chat => 
      chat.messages.map(msg => ({
        ...msg.toObject(),
        userName: chat.user?.name,
        userEmail: chat.user?.email,
        userId: chat.user?._id
      }))
    );

    // Ordena por data decrescente (mais recentes primeiro)
    allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allMessages.slice(0, 100)); // Retorna as 100 mais recentes
  } catch (error) {
    next(error);
  }
};
