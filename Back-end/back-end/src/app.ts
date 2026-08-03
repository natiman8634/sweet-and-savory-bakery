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
// ✅ MIDDLEWARE - ORDER MATTERS!
// ============================================

// ✅ 1. CORS - MUST BE FIRST
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ 3. Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ✅ 4. Rate limiting
app.use('/api/', globalLimiter);
app.use('/api/auth/login', sensitiveLimiter);
app.use('/api/orders', sensitiveLimiter);

// ✅ 5. Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ 6. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ 7. Lightweight request handling
app.use((req, res, next) => {
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
    documentation: '/api/docs'
  });
});

// ✅ TEST ROUTE
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

// 404 - Route not found
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
console.log(`  CORS Origins: http://localhost:5173, http://localhost:3000`);
console.log(`  Body Limit: 10mb`);
console.log('  Routes:');
console.log('    - /api/auth (Authentication)');
console.log('    - /api (Store - Public)');
console.log('    - /api/admin (Store - Admin)');
console.log('    - /health (Health Check)');
console.log('    - /test-body (Test Route)');
console.log('');

export default app;