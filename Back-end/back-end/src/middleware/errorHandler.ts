import type { Request, Response, NextFunction } from 'express';

// Define a standard error structure
export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // ✅ Log full error details for debugging
  console.error('❌ Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  });

  // ✅ Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors || err.message
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma specific errors
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Unique constraint violation',
          error: 'A record with this value already exists'
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Record not found',
          error: 'The requested record does not exist'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Database error',
          error: err.message
        });
    }
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Please provide a valid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Please refresh your authentication token'
    });
  }

  // ✅ Handle body parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      error: 'Please check your request body format'
    });
  }

  // ✅ Handle the specific "Cannot destructure property 'email' of 'req.body'" error
  if (err.message && err.message.includes('Cannot destructure property')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body',
      error: 'Make sure you are sending a valid JSON body with the required fields',
      hint: 'Check that Content-Type header is set to application/json'
    });
  }

  // ✅ Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    // Only show stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};