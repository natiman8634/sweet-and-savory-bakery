import { rateLimit } from 'express-rate-limit';

// General limiter for all API routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000, // Generous limit for normal app usage
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Too many requests, please try again later." 
    }
});

// Stricter limiter for sensitive routes (Login/Orders)
export const sensitiveLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 50, // Reasonable limit for auth attempts
    message: { 
        success: false, 
        message: "Too many attempts. Please wait 5 minutes." 
    }
});