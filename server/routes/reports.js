const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlatformOverview,
  getRevenueByVendor,
  getRevenueByCategory,
  getRevenueByPeriod,
  getVendorEarnings,
  getTopProducts,
  getPayoutStats,
  exportReport,
  triggerAggregation,
} = require('../controllers/reportsController');

// All routes require authentication
router.use(protect);

// ============ ADMIN ROUTES ============

// Platform overview
router.get('/admin/overview', authorize('admin'), getPlatformOverview);

// Revenue breakdowns
router.get('/admin/by-vendor', authorize('admin'), getRevenueByVendor);
router.get('/admin/by-category', authorize('admin'), getRevenueByCategory);
router.get('/admin/by-period', authorize('admin'), getRevenueByPeriod);

// Top performers
router.get('/admin/top-products', authorize('admin'), getTopProducts);

// Payout statistics
router.get('/admin/payouts', authorize('admin'), getPayoutStats);

// Export reports
router.post('/export', authorize('admin'), exportReport);

// Trigger aggregation manually
router.post('/admin/aggregate', authorize('admin'), triggerAggregation);

// ============ VENDOR ROUTES ============

// Vendor earnings
router.get('/vendor/earnings', authorize('vendor'), getVendorEarnings);

module.exports = router;
