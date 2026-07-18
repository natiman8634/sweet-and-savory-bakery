import { Router } from 'express';
import { 
  register, 
  login, 
  resendVerification, 
  getProfile 
} from '../controllers/auth.js';
import { verifyToken, authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/register', register);
router.post('/login', login);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// 🟢 Get user profile
router.get('/profile', verifyToken, getProfile);

// 🟢 TASK 3: Resend verification/welcome email
router.post('/resend-verification', verifyToken, resendVerification);

// 🟢 Alternative: Using authenticate middleware (if you have it)
// router.get('/profile', authenticate, getProfile);
// router.post('/resend-verification', authenticate, resendVerification);

// ============================================
// DEBUG: Log routes when router is created
// ============================================
console.log('\n🔄 Auth Router created with routes:');
router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    const path = layer.route.path;
    const hasAuth = layer.route.stack.some((s: any) => 
      s.handle?.name === 'verifyToken' || s.handle?.name === 'authenticate'
    );
    console.log(`  ${methods} /api/auth${path} ${hasAuth ? '🔒' : '🌐'}`);
  }
});
console.log('');

export default router;