const ActivityLog = require('../models/ActivityLog');

/**
 * Activity Logger Service
 * Provides centralized logging for all user and system activities
 */
class ActivityLoggerService {
  /**
   * Log a simple activity
   * @param {Object} data - Activity data
   */
  async log(data) {
    try {
      return await ActivityLog.log(data);
    } catch (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      // Don't throw - logging should not break the main flow
      return null;
    }
  }

  /**
   * Log activity with before/after diff
   * @param {string} actorType - Type of actor (admin, vendor, customer, system)
   * @param {string} actorId - ID of the actor
   * @param {string} action - Action performed
   * @param {string} entityType - Type of entity affected
   * @param {string} entityId - ID of entity affected
   * @param {Object} oldData - Data before change
   * @param {Object} newData - Data after change
   * @param {Object} req - Express request object (optional)
   */
  async logWithDiff(actorType, actorId, action, entityType, entityId, oldData, newData, req = null) {
    try {
      return await ActivityLog.logWithDiff(
        actorType,
        actorId,
        action,
        entityType,
        entityId,
        oldData,
        newData,
        req
      );
    } catch (error) {
      console.error('[ActivityLogger] Failed to log activity with diff:', error);
      return null;
    }
  }

  /**
   * Log a login event
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   * @param {boolean} success - Whether login was successful
   */
  async logLogin(user, req, success = true) {
    const action = success ? 'login_success' : 'login_failed';
    const severity = success ? 'low' : 'medium';

    return this.log({
      actorType: user.role || 'customer',
      actorId: user._id,
      action,
      entityType: 'User',
      entityId: user._id,
      description: `User ${success ? 'logged in' : 'failed to login'}: ${user.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0],
      userAgent: req.headers['user-agent'],
      severity,
      metadata: {
        email: user.email,
        success,
      },
    });
  }

  /**
   * Log a logout event
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   */
  async logLogout(user, req) {
    return this.log({
      actorType: user.role || 'customer',
      actorId: user._id,
      action: 'logout',
      entityType: 'User',
      entityId: user._id,
      description: `User logged out: ${user.email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0],
      userAgent: req.headers['user-agent'],
      severity: 'low',
    });
  }

  /**
   * Log a CRUD operation
   * @param {string} operation - create, update, delete
   * @param {string} entityType - Type of entity
   * @param {Object} entity - Entity object
   * @param {Object} user - User performing the action
   * @param {Object} req - Express request object
   * @param {Object} oldData - Previous data (for update)
   */
  async logCRUD(operation, entityType, entity, user, req, oldData = null) {
    const actionMap = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
    };

    const severityMap = {
      create: 'low',
      update: 'low',
      delete: 'medium',
    };

    const logData = {
      actorType: user.role || 'customer',
      actorId: user._id,
      action: `${entityType.toLowerCase()}_${actionMap[operation]}`,
      entityType,
      entityId: entity._id,
      description: `${entityType} ${actionMap[operation]}: ${entity.name || entity.title || entity._id}`,
      severity: severityMap[operation],
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0],
      userAgent: req?.headers?.['user-agent'],
    };

    if (operation === 'update' && oldData) {
      logData.oldValues = this.sanitizeData(oldData);
      logData.newValues = this.sanitizeData(entity.toObject ? entity.toObject() : entity);
    } else if (operation === 'create') {
      logData.newValues = this.sanitizeData(entity.toObject ? entity.toObject() : entity);
    } else if (operation === 'delete') {
      logData.oldValues = this.sanitizeData(entity.toObject ? entity.toObject() : entity);
    }

    return this.log(logData);
  }

  /**
   * Log a security event
   * @param {string} action - Security action
   * @param {Object} user - User involved
   * @param {Object} req - Express request object
   * @param {Object} details - Additional details
   */
  async logSecurityEvent(action, user, req, details = {}) {
    return this.log({
      actorType: user?.role || 'system',
      actorId: user?._id,
      action,
      entityType: 'Security',
      description: details.description || `Security event: ${action}`,
      severity: details.severity || 'high',
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0],
      userAgent: req?.headers?.['user-agent'],
      metadata: details,
    });
  }

  /**
   * Log a financial transaction
   * @param {string} action - Transaction type
   * @param {Object} transaction - Transaction details
   * @param {Object} user - User performing/affected
   * @param {Object} req - Express request object
   */
  async logFinancialEvent(action, transaction, user, req) {
    return this.log({
      actorType: user.role || 'customer',
      actorId: user._id,
      action,
      entityType: 'Transaction',
      entityId: transaction._id,
      description: `Financial event: ${action} - Amount: ${transaction.amount}`,
      severity: 'high',
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0],
      userAgent: req?.headers?.['user-agent'],
      metadata: {
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
      },
    });
  }

  /**
   * Log admin action
   * @param {string} action - Admin action
   * @param {Object} admin - Admin user
   * @param {Object} target - Target entity/user
   * @param {Object} req - Express request object
   * @param {Object} details - Additional details
   */
  async logAdminAction(action, admin, target, req, details = {}) {
    return this.log({
      actorType: 'admin',
      actorId: admin._id,
      action: `admin_${action}`,
      entityType: target.type || 'Admin',
      entityId: target._id,
      description: details.description || `Admin action: ${action}`,
      severity: details.severity || 'high',
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0],
      userAgent: req?.headers?.['user-agent'],
      metadata: {
        targetType: target.type,
        targetId: target._id,
        ...details,
      },
    });
  }

  /**
   * Get recent activity for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   */
  async getUserActivity(userId, limit = 50) {
    return ActivityLog.getRecentActivity(
      { actorId: userId },
      { limit }
    );
  }

  /**
   * Get activity summary
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  async getActivitySummary(startDate, endDate) {
    return ActivityLog.getActivitySummary(startDate, endDate);
  }

  /**
   * Sanitize data for logging (remove sensitive fields)
   * @param {Object} data - Data to sanitize
   */
  sanitizeData(data) {
    if (!data) return null;

    const sensitiveFields = [
      'password',
      'passwordResetToken',
      'passwordResetExpire',
      'twoFactorSecret',
      'bankDetails',
      'ssn',
      'taxId',
      'creditCard',
      'cvv',
      'pin',
    ];

    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Deep sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        if (Array.isArray(sanitized[key])) {
          sanitized[key] = sanitized[key].map(item =>
            typeof item === 'object' ? this.sanitizeData(item) : item
          );
        } else {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
    });

    return sanitized;
  }
}

module.exports = new ActivityLoggerService();
