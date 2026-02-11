const LoginAttempt = require('../models/LoginAttempt');
const ActiveSession = require('../models/ActiveSession');
const SecurityAlert = require('../models/SecurityAlert');
const {
  SECURITY_RULES,
  SEVERITY_LEVELS,
  RATE_LIMITS,
  IP_BLOCKING,
  getRulesByEvent,
  isIPWhitelisted,
} = require('../config/securityRules');

/**
 * Security Service
 * Handles security-related operations including login tracking,
 * session management, and alert generation
 */
class SecurityService {
  /**
   * Record a login attempt
   * @param {Object} data - Login attempt data
   */
  async recordLoginAttempt(data) {
    try {
      await LoginAttempt.record(data);

      // Evaluate security rules if login failed
      if (data.status === 'failed') {
        await this.evaluateSecurityRules('login_failed', data);
      }

      return true;
    } catch (error) {
      console.error('[SecurityService] Failed to record login attempt:', error);
      return false;
    }
  }

  /**
   * Check if login should be blocked
   * @param {string} email - User email
   * @param {string} ipAddress - IP address
   */
  async checkLoginAttempts(email, ipAddress) {
    // Check if IP is whitelisted
    if (isIPWhitelisted(ipAddress)) {
      return { blocked: false };
    }

    return LoginAttempt.shouldBlockLogin(email, ipAddress);
  }

