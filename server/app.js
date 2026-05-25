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
app.use(helmet());
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
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
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
