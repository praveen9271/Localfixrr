const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { sanitizeBody } = require('./middleware/sanitizeMiddleware');

// Load env vars
dotenv.config({ quiet: true });

const app = express();

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');
const allowedOrigins = String(process.env.CLIENT_URL || process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
const allowVercelOrigins = process.env.ALLOW_VERCEL_ORIGINS !== 'false';

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  if (allowVercelOrigins) {
    try {
      return new URL(normalizedOrigin).hostname.endsWith('.vercel.app');
    } catch {
      return false;
    }
  }

  return false;
};

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    const error = new Error('Not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeBody);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/provider', require('./routes/providerRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'LocalFixr API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'LocalFixr API',
    database: {
      connected: require('mongoose').connection.readyState === 1,
      state: require('mongoose').connection.readyState,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
