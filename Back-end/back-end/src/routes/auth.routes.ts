import { Router } from 'express';
import { register, login } from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Example of a Protected Route (only accessible with a valid token)
router.get('/profile', verifyToken, (req, res) => {
  // Now you can access req.user.userId safely because of the interface above
  res.json({ message: 'This is protected data', user: (req as any).user });
});

export default router;