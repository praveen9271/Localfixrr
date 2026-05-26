const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Server error';

  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'This origin is not allowed to access the API';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource id';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${field} already exists`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.id,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
