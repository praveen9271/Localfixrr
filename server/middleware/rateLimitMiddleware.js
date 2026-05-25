const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests. Please try again later.' } = {}) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.originalUrl.split('?')[0]}`;
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (entry.resetAt <= now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }

    return next();
  };
};

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
});

const otpRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OTP_RATE_LIMIT_MAX || 10),
  message: 'Too many OTP requests. Please wait and try again.',
});

const chatRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.CHAT_RATE_LIMIT_MAX || 25),
  message: 'Too many chat messages. Please wait a moment and try again.',
});

module.exports = {
  authRateLimit,
  chatRateLimit,
  createRateLimiter,
  otpRateLimit,
};
