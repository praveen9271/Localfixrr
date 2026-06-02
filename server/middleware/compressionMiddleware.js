import zlib from 'zlib';

const MIN_COMPRESS_BYTES = 1024;

const shouldCompress = (req, res, body) => {
  if (!/\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) return false;
  if (res.getHeader('Content-Encoding')) return false;
  if (req.method === 'HEAD') return false;
  if (!(typeof body === 'string' || Buffer.isBuffer(body))) return false;

  const length = Buffer.byteLength(body);
  return length >= MIN_COMPRESS_BYTES;
};

const gzipCompression = (req, res, next) => {
  const originalSend = res.send.bind(res);

  res.send = function sendCompressed(body) {
    if (!shouldCompress(req, res, body)) {
      return originalSend(body);
    }

    const source = Buffer.isBuffer(body) ? body : Buffer.from(body);
    zlib.gzip(source, (error, compressed) => {
      if (error || res.headersSent) {
        originalSend(body);
        return;
      }

      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.removeHeader('Content-Length');
      originalSend(compressed);
    });

    return res;
  };

  next();
};

export default gzipCompression;
