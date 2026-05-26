const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env before starting the server.');
  }

  try {
    const timeoutMs = Number(process.env.MONGODB_TIMEOUT_MS || 30000);
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      error.message = `${error.message}\n\nCheck that your MongoDB Atlas cluster is running and that your current IP address is allowed in Atlas Network Access.`;
    }
    throw error;
  }
};

module.exports = connectDB;
