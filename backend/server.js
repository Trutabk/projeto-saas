/**
 * Server SaaS Profissional
 * =========================
 *
 * Recursos incluídos:
 * - Express com JSON e URL encode
 * - Segurança com Helmet
 * - CORS seguro
 * - Compressão de respostas
 * - Logging com Morgan
 * - Rate Limiting
 * - Conexão MongoDB robusta com retry
 * - Middleware JWT global (com exceções para rotas públicas)
 * - Uploads estáticos
 * - Middleware de erro global
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const jwtAuth = require('./middleware/jwtAuth'); // Middleware JWT (deve ignorar rotas públicas)
const errorMiddleware = require('./middleware/errorMiddleware');

dotenv.config();

// =======================
// Conectar ao MongoDB com retry
// =======================
(async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB conectado com sucesso');
  } catch (err) {
    console.error('❌ Falha ao conectar MongoDB:', err);
    process.exit(1);
  }
})();

const app = express();

// =======================
// Segurança e performance
// =======================
app.use(helmet());              // Proteção HTTP headers
app.use(compression());         // Comprimir respostas JSON/HTML
app.use(morgan('dev'));         // Logging de requisições

// =======================
// CORS seguro
// =======================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  credentials: true
}));

// =======================
// Parser de JSON e URL encode
// =======================
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// =======================
// Rate Limiting profissional
// =======================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                 // máximo de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Muitas requisições, tente novamente mais tarde.'
  }
});
app.use('/api/', apiLimiter);

// =======================
// Servir arquivos estáticos (uploads)
// =======================
app.use('/uploads', express.static(path.join(__dirname, '../frontend/assets/uploads')));

// =======================
// Middleware JWT global para rotas protegidas
// =======================
// ATENÇÃO: Este middleware é aplicado a todas as rotas /api/*.
// Ele deve ser configurado para ignorar rotas públicas como:
// - /api/auth/register, /api/auth/login, /api/auth/forgot-password, /api/auth/reset-password
// - /api/payments/webhook (webhook do Mercado Pago)
// Caso contrário, essas rotas retornarão erro de autenticação.
app.use('/api', jwtAuth);

// =======================
// Rotas da API
// =======================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// =======================
// Middleware de erro global
// =======================
app.use(errorMiddleware);

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
