const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPromotionSlots,
  getActivePromotions,
  trackClick,
  createPromotion,
  getVendorPromotions,
  getPromotion,
  updatePromotion,
  togglePausePromotion,
  cancelPromotion,
  getPromotionStats,
  getAllPromotions,
  reviewPromotion,
  createPromotionSlot,
  updatePromotionSlot,
  getBadges,
  createBadge,
  updateBadge,
  awardBadge,
  revokeBadge,
  getEntityBadges,
} = require('../controllers/promotionController');

// Public routes
router.get('/promotions/slots', getPromotionSlots);
router.get('/promotions/active/:placement', getActivePromotions);
router.post('/promotions/:id/click', trackClick);
router.get('/badges/:entityType/:entityId', getEntityBadges);

// Vendor routes
router.post('/vendor/promotions', protect, authorize('vendor'), createPromotion);
router.get('/vendor/promotions', protect, authorize('vendor'), getVendorPromotions);
router.get('/vendor/promotions/:id', protect, authorize('vendor'), getPromotion);
router.put('/vendor/promotions/:id', protect, authorize('vendor'), updatePromotion);
router.put('/vendor/promotions/:id/pause', protect, authorize('vendor'), togglePausePromotion);
router.put('/vendor/promotions/:id/resume', protect, authorize('vendor'), togglePausePromotion);
router.delete('/vendor/promotions/:id', protect, authorize('vendor'), cancelPromotion);
router.get('/vendor/promotions/:id/stats', protect, authorize('vendor'), getPromotionStats);

// Admin routes - Promotions
router.get('/admin/promotions', protect, authorize('admin'), getAllPromotions);
router.put('/admin/promotions/:id/review', protect, authorize('admin'), reviewPromotion);
router.get('/admin/promotions/:id/stats', protect, authorize('admin'), getPromotionStats);

// Admin routes - Promotion Slots
router.get('/admin/promotions/slots', protect, authorize('admin'), getPromotionSlots);
router.post('/admin/promotions/slots', protect, authorize('admin'), createPromotionSlot);
router.put('/admin/promotions/slots/:id', protect, authorize('admin'), updatePromotionSlot);

// Admin routes - Badges
router.get('/admin/badges', protect, authorize('admin'), getBadges);
router.post('/admin/badges', protect, authorize('admin'), createBadge);
router.put('/admin/badges/:id', protect, authorize('admin'), updateBadge);
router.post('/admin/badges/:id/award', protect, authorize('admin'), awardBadge);
router.delete('/admin/badges/entity/:id', protect, authorize('admin'), revokeBadge);

module.exports = router;
