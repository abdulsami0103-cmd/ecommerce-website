const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTeamMembers,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  inviteTeamMember,
  acceptInvitation,
  updateMemberRole,
  removeTeamMember,
  getAuditLogs,
} = require('../controllers/vendorAccessController');

// Team routes
router.get('/', protect, authorize('vendor'), getTeamMembers);
router.post('/invite', protect, authorize('vendor'), inviteTeamMember);
router.post('/accept-invite', acceptInvitation); // Public route with token
router.put('/:id/role', protect, authorize('vendor'), updateMemberRole);
router.delete('/:id', protect, authorize('vendor'), removeTeamMember);

// Role routes
router.get('/roles', protect, authorize('vendor'), getRoles);
router.post('/roles', protect, authorize('vendor'), createRole);
router.put('/roles/:id', protect, authorize('vendor'), updateRole);
router.delete('/roles/:id', protect, authorize('vendor'), deleteRole);

// Audit logs
router.get('/audit-logs', protect, authorize('vendor'), getAuditLogs);

module.exports = router;
