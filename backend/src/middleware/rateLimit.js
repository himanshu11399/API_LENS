import rateLimit from 'express-rate-limit';

// General API request limit: 150 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Authentication routes limit: 20 requests per 15 minutes (to prevent brute forcing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many login or registration attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset limit: 5 requests per 15 minutes (stricter to prevent abuse)
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many password reset attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Request execution rate limit: 10 requests per 1 minute per user / IP
export const requestExecutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 requests max per minute
  keyGenerator: (req) => {
    // Rate limit per logged in user ID if authenticated, else by client IP
    return req.user ? req.user.id : (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1');
  },
  message: {
    error: 'Rate limit exceeded: You can only send up to 10 requests per minute. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


