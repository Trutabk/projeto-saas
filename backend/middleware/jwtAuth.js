const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Lista de rotas públicas que não exigem autenticação
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/payments/webhook'
];

module.exports = async (req, res, next) => {
  try {
    // Verifica se a rota atual é pública
    const currentPath = req.path;
    if (publicRoutes.some(route => currentPath.includes(route))) {
      return next(); // Ignora autenticação
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    // Verifica JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Busca usuário
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    req.user = user; // Anexa usuário à requisição

    // A verificação de limite de mensagens foi movida para o chatController
    // Não deve ser feita aqui para não bloquear rotas como pagamento

    next(); // Passa para a rota protegida
  } catch (error) {
    console.error('Erro no JWT Auth Middleware:', error);
    return res.status(401).json({ message: 'Falha na autenticação', error: error.message });
  }
};
