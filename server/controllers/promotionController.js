const Promotion = require('../models/Promotion');
const PromotionSlot = require('../models/PromotionSlot');
const Badge = require('../models/Badge');
const EntityBadge = require('../models/EntityBadge');
const Vendor = require('../models/Vendor');

/**
 * @desc    Get available promotion slots
 * @route   GET /api/promotions/slots
 * @access  Public
 */
exports.getPromotionSlots = async (req, res) => {
  try {
    const slots = await PromotionSlot.getAvailableSlots();

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error fetching promotion slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotion slots',
      error: error.message,
    });
  }
};

/**
 * @desc    Get active promotions for a placement
 * @route   GET /api/promotions/active/:placement
 * @access  Public
 */
exports.getActivePromotions = async (req, res) => {
  try {
    const { placement } = req.params;
    const { limit = 5 } = req.query;

    const promotions = await Promotion.getActiveForSlot(placement, parseInt(limit));

    // Record impressions
    for (const promo of promotions) {
      await promo.recordImpression();
    }

    res.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      error: error.message,
    });
  }
};

/**
 * @desc    Track promotion click
 * @route   POST /api/promotions/:id/click
 * @access  Public
 */
exports.trackClick = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    await promotion.recordClick(req.user?._id);

    res.json({
      success: true,
      data: { redirectUrl: promotion.creative.linkUrl },
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking click',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a promotion (vendor)
 * @route   POST /api/vendor/promotions
 * @access  Vendor
 */
exports.createPromotion = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const {
      slotId,
      entityType,
      entityId,
      creative,
      scheduling,
      budget,
      bidAmount,
    } = req.body;

    // Validate slot
    const slot = await PromotionSlot.findById(slotId);
    if (!slot || !slot.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive promotion slot',
      });
    }

    // Check if entity type is allowed for this slot
    if (!slot.allowedEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `This slot does not allow ${entityType} promotions`,
      });
    }

    // Calculate payment amount based on pricing model
    let paymentAmount = 0;
    if (slot.pricingModel === 'fixed') {
      const days = Math.ceil((new Date(scheduling.expiresAt) - new Date(scheduling.startsAt)) / (1000 * 60 * 60 * 24));
      if (days <= 7) {
        paymentAmount = slot.pricing.weekly || (slot.pricing.daily * days);
      } else if (days <= 30) {
        paymentAmount = slot.pricing.monthly || (slot.pricing.daily * days);
      } else {
        paymentAmount = slot.pricing.daily * days;
      }
    }

    const promotion = await Promotion.create({
      slot: slotId,
      entityType,
      entity: entityId,
      vendor: vendor._id,
      creative,
      scheduling,
      budget: budget || { type: 'total', amount: paymentAmount },
      bidAmount: bidAmount || 0,
      payment: {
        amount: paymentAmount,
        status: 'pending',
      },
      status: 'pending_review',
      createdBy: req.user._id,
    });

    const populatedPromotion = await Promotion.findById(promotion._id)
      .populate('slot')
      .populate('entity');

    res.status(201).json({
      success: true,
      message: 'Promotion created and submitted for review',
      data: populatedPromotion,
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating promotion',
      error: error.message,
    });
  }
};

/**
 * @desc    Get vendor's promotions
 * @route   GET /api/vendor/promotions
 * @access  Vendor
 */
exports.getVendorPromotions = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const query = { vendor: vendor._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [promotions, total] = await Promise.all([
      Promotion.find(query)
        .populate('slot', 'name placement')
        .populate('entity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Promotion.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get promotion details
 * @route   GET /api/vendor/promotions/:id
 * @access  Vendor
 */
exports.getPromotion = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    const promotion = await Promotion.findById(req.params.id)
      .populate('slot')
      .populate('entity')
      .populate('reviewedBy', 'email');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    // Check access
    if (req.user.role !== 'admin' && promotion.vendor.toString() !== vendor?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotion',
      error: error.message,
    });
  }
};

/**
 * @desc    Update promotion
 * @route   PUT /api/vendor/promotions/:id
 * @access  Vendor
 */
exports.updatePromotion = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (promotion.vendor.toString() !== vendor?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Only allow updates for draft or rejected promotions
    if (!['draft', 'rejected'].includes(promotion.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update promotion in current status',
      });
    }

    const { creative, scheduling, budget, bidAmount } = req.body;

    if (creative) promotion.creative = { ...promotion.creative, ...creative };
    if (scheduling) promotion.scheduling = { ...promotion.scheduling, ...scheduling };
    if (budget) promotion.budget = { ...promotion.budget, ...budget };
    if (bidAmount !== undefined) promotion.bidAmount = bidAmount;

    promotion.status = 'pending_review';
    await promotion.save();

    res.json({
      success: true,
      message: 'Promotion updated and resubmitted for review',
      data: promotion,
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating promotion',
      error: error.message,
    });
  }
};

