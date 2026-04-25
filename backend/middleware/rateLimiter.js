import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` for auth endpoints
    message: {
        success: false,
        message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 5 phút."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const generalRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        success: false,
        message: "Quá nhiều yêu cầu, vui lòng thử lại sau."
    }
});
