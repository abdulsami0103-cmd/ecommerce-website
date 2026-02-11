const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Vendor wallet
  getWallet,
  getWalletTransactions,
  getExpectedEarnings,
  // Payout requests
  requestPayout,
  getPayoutRequests,
  getPayoutRequest,
  cancelPayoutRequest,
  // Payout settings
  getPayoutSettings,
  updatePayoutSettings,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  // Admin
  getAllPayoutRequests,
  startReview,
  approvePayout,
  rejectPayout,
  processPayout,
  verifyPaymentMethod,
} = require('../controllers/payoutController');

// All routes require authentication
router.use(protect);

// ============ VENDOR ROUTES ============

// Wallet
router.get('/wallet', authorize('vendor'), getWallet);
router.get('/wallet/transactions', authorize('vendor'), getWalletTransactions);
router.get('/wallet/expected', authorize('vendor'), getExpectedEarnings);

// Payout requests
router.post('/request', authorize('vendor'), requestPayout);
router.get('/requests', authorize('vendor'), getPayoutRequests);
router.get('/requests/:id', authorize('vendor'), getPayoutRequest);
router.delete('/requests/:id', authorize('vendor'), cancelPayoutRequest);

// Payout settings
router.get('/settings', authorize('vendor'), getPayoutSettings);
router.put('/settings', authorize('vendor'), updatePayoutSettings);
router.post('/settings/methods', authorize('vendor'), addPaymentMethod);
router.put('/settings/methods/:methodId', authorize('vendor'), updatePaymentMethod);
router.delete('/settings/methods/:methodId', authorize('vendor'), removePaymentMethod);

// ============ ADMIN ROUTES ============

router.get('/admin', authorize('admin'), getAllPayoutRequests);
router.put('/admin/:id/review', authorize('admin'), startReview);
router.put('/admin/:id/approve', authorize('admin'), approvePayout);
router.put('/admin/:id/reject', authorize('admin'), rejectPayout);
router.put('/admin/:id/process', authorize('admin'), processPayout);
router.put('/admin/verify-method/:vendorId/:methodId', authorize('admin'), verifyPaymentMethod);

module.exports = router;
