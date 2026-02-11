const activityLogger = require('../services/activityLogger');

/**
 * Middleware to automatically log CRUD operations
 * This middleware wraps controller functions to capture before/after states
 */

/**
 * Create a logging wrapper for controller functions
 * @param {Function} controllerFn - The controller function to wrap
 * @param {Object} options - Logging options
 */
const withActivityLogging = (controllerFn, options = {}) => {
  const {
    entityType,
    getEntityId = (req) => req.params.id,
    getOldData = null,
    action = null,
    skipLogging = () => false,
  } = options;

  return async (req, res, next) => {
    // Check if logging should be skipped
    if (skipLogging(req)) {
      return controllerFn(req, res, next);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    let oldData = null;

    // Try to get old data before operation (for updates/deletes)
    if (getOldData && req.params.id) {
      try {
        oldData = await getOldData(req.params.id);
      } catch (error) {
        console.error('[ActivityLoggerMiddleware] Failed to get old data:', error);
      }
    }

    // Override res.json to capture response data
    res.json = function (data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && data?.success !== false) {
        const detectedAction = action || detectAction(req.method, req.path);
        const user = req.user;

        if (user && detectedAction) {
          // Log the activity asynchronously
          setImmediate(async () => {
            try {
              const entityId = getEntityId(req) || data?.data?._id;

              await activityLogger.logWithDiff(
                user.role || 'customer',
                user._id,
                `${entityType?.toLowerCase() || 'resource'}_${detectedAction}`,
                entityType || 'Resource',
                entityId,
                oldData,
                data?.data,
                req
              );
            } catch (error) {
              console.error('[ActivityLoggerMiddleware] Failed to log activity:', error);
            }
          });
        }
      }

      // Call original json method
      return originalJson(data);
    };

    // Execute the original controller
    return controllerFn(req, res, next);
  };
};

/**
 * Detect action type from HTTP method and path
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 */
const detectAction = (method, path) => {
  const methodActionMap = {
    POST: 'created',
    PUT: 'updated',
    PATCH: 'updated',
    DELETE: 'deleted',
  };

  return methodActionMap[method.toUpperCase()];
};

/**
 * Express middleware to log all requests
 * Use this for general request logging (not specific CRUD operations)
 */
const requestLogger = (options = {}) => {
  const {
    excludePaths = ['/health', '/api/health', '/favicon.ico'],
    excludeMethods = [],
    logBody = false,
    logResponse = false,
  } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    const startTime = Date.now();

    // Store original end method
    const originalEnd = res.end.bind(res);

    res.end = function (chunk, encoding) {
      const duration = Date.now() - startTime;

      // Log request asynchronously
      setImmediate(() => {
        const logData = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0],
          userAgent: req.headers['user-agent'],
          userId: req.user?._id,
          userRole: req.user?.role,
        };

        if (logBody && req.body && Object.keys(req.body).length > 0) {
          // Sanitize body before logging
          logData.body = sanitizeRequestBody(req.body);
        }

        // Log error responses
        if (res.statusCode >= 400) {
          console.warn('[RequestLogger]', JSON.stringify(logData));
        }
      });

      return originalEnd(chunk, encoding);
    };

    next();
  };
};

/**
 * Sanitize request body for logging
 * @param {Object} body - Request body
 */
const sanitizeRequestBody = (body) => {
  const sensitiveFields = [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
    'creditCard',
    'cvv',
    'pin',
    'ssn',
  ];

  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Middleware to log specific security-sensitive operations
 */
const securityOperationLogger = (operationType) => {
  return async (req, res, next) => {
    const user = req.user;

    if (user) {
      await activityLogger.logSecurityEvent(
        operationType,
        user,
        req,
        {
          description: `Security operation: ${operationType}`,
          severity: 'high',
        }
      );
    }

    next();
  };
};

/**
 * Middleware to log admin operations
 */
const adminOperationLogger = (operationType) => {
  return async (req, res, next) => {
    const user = req.user;

    if (user && user.role === 'admin') {
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(async () => {
            try {
              await activityLogger.logAdminAction(
                operationType,
                user,
                {
                  type: req.params.type || 'Resource',
                  _id: req.params.id || data?.data?._id,
                },
                req,
                { description: `Admin ${operationType}` }
              );
            } catch (error) {
              console.error('[AdminLogger] Failed to log admin action:', error);
            }
          });
        }

        return originalJson(data);
      };
    }

    next();
  };
};

module.exports = {
  withActivityLogging,
  requestLogger,
  securityOperationLogger,
  adminOperationLogger,
  detectAction,
  sanitizeRequestBody,
};