  /**
   * Create a new session
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   */
  async createSession(user, req) {
    try {
      const { session, rawToken } = await ActiveSession.createSession(user, req);

      // Check for suspicious sessions
      const suspiciousCheck = await ActiveSession.checkSuspiciousSessions(user._id);
      if (suspiciousCheck.suspicious) {
        await this.createAlert({
          alertType: 'unusual_location',
          severity: 'medium',
          actorType: user.role || 'customer',
          actorId: user._id,
          title: 'Login From Multiple Locations',
          description: `User logged in from multiple countries: ${suspiciousCheck.countries.join(', ')}`,
          details: suspiciousCheck,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      return { session, rawToken };
    } catch (error) {
      console.error('[SecurityService] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Validate a session
   * @param {string} token - Session token
   */
  async validateSession(token) {
    try {
      const session = await ActiveSession.findByToken(token);
      if (!session) {
        return { valid: false, reason: 'Session not found or expired' };
      }

      // Update last active time
      await ActiveSession.updateActivity(token);

      return { valid: true, session };
    } catch (error) {
      console.error('[SecurityService] Failed to validate session:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Terminate a session
   * @param {string} sessionId - Session ID
   * @param {string} terminatedBy - User ID who terminated
   * @param {string} reason - Termination reason
   */
  async terminateSession(sessionId, terminatedBy = null, reason = 'logout') {
    try {
      return await ActiveSession.terminate(sessionId, terminatedBy, reason);
    } catch (error) {
      console.error('[SecurityService] Failed to terminate session:', error);
      throw error;
    }
  }

  /**
   * Terminate all sessions for a user
   * @param {string} userId - User ID
   * @param {string} currentSessionId - Current session to exclude
   * @param {string} reason - Termination reason
   */
  async terminateAllSessions(userId, currentSessionId = null, reason = 'security') {
    try {
      if (currentSessionId) {
        return await ActiveSession.terminateAllExcept(userId, currentSessionId, reason);
      }
      return await ActiveSession.terminateAll(userId, reason);
    } catch (error) {
      console.error('[SecurityService] Failed to terminate all sessions:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   * @param {string} userId - User ID
   */
  async getUserSessions(userId) {
    return ActiveSession.getUserSessions(userId);
  }

  /**
   * Get all active sessions (admin)
   * @param {Object} filters - Filter options
   * @param {Object} options - Pagination options
   */
  async getAllActiveSessions(filters = {}, options = {}) {
    return ActiveSession.getAllActiveSessions(filters, options);
  }

  /**
   * Evaluate security rules for an event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  async evaluateSecurityRules(eventType, eventData) {
    const rules = getRulesByEvent(eventType);

    for (const rule of rules) {
      try {
        const triggered = await this.checkRuleCondition(rule, eventData);

        if (triggered) {
          // Create alert
          await this.createAlert({
            alertType: rule.name,
            severity: rule.severity,
            actorType: eventData.actorType || 'unknown',
            actorId: eventData.actorId || eventData.userId,
            title: rule.alertTitle,
            description: rule.alertDescription,
            details: eventData,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent,
            triggeredRule: rule.name,
          });

          // Execute auto-actions
          if (rule.autoBlock?.enabled) {
            await this.executeAutoActions(rule, eventData);
          }
        }
      } catch (error) {
        console.error(`[SecurityService] Error evaluating rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Check if a rule condition is met
   * @param {Object} rule - Security rule
   * @param {Object} eventData - Event data
   */
  async checkRuleCondition(rule, eventData) {
    const { condition } = rule;

    switch (condition.event) {
      case 'login_failed': {
        if (condition.groupBy?.includes('ipAddress')) {
          const counts = await LoginAttempt.countFailedAttempts(
            eventData.email,
            eventData.ipAddress,
            condition.windowMinutes
          );
          return counts.byIP >= condition.threshold;
        }
        if (condition.groupBy?.includes('email')) {
          const counts = await LoginAttempt.countFailedAttempts(
            eventData.email,
            eventData.ipAddress,
            condition.windowMinutes
          );
          return counts.byEmail >= condition.threshold;
        }
        break;
      }

      case 'login_success': {
        if (condition.checkNewLocation) {
          // Check if this is a new location
          const recentSessions = await ActiveSession.find({
            userId: eventData.userId,
            createdAt: {
              $gte: new Date(Date.now() - condition.lookbackDays * 24 * 60 * 60 * 1000),
            },
            'location.countryCode': { $exists: true },
          }).lean();

          const knownCountries = [...new Set(
            recentSessions.map(s => s.location?.countryCode).filter(Boolean)
          )];

          return eventData.countryCode && !knownCountries.includes(eventData.countryCode);
        }
        break;
      }

      default:
        return false;
    }

    return false;
  }

  /**
   * Execute automatic actions for a triggered rule
   * @param {Object} rule - Security rule
   * @param {Object} eventData - Event data
   */
  async executeAutoActions(rule, eventData) {
    const actions = rule.actions || [];

    for (const action of actions) {
      try {
        switch (action) {
          case 'block_ip':
            // In a real implementation, this would add IP to a blocked list
            console.log(`[SecurityService] Would block IP: ${eventData.ipAddress}`);
            break;

          case 'lock_account':
            // In a real implementation, this would lock the user account
            console.log(`[SecurityService] Would lock account: ${eventData.email}`);
            break;

          case 'require_2fa':
            // In a real implementation, this would require 2FA
            console.log(`[SecurityService] Would require 2FA for: ${eventData.userId}`);
            break;

          case 'hold_payout':
            // In a real implementation, this would hold the payout
            console.log(`[SecurityService] Would hold payout for review`);
            break;

          case 'alert_admin':
            // Admin alerts are created automatically via createAlert
            break;

          case 'alert_user':
            // In a real implementation, this would send user notification
            console.log(`[SecurityService] Would alert user: ${eventData.userId}`);
            break;
        }
      } catch (error) {
        console.error(`[SecurityService] Failed to execute action ${action}:`, error);
      }
    }
  }

  /**
   * Create a security alert
   * @param {Object} alertData - Alert data
   */
  async createAlert(alertData) {
    try {
      const alert = await SecurityAlert.createAlert(alertData);

      // If critical, could trigger immediate notification
      const severityConfig = SEVERITY_LEVELS[alertData.severity];
      if (severityConfig?.notifyImmediately) {
        // In a real implementation, this would send immediate notification
        console.log(`[SecurityService] CRITICAL ALERT: ${alertData.title}`);
      }

      return alert;
    } catch (error) {
      console.error('[SecurityService] Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Resolve a security alert
   * @param {string} alertId - Alert ID
   * @param {string} resolvedBy - User ID who resolved
   * @param {string} resolutionNote - Resolution note
   * @param {string} resolutionAction - Action taken
   */
  async resolveAlert(alertId, resolvedBy, resolutionNote, resolutionAction = 'investigated') {
    return SecurityAlert.resolve(alertId, resolvedBy, resolutionNote, resolutionAction);
  }

  /**
   * Get security alerts
   * @param {Object} filters - Filter options
   * @param {Object} options - Pagination options
   */
  async getAlerts(filters = {}, options = {}) {
    return SecurityAlert.getAlerts(filters, options);
  }

  /**
   * Get alert summary
   */
  async getAlertSummary() {
    return SecurityAlert.getSummary();
  }

  /**
   * Get recent alerts
   * @param {number} limit - Number of alerts
   */
  async getRecentAlerts(limit = 10) {
    return SecurityAlert.getRecentAlerts(limit);
  }

  /**
   * Get login attempts
   * @param {Object} filters - Filter options
   * @param {Object} options - Pagination options
   */
  async getLoginAttempts(filters = {}, options = {}) {
    return LoginAttempt.getRecentAttempts(filters, options);
  }

  /**
   * Get failed login statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  async getFailedLoginStats(startDate, endDate) {
    return LoginAttempt.getFailedLoginStats(startDate, endDate);
  }

  /**
   * Get alert trends
   * @param {number} days - Number of days
   */
  async getAlertTrends(days = 30) {
    return SecurityAlert.getAlertTrends(days);
  }
}

module.exports = new SecurityService();
