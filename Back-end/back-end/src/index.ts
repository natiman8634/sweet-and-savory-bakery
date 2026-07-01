// src/index.ts
import 'dotenv/config';  // ✅ MUST BE FIRST - Load .env before anything else
import app from './app.js';

const PORT = process.env.PORT || 3000;

// ✅ Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('📁 Current working directory:', process.cwd());
  console.error('📁 Please create a .env file with DATABASE_URL');
  console.error('📁 Expected location:', process.cwd() + '/.env');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully!');
console.log('📡 Database:', process.env.DATABASE_URL.substring(0, 50) + '...');

app.listen(PORT, () => {
  console.log(`🚀 Bakery API is running on port ${PORT}`);
  console.log(`📦 Health check: http://localhost:${PORT}/`);
  console.log(`📦 API endpoints: http://localhost:${PORT}/api/products`);
  console.log(`📦 API endpoints: http://localhost:${PORT}/api/categories`);
  console.log(`📦 API endpoints: http://localhost:${PORT}/api/orders`);
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received: closing HTTP server');
  process.exit(0);
});