const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((clean, [key, nestedValue]) => {
    if (key.startsWith('$') || key.includes('.')) return clean;
    clean[key] = sanitizeValue(nestedValue);
    return clean;
  }, {});
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

export { sanitizeBody, sanitizeValue };
