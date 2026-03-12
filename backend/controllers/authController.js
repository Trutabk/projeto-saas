const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Registrar usuário
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const user = await User.create({ name, email, password, phone });
    if (user) {
      const token = generateToken(user._id);
      user.tokens.push({ token });
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(400).json({ message: 'Dados inválidos' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      user.tokens.push({ token });
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Email ou senha inválidos' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (remover token atual)
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { tokens: { token } } }
    );
    res.json({ message: 'Logout realizado' });
  } catch (error) {
    next(error);
  }
};

// @desc    Recuperar senha (enviar email profissional)
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos
    await user.save();

    // Link de recuperação
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    // Template HTML profissional
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #0a0a1a; color: #fff; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; }
          h2 { color: #a5b1ff; margin-bottom: 20px; }
          p { color: #ccc; line-height: 1.6; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 0.9rem; color: #777; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 Recuperação de Senha</h2>
          <p>Olá, <strong>${user.name}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>SaaS AI</strong>.</p>
          <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>10 minutos</strong>.</p>
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
          <p>Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.</p>
          <div class="footer">
            <p>© 2026 SaaS AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Versão em texto plano (fallback)
    const textContent = `Olá ${user.name},\n\nRecebemos uma solicitação para redefinir a senha da sua conta no SaaS AI. Acesse o link abaixo para criar uma nova senha. Este link é válido por 10 minutos:\n\n${resetUrl}\n\nSe você não solicitou esta alteração, ignore este e-mail.\n\nAtenciosamente,\nEquipe SaaS AI`;

    try {
      await sendEmail({
        toEmail: user.email,
        subject: '🔐 Recuperação de Senha - SaaS AI',
        text: textContent,
        html: htmlContent,
      });
      res.json({ message: 'E-mail de recuperação enviado com sucesso!' });
    } catch (error) {
      // Se falhar ao enviar e-mail, remove o token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Erro ao enviar e-mail. Tente novamente mais tarde.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Resetar senha (recebe token no corpo)
// @route   PUT /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};
