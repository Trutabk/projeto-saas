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
const jwtAuth = require('./middleware/jwtAuth');
const errorMiddleware = require('./middleware/errorMiddleware');

// =======================
// Importação das rotas
// =======================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

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
// Configuração importante para cloud
// =======================
app.set('trust proxy', 1);

// =======================
// Segurança e performance
// =======================
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// =======================
// CORS seguro (usa variável FRONTEND_URL ou '*' em desenvolvimento)
// =======================
const allowedOrigin = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

app.options('*', cors());

// =======================
// Parser de JSON e URL encode
// =======================
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// =======================
// Rate Limiting profissional
// =======================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
// Health Check (Render usa isso)
// =======================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Projeto SaaS API',
    timestamp: new Date()
  });
});

// =======================
// Middleware JWT global
// =======================
app.use('/api', jwtAuth);

// =======================
// Rotas da API
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// =======================
// Middleware de erro global
// =======================
app.use(errorMiddleware);

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API pronta`);
  console.log('=================================');
});
