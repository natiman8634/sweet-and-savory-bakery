import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import storeRoutes from './routes/store.routes.js';
import { globalLimiter, sensitiveLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet());
app.use('/api/', globalLimiter);
app.use('/api/auth/login', sensitiveLimiter);
app.use('/api/orders', sensitiveLimiter);

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sweet & Savory Bakery API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      store: '/api',
      admin: '/api/admin',
      health: '/health'
    },
    documentation: '/api/docs' // Optional
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', storeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Handle specific error types
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

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use(errorHandler);

// ============================================
// STARTUP LOGGING
// ============================================
console.log('\n🚀 App configuration loaded:');
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
console.log(`  Body Limit: 10mb`);
console.log('  Routes:');
console.log('    - /api/auth (Authentication)');
console.log('    - /api (Store - Public)');
console.log('    - /api/admin (Store - Admin)');
console.log('    - /health (Health Check)');
console.log('');

export default app;