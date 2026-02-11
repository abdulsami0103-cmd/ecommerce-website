const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getLoyaltyPoints,
  getReferralStats,
  applyReferralCode,
  redeemPoints,
  getLeaderboard,
} = require('../controllers/loyaltyController');

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.use(protect);

router.get('/', getLoyaltyPoints);
router.get('/referrals', getReferralStats);
router.post('/apply-referral', applyReferralCode);
router.post('/redeem', redeemPoints);

module.exports = router;
