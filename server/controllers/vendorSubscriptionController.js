const Vendor = require('../models/Vendor');
const VendorPlan = require('../models/VendorPlan');
const VendorSubscription = require('../models/VendorSubscription');
const AuditLog = require('../models/AuditLog');

// @desc    Get all plans
// @route   GET /api/vendor/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const plans = await VendorPlan.find({ isActive: true }).sort('sortOrder');

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current subscription
// @route   GET /api/vendor/subscription
// @access  Private (Vendor)
exports.getCurrentSubscription = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const subscription = await VendorSubscription.findOne({
      vendor: vendor._id,
      status: { $in: ['active', 'trialing', 'past_due'] },
    }).populate('plan');

    if (!subscription) {
      // Return basic plan info if no subscription
      const basicPlan = await VendorPlan.findOne({ slug: 'basic' });
      return res.json({
        success: true,
        data: {
          plan: basicPlan,
          status: 'none',
          message: 'No active subscription. Using free tier.',
        },
      });
    }

    res.json({
      success: true,
      data: {
        subscription,
        plan: subscription.plan,
        daysUntilExpiry: subscription.daysUntilExpiry(),
        isActive: subscription.isActive(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe to a plan
// @route   POST /api/vendor/subscription/subscribe
// @access  Private (Vendor)
exports.subscribe = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const plan = await VendorPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if already subscribed
    const existingSubscription = await VendorSubscription.findOne({
      vendor: vendor._id,
      status: { $in: ['active', 'trialing'] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Already have an active subscription. Please upgrade or cancel first.',
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // For free plan, skip payment
    if (plan.price[billingCycle] === 0) {
      const subscription = await VendorSubscription.create({
        vendor: vendor._id,
        plan: plan._id,
        billingCycle,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
      });

      vendor.currentPlan = plan._id;
      vendor.subscriptionStatus = 'active';
      vendor.commissionRate = plan.commissionRate;
      await vendor.save();

      return res.json({
        success: true,
        message: 'Subscribed to free plan successfully',
        data: subscription,
      });
    }

    // For paid plans, create pending subscription and return payment intent
    // TODO: Integrate with Stripe for actual payment
    const subscription = await VendorSubscription.create({
      vendor: vendor._id,
      plan: plan._id,
      billingCycle,
      status: 'active', // In production, set to 'pending' until payment
      startDate,
      endDate,
      lastPaymentDate: startDate,
      nextPaymentDate: endDate,
      lastPaymentAmount: plan.price[billingCycle],
      autoRenew: true,
    });

    vendor.currentPlan = plan._id;
    vendor.subscriptionStatus = 'active';
    vendor.commissionRate = plan.commissionRate;
    await vendor.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'subscription_upgraded',
      resourceType: 'subscription',
      resourceId: subscription._id,
      description: `Subscribed to ${plan.name} plan`,
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: `Subscribed to ${plan.name} plan successfully`,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade/downgrade subscription
// @route   POST /api/vendor/subscription/change
// @access  Private (Vendor)
exports.changePlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const newPlan = await VendorPlan.findById(planId);
    if (!newPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const subscription = await VendorSubscription.findOne({
      vendor: vendor._id,
      status: { $in: ['active', 'trialing'] },
    }).populate('plan');

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const oldPlan = subscription.plan;
    const isUpgrade = newPlan.price.monthly > oldPlan.price.monthly;

    // Update subscription
    subscription.previousPlan = oldPlan._id;
    subscription.plan = newPlan._id;
    if (billingCycle) subscription.billingCycle = billingCycle;

    if (isUpgrade) {
      subscription.upgradedAt = new Date();
    } else {
      subscription.downgradedAt = new Date();
    }

    await subscription.save();

    // Update vendor
    vendor.currentPlan = newPlan._id;
    vendor.commissionRate = newPlan.commissionRate;
    await vendor.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: isUpgrade ? 'subscription_upgraded' : 'subscription_downgraded',
      resourceType: 'subscription',
      resourceId: subscription._id,
      description: `${isUpgrade ? 'Upgraded' : 'Downgraded'} from ${oldPlan.name} to ${newPlan.name}`,
      changes: { before: oldPlan.name, after: newPlan.name },
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: `Plan ${isUpgrade ? 'upgraded' : 'downgraded'} successfully`,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel subscription
// @route   POST /api/vendor/subscription/cancel
// @access  Private (Vendor)
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const subscription = await VendorSubscription.findOne({
      vendor: vendor._id,
      status: { $in: ['active', 'trialing'] },
    }).populate('plan');

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    // Don't immediately cancel, let them use until end of period
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    subscription.status = 'cancelled';
    await subscription.save();

    // Downgrade to basic plan
    const basicPlan = await VendorPlan.findOne({ slug: 'basic' });
    if (basicPlan) {
      vendor.currentPlan = basicPlan._id;
      vendor.commissionRate = basicPlan.commissionRate;
    }
    vendor.subscriptionStatus = 'cancelled';
    await vendor.save();

    // Audit log
    await AuditLog.log({
      vendor: vendor._id,
      user: req.user._id,
      action: 'subscription_cancelled',
      resourceType: 'subscription',
      resourceId: subscription._id,
      description: `Cancelled ${subscription.plan.name} subscription. Reason: ${reason || 'Not provided'}`,
      metadata: { ipAddress: req.ip },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled. You can continue using the service until the end of your billing period.',
      data: { endDate: subscription.endDate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscription history
// @route   GET /api/vendor/subscription/history
// @access  Private (Vendor)
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const subscriptions = await VendorSubscription.find({ vendor: vendor._id })
      .populate('plan', 'name price')
      .populate('previousPlan', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check plan limits
// @route   GET /api/vendor/subscription/limits
// @access  Private (Vendor)
exports.checkPlanLimits = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id }).populate('currentPlan');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const plan = vendor.currentPlan || await VendorPlan.findOne({ slug: 'basic' });

    // Get current usage
    const Product = require('../models/Product');
    const VendorSubUser = require('../models/VendorSubUser');

    const productCount = await Product.countDocuments({ vendor: vendor._id });
    const subAccountCount = await VendorSubUser.countDocuments({
      vendor: vendor._id,
      status: { $in: ['pending', 'active'] },
    });

    const limits = {
      products: {
        current: productCount,
        max: plan.limits.maxProducts,
        remaining: plan.limits.maxProducts === -1 ? 'Unlimited' : plan.limits.maxProducts - productCount,
        isUnlimited: plan.limits.maxProducts === -1,
      },
      subAccounts: {
        current: subAccountCount,
        max: plan.limits.maxSubAccounts,
        remaining: plan.limits.maxSubAccounts === -1 ? 'Unlimited' : plan.limits.maxSubAccounts - subAccountCount,
        isUnlimited: plan.limits.maxSubAccounts === -1,
      },
      features: plan.features,
      commissionRate: plan.commissionRate,
    };

    res.json({
      success: true,
      data: limits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Create/update plans
// @route   POST /api/admin/vendor/plans
// @access  Private (Admin)
exports.createPlan = async (req, res) => {
  try {
    const planData = req.body;

    // Generate slug from name
    planData.slug = planData.name.toLowerCase().replace(/\s+/g, '-');

    const plan = await VendorPlan.create(planData);

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update plan
// @route   PUT /api/admin/vendor/plans/:id
// @access  Private (Admin)
exports.updatePlan = async (req, res) => {
  try {
    const plan = await VendorPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initialize default plans
exports.initializePlans = async () => {
  try {
    await VendorPlan.createDefaultPlans();
    console.log('Default vendor plans initialized');
  } catch (error) {
    console.error('Error initializing plans:', error);
  }
};
