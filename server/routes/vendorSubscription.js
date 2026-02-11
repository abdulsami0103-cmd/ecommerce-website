const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlans,
  getCurrentSubscription,
  subscribe,
  changePlan,
  cancelSubscription,
  getSubscriptionHistory,
  checkPlanLimits,
  createPlan,
  updatePlan,
} = require('../controllers/vendorSubscriptionController');

// Public routes
router.get('/plans', getPlans);

// Vendor routes
router.get('/', protect, authorize('vendor'), getCurrentSubscription);
router.post('/subscribe', protect, authorize('vendor'), subscribe);
router.post('/change', protect, authorize('vendor'), changePlan);
router.post('/cancel', protect, authorize('vendor'), cancelSubscription);
router.get('/history', protect, authorize('vendor'), getSubscriptionHistory);
router.get('/limits', protect, authorize('vendor'), checkPlanLimits);

// Admin routes
router.post('/admin/plans', protect, authorize('admin'), createPlan);
router.put('/admin/plans/:id', protect, authorize('admin'), updatePlan);

module.exports = router;
