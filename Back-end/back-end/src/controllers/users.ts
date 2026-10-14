import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js'; 
import bcrypt from 'bcrypt';  

interface AuthRequest extends Request {
  user?: { userId: string };
}

// GET /api/users/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Use findFirst because findUnique does not support complex where clauses like deleted_at
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        deleted_at: null,
      },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { full_name, phone, default_address } = req.body;
  try {
    // Use update({ where: { user_id: ... } }) because user_id is @unique in your schema
    const updatedProfile = await prisma.customerProfiles.update({
      where: { user_id: userId },
      data: { full_name, phone, default_address },
    });
    res.json({ success: true, data: updatedProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

// GET /api/admin/users
export const getAllUsers = async (req: Request, res: Response) => {
  const { role, page = '1', limit = '10' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  try {
    const where: any = { deleted_at: null }; // typed dynamically to avoid exact-optional conflicts
    if (role) where.role = { role_name: role as string };

    const users = await prisma.users.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: { profile: true, role: true },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🟢 Cast to string to fix error 2412
  const { role_id } = req.body;

  try {
    const updatedUser = await prisma.users.update({
      where: { id },
      data: { role_id }
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating role' });
  }
};

// POST /api/admin/users/staff
// Creates a new Staff account (Admin only)
export const createStaff = async (req: Request, res: Response) => {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email and password are required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const staffRole = await prisma.userRoles.findUnique({
      where: { role_name: 'Staff' }
    });
    if (!staffRole) {
      return res.status(500).json({
        success: false,
        message: 'Staff role is not configured'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: { email, password: hashedPassword, role_id: staffRole.id },
        include: { role: true }
      });

      await tx.customerProfiles.create({
        data: {
          user_id: user.id,
          full_name,
          phone: phone || '',
          default_address: ''
        }
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: {
        id: staff.id,
        email: staff.email,
        role: staff.role.role_name
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Error creating staff account' });
  }
};

// PATCH /api/admin/users/:id/reset-password
// Admin resets a user's password without knowing the current one
export const resetUserPassword = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({
      success: false,
      message: 'new_password is required'
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  try {
    const user = await prisma.users.findFirst({
      where: { id, deleted_at: null },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.users.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🟢 Cast to string to fix error 2412
  try {
    const data: Prisma.UsersUpdateInput = { deleted_at: new Date() };
    await prisma.users.update({
      where: { id },
      data,
    });
    res.json({ success: true, message: 'User soft-deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

// 🆕 PATCH /api/users/change-password
export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { current_password, new_password } = req.body;

  // Validate input
  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Both current_password and new_password are required'
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  try {
    // Get user with current password
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};