/**
 * @desc    Pause/Resume promotion
 * @route   PUT /api/vendor/promotions/:id/pause
 * @access  Vendor
 */
exports.togglePausePromotion = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (promotion.vendor.toString() !== vendor?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (promotion.status === 'active') {
      promotion.status = 'paused';
    } else if (promotion.status === 'paused') {
      promotion.status = 'active';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cannot pause/resume promotion in current status',
      });
    }

    await promotion.save();

    res.json({
      success: true,
      message: `Promotion ${promotion.status === 'paused' ? 'paused' : 'resumed'}`,
      data: promotion,
    });
  } catch (error) {
    console.error('Error toggling promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating promotion',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel promotion
 * @route   DELETE /api/vendor/promotions/:id
 * @access  Vendor
 */
exports.cancelPromotion = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (promotion.vendor.toString() !== vendor?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    promotion.status = 'cancelled';
    await promotion.save();

    // TODO: Handle refund if applicable

    res.json({
      success: true,
      message: 'Promotion cancelled',
    });
  } catch (error) {
    console.error('Error cancelling promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling promotion',
      error: error.message,
    });
  }
};

/**
 * @desc    Get promotion statistics
 * @route   GET /api/vendor/promotions/:id/stats
 * @access  Vendor
 */
exports.getPromotionStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (req.user.role !== 'admin' && promotion.vendor.toString() !== vendor?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: {
        promotion: {
          id: promotion._id,
          status: promotion.status,
          creative: promotion.creative,
          scheduling: promotion.scheduling,
          budget: promotion.budget,
        },
        stats: promotion.stats,
        performance: {
          ctr: promotion.stats.ctr.toFixed(2),
          conversionRate: promotion.stats.clicks > 0
            ? ((promotion.stats.conversions / promotion.stats.clicks) * 100).toFixed(2)
            : 0,
          costPerClick: promotion.budget.spent > 0 && promotion.stats.clicks > 0
            ? (promotion.budget.spent / promotion.stats.clicks).toFixed(2)
            : 0,
          roas: promotion.budget.spent > 0
            ? (promotion.stats.revenue / promotion.budget.spent).toFixed(2)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching promotion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

// ============ Admin Controllers ============

/**
 * @desc    Get all promotions (admin)
 * @route   GET /api/admin/promotions
 * @access  Admin
 */
exports.getAllPromotions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, slot, vendor } = req.query;

    const query = {};
    if (status) query.status = status;
    if (slot) query.slot = slot;
    if (vendor) query.vendor = vendor;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [promotions, total] = await Promise.all([
      Promotion.find(query)
        .populate('slot', 'name placement')
        .populate('vendor', 'storeName')
        .populate('entity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Promotion.countDocuments(query),
    ]);

    // Get stats
    const stats = await Promotion.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: promotions,
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      error: error.message,
    });
  }
};

/**
 * @desc    Review promotion (approve/reject)
 * @route   PUT /api/admin/promotions/:id/review
 * @access  Admin
 */
exports.reviewPromotion = async (req, res) => {
  try {
    const { action, note, rejectionReason } = req.body;

    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    if (promotion.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Promotion is not pending review',
      });
    }

    promotion.reviewedBy = req.user._id;
    promotion.reviewedAt = new Date();
    promotion.reviewNote = note;

    if (action === 'approve') {
      // Check if payment is complete for fixed pricing
      if (promotion.payment.status === 'paid' || promotion.payment.amount === 0) {
        promotion.status = 'active';
      } else {
        promotion.status = 'approved'; // Waiting for payment
      }
    } else if (action === 'reject') {
      promotion.status = 'rejected';
      promotion.rejectionReason = rejectionReason;
    }

    await promotion.save();

    res.json({
      success: true,
      message: `Promotion ${action}d successfully`,
      data: promotion,
    });
  } catch (error) {
    console.error('Error reviewing promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing promotion',
      error: error.message,
    });
  }
};

