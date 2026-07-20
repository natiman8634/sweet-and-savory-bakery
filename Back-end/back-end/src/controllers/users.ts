import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js'; 

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