import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import storeRoutes from './routes/store.routes.js';
import { globalLimiter, sensitiveLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

const app = express();
app.use(requestLogger);

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

// ✅ Body parsing middleware (CRITICAL - must be before routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ DEBUG: Log all requests to see what's coming in
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  console.log(`  Headers:`, {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'Bearer ***' : 'None'
  });
  console.log(`  Body:`, req.body);
  console.log(`  Body type:`, typeof req.body);
  console.log(`  Body keys:`, req.body ? Object.keys(req.body) : 'No body');
  next();
});

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

// ✅ TEST ROUTE - Add this to test body parsing directly
app.post('/test-body', (req, res) => {
  console.log('✅ Test body received:', req.body);
  res.json({
    success: true,
    message: 'Body parsing is working!',
    receivedBody: req.body,
    contentType: req.headers['content-type']
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', storeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found (must come before error handler)
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Global error handler
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
console.log('    - /test-body (Test Route)');
console.log('');

export default app;