// ============ Promotion Slot Admin Controllers ============

/**
 * @desc    Create promotion slot
 * @route   POST /api/admin/promotions/slots
 * @access  Admin
 */
exports.createPromotionSlot = async (req, res) => {
  try {
    const slot = await PromotionSlot.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Promotion slot created',
      data: slot,
    });
  } catch (error) {
    console.error('Error creating promotion slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating promotion slot',
      error: error.message,
    });
  }
};

/**
 * @desc    Update promotion slot
 * @route   PUT /api/admin/promotions/slots/:id
 * @access  Admin
 */
exports.updatePromotionSlot = async (req, res) => {
  try {
    const slot = await PromotionSlot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Promotion slot not found',
      });
    }

    res.json({
      success: true,
      message: 'Promotion slot updated',
      data: slot,
    });
  } catch (error) {
    console.error('Error updating promotion slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating promotion slot',
      error: error.message,
    });
  }
};

// ============ Badge Controllers ============

/**
 * @desc    Get all badges
 * @route   GET /api/admin/badges
 * @access  Admin
 */
exports.getBadges = async (req, res) => {
  try {
    const { entityType } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;

    const badges = await Badge.find(query).sort({ displayOrder: 1 });

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching badges',
      error: error.message,
    });
  }
};

/**
 * @desc    Create badge
 * @route   POST /api/admin/badges
 * @access  Admin
 */
exports.createBadge = async (req, res) => {
  try {
    const badge = await Badge.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Badge created',
      data: badge,
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating badge',
      error: error.message,
    });
  }
};

/**
 * @desc    Update badge
 * @route   PUT /api/admin/badges/:id
 * @access  Admin
 */
exports.updateBadge = async (req, res) => {
  try {
    const badge = await Badge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      });
    }

    res.json({
      success: true,
      message: 'Badge updated',
      data: badge,
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating badge',
      error: error.message,
    });
  }
};

/**
 * @desc    Award badge to entity
 * @route   POST /api/admin/badges/:id/award
 * @access  Admin
 */
exports.awardBadge = async (req, res) => {
  try {
    const { entityType, entityId, reason, expiresAt } = req.body;

    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found',
      });
    }

    if (badge.entityType !== entityType) {
      return res.status(400).json({
        success: false,
        message: `This badge is for ${badge.entityType}s only`,
      });
    }

    // Check if already awarded
    const existing = await EntityBadge.findOne({
      badge: badge._id,
      entityType,
      entity: entityId,
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Entity already has this badge',
      });
    }

    const entityBadge = await EntityBadge.create({
      badge: badge._id,
      entityType,
      entity: entityId,
      awardedBy: req.user._id,
      reason,
      expiresAt: expiresAt || (badge.validityDays
        ? new Date(Date.now() + badge.validityDays * 24 * 60 * 60 * 1000)
        : null),
    });

    res.status(201).json({
      success: true,
      message: 'Badge awarded successfully',
      data: entityBadge,
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding badge',
      error: error.message,
    });
  }
};

/**
 * @desc    Revoke badge from entity
 * @route   DELETE /api/admin/badges/entity/:id
 * @access  Admin
 */
exports.revokeBadge = async (req, res) => {
  try {
    const { reason } = req.body;

    const entityBadge = await EntityBadge.revokeBadge(req.params.id, req.user._id, reason);

    if (!entityBadge) {
      return res.status(404).json({
        success: false,
        message: 'Entity badge not found',
      });
    }

    res.json({
      success: true,
      message: 'Badge revoked',
    });
  } catch (error) {
    console.error('Error revoking badge:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking badge',
      error: error.message,
    });
  }
};

/**
 * @desc    Get entity badges (public)
 * @route   GET /api/badges/:entityType/:entityId
 * @access  Public
 */
exports.getEntityBadges = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const badges = await EntityBadge.getEntityBadges(entityType, entityId);

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error('Error fetching entity badges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching badges',
      error: error.message,
    });
  }
};
