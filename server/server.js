const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
let server;

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  connectDB().catch((error) => {
    console.error('MongoDB connection failed. Starting API in demo mode.');
    console.error(error.message);
  });
};

try {
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
