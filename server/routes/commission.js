const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCommissionRules,
  getCommissionRule,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  getProductRule,
  calculateCommission,
  getVendorCommissionSummary,
  getOrderCommissions,
} = require('../controllers/commissionController');

// All routes require authentication
router.use(protect);

// Admin only routes for rule management
router.route('/rules')
  .get(authorize('admin'), getCommissionRules)
  .post(authorize('admin'), createCommissionRule);

router.route('/rules/:id')
  .get(authorize('admin'), getCommissionRule)
  .put(authorize('admin'), updateCommissionRule)
  .delete(authorize('admin'), deleteCommissionRule);

// Get applicable rule for product (Admin or Vendor)
router.get('/rules/product/:productId', authorize('admin', 'vendor'), getProductRule);

// Calculate/preview commission (Admin or Vendor)
router.post('/calculate', authorize('admin', 'vendor'), calculateCommission);

// Vendor commission summary
router.get('/vendor/:vendorId/summary', authorize('admin', 'vendor'), getVendorCommissionSummary);

// Order commission details
router.get('/order/:orderId', authorize('admin', 'vendor'), getOrderCommissions);

module.exports = router;
