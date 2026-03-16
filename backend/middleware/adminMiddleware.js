const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado: requer permissão de administrador' });
  }
};

module.exports = { admin };
