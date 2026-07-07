import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the structure of the data inside your token
interface AuthRequest extends Request {
  user?: {
    userId: string;
    roleId: number;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; roleId: number };
    req.user = decoded; // Now strictly typed
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};