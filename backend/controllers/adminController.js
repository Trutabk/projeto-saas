const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Conversation = require('../models/Conversation');
const Log = require('../models/Log'); // Será criado a seguir
const { FREE_MESSAGE_LIMIT } = require('../config/limits');

// @desc    Obter estatísticas do dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeToday = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const messagesToday = await Conversation.aggregate([
      { $unwind: '$messages' },
      { $match: { 'messages.createdAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $count: 'total' }
    ]);
    const totalTransactions = await Transaction.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const activePlans = await User.countDocuments({ 'plan.type': { $ne: 'free' }, 'plan.expiresAt': { $gt: new Date() } });

    // Dados para gráficos (exemplo)
    const revenueLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const revenueData = [1200, 1900, 3000, 5000, 2300, 3400]; // Substituir por dados reais do banco
    const planLabels = ['Gratuito', 'Básico', 'Pro', 'Empresarial'];
    const planData = [
      await User.countDocuments({ 'plan.type': 'free' }),
      await User.countDocuments({ 'plan.type': 'basic' }),
      await User.countDocuments({ 'plan.type': 'pro' }),
      await User.countDocuments({ 'plan.type': 'enterprise' }),
    ];
    const messageLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const messageData = [65, 59, 80, 81, 56, 55, 40]; // Substituir
    const growthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const growthData = [10, 25, 30, 45, 60, 80]; // Substituir

    res.json({
      totalUsers,
      activeToday,
      messagesToday: messagesToday[0]?.total || 0,
      totalTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      activePlans,
      revenueLabels,
      revenueData,
      planLabels,
      planData,
      messageLabels,
      messageData,
      growthLabels,
      growthData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas' });
  }
};

// @desc    Listar usuários com paginação e filtros
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const planFilter = req.query.plan || '';

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (planFilter) {
      filter['plan.type'] = planFilter;
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments(filter);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

// @desc    Exportar usuários (CSV)
// @route   GET /api/admin/users/export
// @access  Private/Admin
const exportUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users); // O front-end converte para CSV
  } catch (error) {
    res.status(500).json({ message: 'Erro na exportação' });
  }
};

// @desc    Buscar usuário por ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

// @desc    Atualizar usuário
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, planType, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    user.name = name || user.name;
    user.email = email || user.email;
    if (planType) user.plan.type = planType;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();
    res.json({ message: 'Usuário atualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

// @desc    Ativar/desativar usuário
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    user.isActive = isActive;
    await user.save();
    res.json({ message: `Usuário ${isActive ? 'ativado' : 'desativado'}` });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao alterar status' });
  }
};

// @desc    Listar transações
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';

    let filter = {};
    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      filter.user = { $in: users.map(u => u._id) };
    }
    if (statusFilter) filter.status = statusFilter;

    const transactions = await Transaction.find(filter)
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar transações' });
  }
};

// @desc    Exportar transações (CSV)
// @route   GET /api/admin/transactions/export
// @access  Private/Admin
const exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name').lean();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Erro na exportação' });
  }
};

// @desc    Listar mensagens recentes
// @route   GET /api/admin/messages
// @access  Private/Admin
const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const conversations = await Conversation.find()
      .populate('user', 'name email')
      .sort('-updatedAt')
      .limit(limit)
      .lean();

    const messages = conversations.flatMap(conv => 
      conv.messages.slice(-2).map(msg => ({
        user: conv.user,
        content: msg.content,
        response: msg.role === 'assistant' ? msg.content : conv.messages.find(m => m.role === 'assistant' && m.createdAt > msg.createdAt)?.content,
        createdAt: msg.createdAt,
      }))
    ).slice(0, limit);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
};

// @desc    Listar logs de atividades
// @route   GET /api/admin/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
  try {
    const search = req.query.search || '';
    const type = req.query.type || '';
    let filter = {};
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.action = { $regex: type, $options: 'i' };

    const logs = await Log.find(filter)
      .populate('user', 'name')
      .sort('-timestamp')
      .limit(100)
      .lean();

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar logs' });
  }
};

// @desc    Obter configurações atuais
// @route   GET /api/admin/config
// @access  Private/Admin
const getConfig = async (req, res) => {
  // Idealmente armazenar em um modelo Config, mas usaremos variáveis de ambiente ou um documento fixo
  res.json({
    freeMessageLimit: FREE_MESSAGE_LIMIT,
    prices: {
      basic: 29.90,
      pro: 79.90,
      enterprise: 199.90,
    },
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true' || false,
  });
};

// @desc    Atualizar limite de mensagens grátis
// @route   POST /api/admin/config/freeLimit
// @access  Private/Admin
const updateFreeLimit = async (req, res) => {
  try {
    const { limit } = req.body;
    // Salvar em variável de ambiente ou banco (aqui apenas exemplo)
    process.env.FREE_MESSAGE_LIMIT = limit;
    res.json({ message: 'Limite atualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar limite' });
  }
};

// @desc    Atualizar preços dos planos
// @route   POST /api/admin/config/prices
// @access  Private/Admin
const updatePrices = async (req, res) => {
  try {
    const { basic, pro, enterprise } = req.body;
    // Salvar em banco ou arquivo
    console.log('Preços atualizados:', { basic, pro, enterprise });
    res.json({ message: 'Preços atualizados' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar preços' });
  }
};

// @desc    Ativar/desativar modo de manutenção
// @route   POST /api/admin/config/maintenance
// @access  Private/Admin
const toggleMaintenance = async (req, res) => {
  try {
    const { enabled } = req.body;
    process.env.MAINTENANCE_MODE = enabled ? 'true' : 'false';
    res.json({ message: `Modo de manutenção ${enabled ? 'ativado' : 'desativado'}` });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao alterar modo de manutenção' });
  }
};

module.exports = {
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
};
