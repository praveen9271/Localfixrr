import { v2 as cloudinary } from 'cloudinary';

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ensureCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'secure' && !value)
    .map(([key]) => key.toUpperCase());

  if (missing.length) {
    const error = new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
    error.statusCode = 500;
    throw error;
  }

  cloudinary.config(config);
  return cloudinary;
};

export { cloudinary, ensureCloudinaryConfigured };
