import { rateLimit } from 'express-rate-limit';

// General limiter for all API routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-8', // Modern headers
    legacyHeaders: false, // Disable X-RateLimit headers
    message: { 
        success: false, 
        message: "Too many requests, please try again later." 
    }
});

// Stricter limiter for sensitive routes (Login/Orders)
export const sensitiveLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 5, // Only 5 requests allowed
    message: { 
        success: false, 
        message: "Too many attempts. Please wait 5 minutes." 
    }
});