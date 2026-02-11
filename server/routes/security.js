const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/securityController');

// Admin routes - require admin role
router.use('/admin/security', protect, authorize('admin'));

// Dashboard
router.get('/admin/security/dashboard', getSecurityDashboard);

// Activity logs
router.get('/admin/security/activity', getActivityLogs);
router.get('/admin/security/activity/summary', getActivitySummary);

// Login attempts
router.get('/admin/security/login-attempts', getLoginAttempts);
router.get('/admin/security/login-attempts/stats', getLoginStats);

// Sessions management
router.get('/admin/security/sessions', getAllSessions);
router.delete('/admin/security/sessions/:id', terminateSessionAdmin);

// Security alerts
router.get('/admin/security/alerts', getSecurityAlerts);
router.get('/admin/security/alerts/summary', getAlertSummary);
router.get('/admin/security/alerts/trends', getAlertTrends);
router.get('/admin/security/alerts/:id', getAlert);
router.put('/admin/security/alerts/:id/resolve', resolveAlert);

// User routes - authenticated users can manage their own sessions
router.get('/user/sessions', protect, getUserSessions);
router.delete('/user/sessions/:id', protect, terminateUserSession);
router.delete('/user/sessions', protect, terminateAllUserSessions);

module.exports = router;
