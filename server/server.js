import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;
const DB_RETRY_MS = Number(process.env.MONGODB_RETRY_MS || 30000);
let server;
let dbRetryTimer;

const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = [];
  const weak = [];
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (process.env.JWT_SECRET === 'localfixr-dev-secret') weak.push('JWT_SECRET');
  if (!process.env.OTP_SECRET) missing.push('OTP_SECRET');
  if (process.env.OTP_SECRET === 'replace-with-a-different-long-random-secret') weak.push('OTP_SECRET');
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.EMAIL_FROM && !process.env.RESEND_FROM) missing.push('EMAIL_FROM');
  if (!process.env.CLIENT_URL && !process.env.CLIENT_ORIGINS) missing.push('CLIENT_URL');
  if (!process.env.ADMIN_EMAIL) missing.push('ADMIN_EMAIL');

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (weak.length) {
    throw new Error(`Replace weak development secrets before production: ${weak.join(', ')}`);
  }
};

const scheduleDbReconnect = () => {
  if (dbRetryTimer) return;

  dbRetryTimer = setTimeout(async () => {
    dbRetryTimer = null;
    await connectWithRetry();
  }, DB_RETRY_MS);
};

const connectWithRetry = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection failed. API is running with database-backed routes unavailable.');
    console.error(error.message);
    scheduleDbReconnect();
  }
};

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  connectWithRetry();
};

try {
  validateProductionEnv();
  startServer();
} catch (error) {
  console.error('Failed to start server:');
  console.error(error);
  process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:');
  console.error(error);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:');
  console.error(error);
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  if (dbRetryTimer) clearTimeout(dbRetryTimer);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
