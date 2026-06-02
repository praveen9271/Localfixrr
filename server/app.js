import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { sanitizeBody } from './middleware/sanitizeMiddleware.js';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { getEmailStatus } from './services/otpService.js';

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
const parseOrigins = (...values) => values
  .flatMap((value) => String(value || '').split(','))
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultClientOrigins = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000';
const configuredOrigins = parseOrigins(process.env.CLIENT_URL, process.env.CLIENT_ORIGINS);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : parseOrigins(defaultClientOrigins);

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin);
};

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    const error = new Error('Not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
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
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/user', userRoutes);
app.use('/api', bookingRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'LocalFixr API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'LocalFixr API',
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
    },
    email: getEmailStatus(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
