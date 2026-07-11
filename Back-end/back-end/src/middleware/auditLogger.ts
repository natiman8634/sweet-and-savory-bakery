import type { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import type { AuthRequest } from './auth.js';

export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Only audit sensitive write operations
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
    const userId = req.user?.userId || 'system';
    
    // We use a 'finish' listener to log the action after the response is sent
    res.on('finish', async () => {
      // Only log if the operation was successful (200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // This will now work correctly after running 'npx prisma generate'
          await (prisma as any).auditLogs.create({
            data: {
              user_id: userId,
              action: `${req.method} ${req.originalUrl}`,
              endpoint: req.originalUrl,
            }
          });
        } catch (err) {
          console.error('Audit log failed to write to database:', err);
        }
      }
    });
  }
  next();
};