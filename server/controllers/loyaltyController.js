const LoyaltyPoints = require('../models/LoyaltyPoints');
const Referral = require('../models/Referral');
const User = require('../models/User');

// Loyalty Points Configuration
const POINTS_CONFIG = {
  pointsPerDollar: 10, // Earn 10 points per $1 spent
  pointsValue: 0.01, // 1 point = $0.01 (100 points = $1)
  signupBonus: 100, // Bonus points for signing up
  referralBonus: 500, // Points for successful referral
  referredBonus: 200, // Points for being referred
  tierMultipliers: {
    bronze: 1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2,
  },
};

// @desc    Get user's loyalty points
// @route   GET /api/loyalty
// @access  Private
const getLoyaltyPoints = async (req, res, next) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: req.user.id });

    // Create loyalty record if doesn't exist
    if (!loyalty) {
      loyalty = await LoyaltyPoints.create({
        user: req.user.id,
      });
      // Give signup bonus
      await loyalty.addPoints(POINTS_CONFIG.signupBonus, 'bonus', 'Welcome bonus for joining!');
    }

    res.status(200).json({
      success: true,
      data: {
        totalPoints: loyalty.totalPoints,
        availablePoints: loyalty.availablePoints,
        lifetimePoints: loyalty.lifetimePoints,
        tier: loyalty.tier,
        referralCode: loyalty.referralCode,
        pointsValue: POINTS_CONFIG.pointsValue,
        transactions: loyalty.transactions.slice(-20).reverse(), // Last 20 transactions
      },
      config: POINTS_CONFIG,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get referral stats
// @route   GET /api/loyalty/referrals
// @access  Private
const getReferralStats = async (req, res, next) => {
  try {
    const loyalty = await LoyaltyPoints.findOne({ user: req.user.id });

    if (!loyalty) {
      return res.status(200).json({
        success: true,
        data: {
          referralCode: null,
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalEarned: 0,
          referrals: [],
        },
      });
    }

    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referred', 'email profile createdAt')
      .sort({ createdAt: -1 });

    const completedReferrals = referrals.filter((r) => r.status === 'rewarded').length;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
    const totalEarned = referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        referralCode: loyalty.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${loyalty.referralCode}`,
        totalReferrals: referrals.length,
        completedReferrals,
        pendingReferrals,
        totalEarned,
        referralBonus: POINTS_CONFIG.referralBonus,
        referrals: referrals.map((r) => ({
          id: r._id,
          email: r.referred?.email,
          name: `${r.referred?.profile?.firstName || ''} ${r.referred?.profile?.lastName || ''}`.trim(),
          status: r.status,
          rewardAmount: r.rewardAmount,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply referral code during registration
// @route   POST /api/loyalty/apply-referral
// @access  Private
const applyReferralCode = async (req, res, next) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required',
      });
    }

    // Check if user already has a referrer
    const existingReferral = await Referral.findOne({ referred: req.user.id });
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'You have already used a referral code',
      });
    }

    // Find referrer by code
    const referrerLoyalty = await LoyaltyPoints.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrerLoyalty) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code',
      });
    }

    // Can't refer yourself
    if (referrerLoyalty.user.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use your own referral code',
      });
    }

    // Create referral record
    await Referral.create({
      referrer: referrerLoyalty.user,
      referred: req.user.id,
      referralCode: referralCode.toUpperCase(),
      status: 'pending',
    });

    // Give bonus points to referred user
    let userLoyalty = await LoyaltyPoints.findOne({ user: req.user.id });
    if (!userLoyalty) {
      userLoyalty = await LoyaltyPoints.create({ user: req.user.id });
    }
    await userLoyalty.addPoints(POINTS_CONFIG.referredBonus, 'referral', 'Bonus for using referral code');

    res.status(200).json({
      success: true,
      message: `Referral code applied! You earned ${POINTS_CONFIG.referredBonus} bonus points!`,
      pointsEarned: POINTS_CONFIG.referredBonus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem points at checkout
// @route   POST /api/loyalty/redeem
// @access  Private
const redeemPoints = async (req, res, next) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please specify points to redeem',
      });
    }

    const loyalty = await LoyaltyPoints.findOne({ user: req.user.id });

    if (!loyalty || loyalty.availablePoints < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
      });
    }

    const discountValue = points * POINTS_CONFIG.pointsValue;

    // Don't actually deduct yet - this will be done when order is placed
    res.status(200).json({
      success: true,
      data: {
        pointsToRedeem: points,
        discountValue,
        remainingPoints: loyalty.availablePoints - points,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/loyalty/leaderboard
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await LoyaltyPoints.find()
      .populate('user', 'profile')
      .sort({ lifetimePoints: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: leaderboard.map((l, index) => ({
        rank: index + 1,
        name: `${l.user?.profile?.firstName || 'User'} ${l.user?.profile?.lastName?.[0] || ''}.`,
        points: l.lifetimePoints,
        tier: l.tier,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Award points for order (called after order completion)
const awardPointsForOrder = async (userId, orderId, orderTotal) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: userId });

    if (!loyalty) {
      loyalty = await LoyaltyPoints.create({ user: userId });
    }

    // Calculate points with tier multiplier
    const basePoints = Math.floor(orderTotal * POINTS_CONFIG.pointsPerDollar);
    const multiplier = POINTS_CONFIG.tierMultipliers[loyalty.tier] || 1;
    const earnedPoints = Math.floor(basePoints * multiplier);

    await loyalty.addPoints(earnedPoints, 'earned', `Points earned from order`, orderId);

    // Check if this is first purchase from a referral
    const referral = await Referral.findOne({
      referred: userId,
      status: 'pending',
      firstPurchaseCompleted: false,
    });

    if (referral) {
      // Mark referral as completed
      referral.status = 'rewarded';
      referral.firstPurchaseCompleted = true;
      referral.firstPurchaseOrderId = orderId;
      referral.rewardAmount = POINTS_CONFIG.referralBonus;
      await referral.save();

      // Award bonus to referrer
      const referrerLoyalty = await LoyaltyPoints.findOne({ user: referral.referrer });
      if (referrerLoyalty) {
        await referrerLoyalty.addPoints(
          POINTS_CONFIG.referralBonus,
          'referral',
          'Referral bonus - friend made first purchase'
        );
      }
    }

    return earnedPoints;
  } catch (error) {
    console.error('Error awarding points:', error);
    return 0;
  }
};

module.exports = {
  getLoyaltyPoints,
  getReferralStats,
  applyReferralCode,
  redeemPoints,
  getLeaderboard,
  awardPointsForOrder,
  POINTS_CONFIG,
};
