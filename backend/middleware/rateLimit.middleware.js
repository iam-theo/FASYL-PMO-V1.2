import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    skipSuccessfulRequests: true,

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },

    standardHeaders: true,
    legacyHeaders: false
})

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,

    message: {
        success: false,
        message: "Too many login attempts. Try again in 1 minute.",
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const registerLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 1 hour
    max: 10,
    skipSuccessfulRequests: true,

    message: {
        success: false,
        message: "Too many registration attempts, try again in 2mins.",
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,

    message: {
        success: false,
        message: "Too many token refresh attempts.",
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const writeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,

    message: {
        success: false,
        message: "Too many write operations.",
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    skipSuccessfulRequests: true,

    message: {
        success: false,
        message: "Too many file uploads.",
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const authSlowDown = slowDown({
    windowMs: 1 * 60 * 1000,

    delayAfter: 3,

    delayMs: () => 500,

    maxDelayMs: 5000,
});