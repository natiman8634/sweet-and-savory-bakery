import type { Response } from 'express';
import prisma from '../lib/prisma.js';
import type { AuthRequest } from '../middleware/auth.js'; 

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Extract and validate ID safely
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'ID must be a number' });
    }

    // 2. Perform the update
    const updatedNotification = await prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true }
    });

    res.json({ 
      success: true, 
      message: 'Notification marked as read',
      data: updatedNotification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Handle case where ID doesn't exist
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};