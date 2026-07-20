import type { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Initialize cache with a standard TTL
const cache = new NodeCache({ stdTTL: 300 }); // 300 seconds (5 minutes)

export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate a unique key based on the URL
    const key = req.originalUrl || req.url;
    const cachedData = cache.get(key);

    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    // Intercept res.json to store in cache
    const originalJson = res.json;
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      return originalJson.call(res, body);
    };

    next();
  };
};