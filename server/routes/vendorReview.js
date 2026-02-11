const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVendorReviews,
  getVendorReviewStats,
  replyToReview,
  updateReviewReply,
  deleteReviewReply,
  getReviewWithReply,
} = require('../controllers/vendorReviewController');

// Public routes
router.get('/reviews/:id', getReviewWithReply);

// Vendor routes
router.get('/vendor/reviews', protect, authorize('vendor'), getVendorReviews);
router.get('/vendor/reviews/stats', protect, authorize('vendor'), getVendorReviewStats);
router.post('/vendor/reviews/:id/reply', protect, authorize('vendor'), replyToReview);
router.put('/vendor/reviews/:id/reply', protect, authorize('vendor'), updateReviewReply);
router.delete('/vendor/reviews/:id/reply', protect, authorize('vendor'), deleteReviewReply);

module.exports = router;
