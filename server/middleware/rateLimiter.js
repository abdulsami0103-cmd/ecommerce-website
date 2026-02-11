const rateLimit = require('express-rate-limit');
const LoginAttempt = require('../models/LoginAttempt');
const SecurityAlert = require('../models/SecurityAlert');
const { RATE_LIMITS, IP_BLOCKING, isIPWhitelisted } = require('../config/securityRules');

/**
 * Store for tracking blocked IPs in memory
 * In production, use Redis for distributed systems
 */
const blockedIPs = new Map();

/**
 * Check if an IP is blocked
 * @param {string} ip - IP address to check
 */
const isIPBlocked = (ip) => {
  if (isIPWhitelisted(ip)) return false;

  const blockInfo = blockedIPs.get(ip);
  if (!blockInfo) return false;

  if (Date.now() > blockInfo.expiresAt) {
    blockedIPs.delete(ip);
    return false;
  }

  return true;
};

/**
 * Block an IP address
 * @param {string} ip - IP address to block
 * @param {number} durationMinutes - Duration in minutes
 */
const blockIP = (ip, durationMinutes = IP_BLOCKING.defaultBlockDuration) => {
  if (isIPWhitelisted(ip)) return false;

  const existingBlock = blockedIPs.get(ip);
  const blockCount = existingBlock ? existingBlock.blockCount + 1 : 1;

  blockedIPs.set(ip, {
    blockedAt: Date.now(),
    expiresAt: Date.now() + durationMinutes * 60 * 1000,
    blockCount,
    isPermanent: blockCount >= IP_BLOCKING.permanentBlockThreshold,
  });

  return true;
};

/**
 * Unblock an IP address
 * @param {string} ip - IP address to unblock
 */
const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  return true;
};

/**
 * IP blocking middleware
 * Checks if the request IP is blocked
 */
const ipBlockingMiddleware = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

  if (isIPBlocked(ip)) {
    const blockInfo = blockedIPs.get(ip);
    const remainingMinutes = Math.ceil((blockInfo.expiresAt - Date.now()) / 60000);

    return res.status(403).json({
      success: false,
      message: blockInfo.isPermanent
        ? 'Your IP has been permanently blocked due to repeated violations.'
        : `Your IP has been temporarily blocked. Try again in ${remainingMinutes} minutes.`,
      code: 'IP_BLOCKED',
    });
  }

  next();
};

/**
 * Login rate limiter
 * More aggressive rate limiting for login endpoints
 */
const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.login.windowMinutes * 60 * 1000,
  max: RATE_LIMITS.login.maxAttempts,
  message: {
    success: false,
    message: `Too many login attempts. Please try again in ${RATE_LIMITS.login.windowMinutes} minutes.`,
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use combination of IP and email for more accurate limiting
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const email = req.body?.email || 'unknown';
    return `${ip}:${email}`;
  },
  handler: async (req, res, options) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

    // Block IP after exceeding limit
    blockIP(ip, RATE_LIMITS.login.lockoutMinutes);

    // Create security alert
    await SecurityAlert.createAlert({
      alertType: 'brute_force',
      severity: 'high',
      title: 'Rate Limit Exceeded - Login',
      description: `IP ${ip} exceeded login rate limit`,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
      details: {
        email: req.body?.email,
        limit: RATE_LIMITS.login.maxAttempts,
        window: `${RATE_LIMITS.login.windowMinutes} minutes`,
      },
    });

    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    return isIPWhitelisted(ip);
  },
});

/**
 * API rate limiter
 * General rate limiting for API endpoints
 */
const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.api.windowMinutes * 60 * 1000,
  max: RATE_LIMITS.api.maxRequests,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  },
  skip: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    return isIPWhitelisted(ip);
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.passwordReset.windowMinutes * 60 * 1000,
  max: RATE_LIMITS.passwordReset.maxAttempts,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const email = req.body?.email || 'unknown';
    return `pwd-reset:${ip}:${email}`;
  },
});

/**
 * Custom rate limiter for sensitive operations
 * @param {Object} options - Rate limit options
 */
const createSensitiveOperationLimiter = (options) => {
  return rateLimit({
    windowMs: (options.windowMinutes || 60) * 60 * 1000,
    max: options.maxAttempts || 10,
    message: {
      success: false,
      message: options.message || 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
      const userId = req.user?._id || 'anonymous';
      return `${options.prefix || 'op'}:${ip}:${userId}`;
    },
    skip: (req) => {
      const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
      return isIPWhitelisted(ip);
    },
  });
};

/**
 * Export data rate limiter
 */
const exportRateLimiter = createSensitiveOperationLimiter({
  prefix: 'export',
  windowMinutes: 24 * 60, // 24 hours
  maxAttempts: RATE_LIMITS.export.maxPerDay,
  message: 'You have reached the maximum number of exports for today.',
});

/**
 * Middleware to record login attempts and check for blocking
 */
const loginAttemptMiddleware = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const email = req.body?.email;

  if (!email) {
    return next();
  }

  // Check if should block based on previous attempts
  const shouldBlock = await LoginAttempt.shouldBlockLogin(email, ip);

  if (shouldBlock.blocked) {
    return res.status(429).json({
      success: false,
      message: shouldBlock.message,
      code: shouldBlock.reason,
      lockoutMinutes: shouldBlock.lockoutMinutes,
    });
  }

  // Add attempts remaining to request for later use
  req.loginAttemptsRemaining = shouldBlock.attemptsRemaining;

  next();
};

module.exports = {
  ipBlockingMiddleware,
  loginRateLimiter,
  apiRateLimiter,
  passwordResetRateLimiter,
  exportRateLimiter,
  loginAttemptMiddleware,
  createSensitiveOperationLimiter,
  blockIP,
  unblockIP,
  isIPBlocked,
};
