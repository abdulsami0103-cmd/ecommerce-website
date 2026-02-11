const ActivityLog = require('../models/ActivityLog');
const LoginAttempt = require('../models/LoginAttempt');
const ActiveSession = require('../models/ActiveSession');
const SecurityAlert = require('../models/SecurityAlert');
const securityService = require('../services/securityService');
const activityLogger = require('../services/activityLogger');

// @desc    Get activity logs
// @route   GET /api/admin/security/activity
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const {
      actorType,
      actorId,
      action,
      entityType,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filters = {};
    if (actorType) filters.actorType = actorType;
    if (actorId) filters.actorId = actorId;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (severity) filters.severity = severity;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const { logs, total } = await ActivityLog.getRecentActivity(filters, options);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity summary
// @route   GET /api/admin/security/activity/summary
// @access  Private/Admin
const getActivitySummary = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const summary = await ActivityLog.getActivitySummary(startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get login attempts
// @route   GET /api/admin/security/login-attempts
// @access  Private/Admin
const getLoginAttempts = async (req, res, next) => {
  try {
    const {
      email,
      ipAddress,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filters = {};
    if (email) filters.email = email;
    if (ipAddress) filters.ipAddress = ipAddress;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const { attempts, total } = await securityService.getLoginAttempts(filters, options);

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get failed login statistics
// @route   GET /api/admin/security/login-attempts/stats
// @access  Private/Admin
const getLoginStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const stats = await securityService.getFailedLoginStats(startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active sessions (admin view)
// @route   GET /api/admin/security/sessions
// @access  Private/Admin
const getAllSessions = async (req, res, next) => {
  try {
    const { userType, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (userType) filters.userType = userType;

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const { sessions, total } = await securityService.getAllActiveSessions(filters, options);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force terminate a session (admin)
// @route   DELETE /api/admin/security/sessions/:id
// @access  Private/Admin
const terminateSessionAdmin = async (req, res, next) => {
  try {
    const session = await securityService.terminateSession(
      req.params.id,
      req.user._id,
      'forced'
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Log the action
    await activityLogger.logAdminAction(
      'session_terminated',
      req.user,
      { type: 'Session', _id: req.params.id },
      req,
      { description: 'Admin terminated user session' }
    );

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get security alerts
// @route   GET /api/admin/security/alerts
// @access  Private/Admin
const getSecurityAlerts = async (req, res, next) => {
  try {
    const {
      alertType,
      severity,
      isResolved,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filters = {};
    if (alertType) filters.alertType = alertType;
    if (severity) filters.severity = severity;
    if (isResolved !== undefined) filters.isResolved = isResolved === 'true';
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const { alerts, total } = await securityService.getAlerts(filters, options);

    res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get alert summary
// @route   GET /api/admin/security/alerts/summary
// @access  Private/Admin
const getAlertSummary = async (req, res, next) => {
  try {
    const summary = await securityService.getAlertSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get alert trends
// @route   GET /api/admin/security/alerts/trends
// @access  Private/Admin
const getAlertTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const trends = await securityService.getAlertTrends(parseInt(days));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve a security alert
// @route   PUT /api/admin/security/alerts/:id/resolve
// @access  Private/Admin
const resolveAlert = async (req, res, next) => {
  try {
    const { resolutionNote, resolutionAction } = req.body;

    if (!resolutionNote) {
      return res.status(400).json({
        success: false,
        message: 'Resolution note is required',
      });
    }

    const alert = await securityService.resolveAlert(
      req.params.id,
      req.user._id,
      resolutionNote,
      resolutionAction || 'investigated'
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    // Log the action
    await activityLogger.logAdminAction(
      'alert_resolved',
      req.user,
      { type: 'SecurityAlert', _id: req.params.id },
      req,
      {
        description: 'Admin resolved security alert',
        resolutionNote,
        resolutionAction,
      }
    );

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single alert
// @route   GET /api/admin/security/alerts/:id
// @access  Private/Admin
const getAlert = async (req, res, next) => {
  try {
    const alert = await SecurityAlert.findById(req.params.id)
      .populate('resolvedBy', 'email profile.firstName profile.lastName')
      .populate('relatedAlerts');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own sessions
// @route   GET /api/user/sessions
// @access  Private
const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await securityService.getUserSessions(req.user._id);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Terminate user's own session
// @route   DELETE /api/user/sessions/:id
// @access  Private
const terminateUserSession = async (req, res, next) => {
  try {
    // Verify session belongs to user
    const session = await ActiveSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    await securityService.terminateSession(req.params.id, req.user._id, 'logout');

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Terminate all user's other sessions
// @route   DELETE /api/user/sessions
// @access  Private
const terminateAllUserSessions = async (req, res, next) => {
  try {
    const { currentSessionId } = req.body;

    await securityService.terminateAllSessions(
      req.user._id,
      currentSessionId,
      'forced'
    );

    res.status(200).json({
      success: true,
      message: 'All other sessions terminated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get security dashboard data
// @route   GET /api/admin/security/dashboard
// @access  Private/Admin
const getSecurityDashboard = async (req, res, next) => {
  try {
    const [
      alertSummary,
      recentAlerts,
      activeSessions,
      loginStats,
    ] = await Promise.all([
      securityService.getAlertSummary(),
      securityService.getRecentAlerts(5),
      securityService.getAllActiveSessions({}, { limit: 5 }),
      securityService.getFailedLoginStats(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    ]);

    res.status(200).json({
      success: true,
      data: {
        alertSummary,
        recentAlerts,
        recentSessions: activeSessions.sessions,
        totalActiveSessions: activeSessions.total,
        loginStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getActivitySummary,
  getLoginAttempts,
  getLoginStats,
  getAllSessions,
  terminateSessionAdmin,
  getSecurityAlerts,
  getAlertSummary,
  getAlertTrends,
  resolveAlert,
  getAlert,
  getUserSessions,
  terminateUserSession,
  terminateAllUserSessions,
  getSecurityDashboard,
};
