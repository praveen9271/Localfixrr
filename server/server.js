const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const DB_RETRY_MS = Number(process.env.MONGODB_RETRY_MS || 30000);
let server;
let dbRetryTimer;

const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = [];
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'localfixr-dev-secret') missing.push('JWT_SECRET');

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
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
