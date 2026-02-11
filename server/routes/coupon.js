const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCoupon,
  getCoupons,
  getCoupon,
  getVendorCoupons,
  validateCouponCode,
  applyCoupon,
  getAutoApplyCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats,
  getCouponDashboardStats,
} = require('../controllers/couponController');

// Public routes
router.get('/coupons/validate/:code', validateCouponCode);

// Customer routes (protected)
router.post('/coupons/apply', protect, applyCoupon);
router.get('/coupons/auto-apply', protect, getAutoApplyCoupons);

// Vendor routes
router.get('/vendor/coupons', protect, authorize('vendor'), getVendorCoupons);
router.post('/vendor/coupons', protect, authorize('vendor'), createCoupon);
router.put('/vendor/coupons/:id', protect, authorize('vendor'), updateCoupon);
router.delete('/vendor/coupons/:id', protect, authorize('vendor'), deleteCoupon);
router.put('/vendor/coupons/:id/toggle', protect, authorize('vendor'), toggleCouponStatus);
router.get('/vendor/coupons/:id/stats', protect, authorize('vendor'), getCouponStats);

// Admin routes
router.get('/admin/coupons', protect, authorize('admin'), getCoupons);
router.get('/admin/coupons/stats', protect, authorize('admin'), getCouponDashboardStats);
router.post('/admin/coupons', protect, authorize('admin'), createCoupon);
router.get('/admin/coupons/:id', protect, authorize('admin'), getCoupon);
router.put('/admin/coupons/:id', protect, authorize('admin'), updateCoupon);
router.delete('/admin/coupons/:id', protect, authorize('admin'), deleteCoupon);
router.put('/admin/coupons/:id/toggle', protect, authorize('admin'), toggleCouponStatus);
router.get('/admin/coupons/:id/stats', protect, authorize('admin'), getCouponStats);

module.exports = router;
