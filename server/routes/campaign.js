const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  scheduleCampaign,
  pauseCampaign,
  cancelCampaign,
  getCampaignStats,
  getSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushToken,
  unsubscribe,
} = require('../controllers/campaignController');

// User notification preferences
router.get('/notifications/preferences', protect, getNotificationPreferences);
router.put('/notifications/preferences', protect, updateNotificationPreferences);
router.post('/notifications/push-token', protect, registerPushToken);

// Public unsubscribe
router.post('/notifications/unsubscribe', unsubscribe);

// Admin campaign routes
router.get('/admin/campaigns', protect, authorize('admin'), getCampaigns);
router.post('/admin/campaigns', protect, authorize('admin'), createCampaign);
router.get('/admin/campaigns/:id', protect, authorize('admin'), getCampaign);
router.put('/admin/campaigns/:id', protect, authorize('admin'), updateCampaign);
router.post('/admin/campaigns/:id/schedule', protect, authorize('admin'), scheduleCampaign);
router.put('/admin/campaigns/:id/pause', protect, authorize('admin'), pauseCampaign);
router.delete('/admin/campaigns/:id', protect, authorize('admin'), cancelCampaign);
router.get('/admin/campaigns/:id/stats', protect, authorize('admin'), getCampaignStats);

// Admin segment routes
router.get('/admin/segments', protect, authorize('admin'), getSegments);
router.post('/admin/segments', protect, authorize('admin'), createSegment);
router.put('/admin/segments/:id', protect, authorize('admin'), updateSegment);
router.delete('/admin/segments/:id', protect, authorize('admin'), deleteSegment);

module.exports = router;
