import dns from 'node:dns';
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
dns.setDefaultResultOrder('ipv4first');

const configureDnsServers = () => {
  const dnsServers = String(process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!dnsServers.length) return;

  try {
    dns.setServers(dnsServers);
    console.log(`Using custom DNS servers: ${dnsServers.join(', ')}`);
  } catch (error) {
    console.warn(`Invalid DNS_SERVERS value ignored: ${error.message}`);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env before starting the server.');
  }

  try {
    configureDnsServers();
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
      error.message = `${error.message}\n\nCheck MongoDB Atlas Network Access for your local machine. If DNS lookup fails, set DNS_SERVERS=8.8.8.8,1.1.1.1 in server/.env while testing.`;
    }
    throw error;
  }
};

export default connectDB;
