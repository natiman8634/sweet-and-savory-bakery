// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

// ✅ Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('Please create a .env file with DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL found in environment');

// ✅ Create Neon adapter for Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

// ✅ Initialize PrismaClient with adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// ✅ Handle connection events
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to database successfully!');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });

export default prisma;