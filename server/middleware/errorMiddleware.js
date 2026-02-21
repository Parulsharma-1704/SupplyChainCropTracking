import { errorResponse } from '../utils/responseUtils.js';

/**
 * Handle 404 errors
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  
  // Handle specific error types
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  console.error('Error:', err.message);
  return errorResponse(res, statusCode, message);
};