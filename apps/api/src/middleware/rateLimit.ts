import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for resource creation endpoints.
 * Limits each user to 20 creation requests per minute.
 * This helps prevent spam and abuse.
 */
export const createResourceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP address
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'You have created too many resources in a short period. Please try again later.',
      },
    });
  },
});
