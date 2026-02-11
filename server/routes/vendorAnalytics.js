const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVendorAnalytics,
  getRealtimeStats,
  getTopProducts,
  getCustomerAnalytics,
  getAllVendorsAnalytics,
} = require('../controllers/vendorAnalyticsController');

// Vendor routes
router.get('/', protect, authorize('vendor'), getVendorAnalytics);
router.get('/realtime', protect, authorize('vendor'), getRealtimeStats);
router.get('/top-products', protect, authorize('vendor'), getTopProducts);
router.get('/customers', protect, authorize('vendor'), getCustomerAnalytics);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllVendorsAnalytics);

module.exports = router;
