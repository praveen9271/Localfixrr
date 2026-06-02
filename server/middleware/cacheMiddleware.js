const cacheStore = new Map();

const getCacheKey = (req) => `${req.method}:${req.originalUrl}`;

const cacheResponse = (ttlSeconds = 60) => (req, res, next) => {
  if (req.method !== 'GET') {
    next();
    return;
  }

  const key = getCacheKey(req);
  const cached = cacheStore.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`);
    res.status(cached.status).json(cached.body);
    return;
  }

  if (cached) cacheStore.delete(key);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheStore.set(key, {
        status: res.statusCode,
        body,
        expiresAt: now + ttlSeconds * 1000,
      });
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`);
    }

    return originalJson(body);
  };

  next();
};

export { cacheResponse };
