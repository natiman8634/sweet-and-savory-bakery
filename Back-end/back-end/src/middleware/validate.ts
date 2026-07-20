import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

export const validate = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          // Explicitly typing 'err' as 'any' or 'ZodIssue' to satisfy TS
          errors: error.issues.map((err: any) => ({ 
            field: err.path[0], 
            message: err.message 
          }))
        });
      }
      next(error);
    }
  };