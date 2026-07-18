import { prisma } from '../db.js';
import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../services/emailService.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  console.log("📝 Register Request Body:", req.body); 

  // ✅ Check if body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      success: false,
      error: "Request body is missing or not parsed. Make sure Content-Type is application/json" 
    });
  }

  // ✅ Check if body is empty
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      success: false,
      error: "Request body is empty. Please provide registration data." 
    });
  }

  const { email, password, full_name, phone, default_address } = req.body;

  // ✅ Validate required fields
  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and full name are required'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Transaction ensures atomicity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: { 
          email, 
          password: hashedPassword, 
          role_id: 3 // Assuming 3 = Customer
        },
        include: {
          profile: true,
          role: true
        }
      });
      
      await tx.customerProfiles.create({
        data: { 
          user_id: user.id, 
          full_name, 
          phone: phone || '', 
          default_address: default_address || '' 
        },
      });
      
      return user;
    });

    // Send welcome email (don't await - don't block response)
    sendWelcomeEmail(email, full_name)
      .catch(error => console.error('Failed to send welcome email:', error));

    // Generate token for auto-login after registration
    const token = jwt.sign(
      { userId: result.id, roleId: result.role_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: result.id,
      token
    });
  } catch (error) {
    console.error("Registration Error:", error);
    // ✅ Pass error to error handler
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🔐 Login Request Body:", req.body); 

  // ✅ Check if body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: "Request body is missing or not parsed. Make sure Content-Type is application/json"
    });
  }

  // ✅ Check if body is empty
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: "Request body is empty. Please provide email and password."
    });
  }

  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const user = await prisma.users.findUnique({ 
      where: { email },
      include: {
        role: true,
        profile: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        roleId: user.role_id,
        email: user.email,
        role: user.role?.role_name
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      message: 'Login successful', 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role?.role_name,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error("Login Error Details:", error); 
    // ✅ Pass error to error handler
    next(error);
  }
};

// Resend verification/welcome email
export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user from authenticated request
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Send welcome email again
    await sendWelcomeEmail(
      user.email, 
      user.profile?.full_name || 'Customer'
    );

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    next(error);
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role?.role_name,
        profile: user.profile,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    next(error);
  }
};