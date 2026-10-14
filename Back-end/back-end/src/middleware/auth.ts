import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.ts';
import { isAdminRole, isBackOfficeRole } from '../utils/roles.js';

// Define the structure of the data inside your token
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    roleId: number;
    email?: string;
    role?: {
      id: number;
      role_name: string;
    };
  };
}

// Token verification middleware
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
      userId: string; 
      roleId: number;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token.' 
    });
  }
};

// Authentication middleware that gets full user data
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      roleId: number;
      email: string;
    };

    // Get full user data with role
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = {
      userId: user.id,
      roleId: user.role_id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin authorization middleware
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // If user has full role object
    if (isAdminRole(req.user.role?.role_name)) {
      next();
      return;
    }

    // If we only have roleId, fetch the role
    if (req.user.roleId) {
      const role = await prisma.userRoles.findUnique({
        where: { id: req.user.roleId }
      });

      if (isAdminRole(role?.role_name)) {
        next();
        return;
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Staff authorization middleware — allows both Admin and Staff roles
export const requireStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // If user has full role object
    if (isBackOfficeRole(req.user.role?.role_name)) {
      next();
      return;
    }

    // If we only have roleId, fetch the role
    if (req.user.roleId) {
      const role = await prisma.userRoles.findUnique({
        where: { id: req.user.roleId }
      });

      if (isBackOfficeRole(role?.role_name)) {
        next();
        return;
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff privileges required.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Combined middleware for admin routes (auth + admin check)
export const adminAuth = [authenticate, requireAdmin];

// Combined middleware for back-office routes (auth + admin/staff check)
export const staffAuth = [authenticate, requireStaff];