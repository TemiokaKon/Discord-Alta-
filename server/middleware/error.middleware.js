const config = require('../config/environment');

/**
 * Not found handler
 */
function notFound(req, res, next) {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.isProduction && statusCode === 500 
        ? 'Internal server error' 
        : err.message,
      timestamp: new Date().toISOString(),
      ...(config.isDevelopment && { stack: err.stack })
    }
  });
}

/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create error with status code
 */
function createError(message, status = 500, code = 'ERROR') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  createError
};
