const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromotionSlot',
      required: true,
    },

    entityType: {
      type: String,
      enum: ['product', 'vendor', 'category'],
      required: true,
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true, // Who's paying for the promotion
    },

    creative: {
      title: {
        type: String,
        required: [true, 'Creative title is required'],
        maxlength: 100,
      },
      description: {
        type: String,
        maxlength: 500,
      },
      imageUrl: {
        type: String,
        required: [true, 'Creative image is required'],
      },
      linkUrl: {
        type: String,
      },
      callToAction: {
        type: String,
        default: 'Shop Now',
      },
    },

    scheduling: {
      startsAt: {
        type: Date,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      timezone: {
        type: String,
        default: 'Asia/Karachi',
      },
    },

    budget: {
      type: {
        type: String,
        enum: ['unlimited', 'daily', 'total'],
        default: 'total',
      },
      amount: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
    },

    bidAmount: {
      type: Number, // For auction-based slots
      default: 0,
    },

    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'partial_refund'],
        default: 'pending',
      },
      amount: {
        type: Number,
        default: 0,
      },
      method: {
        type: String,
        enum: ['wallet', 'card', 'bank_transfer'],
        default: 'wallet',
      },
      transactionId: String,
      paidAt: Date,
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'approved',
        'rejected',
        'active',
        'paused',
        'completed',
        'cancelled',
      ],
      default: 'draft',
    },

    reviewNote: String, // Admin review note
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,

    stats: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      uniqueClicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 }, // Click-through rate
    },

    // Tracking unique users
    clickedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promotionSchema.index({ slot: 1, status: 1 });
promotionSchema.index({ vendor: 1, status: 1 });
promotionSchema.index({ status: 1, 'scheduling.startsAt': 1, 'scheduling.expiresAt': 1 });
promotionSchema.index({ entityType: 1, entity: 1 });

// Virtual for checking if promotion is currently active
promotionSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.scheduling.startsAt <= now &&
    this.scheduling.expiresAt > now &&
    (this.budget.type === 'unlimited' || this.budget.spent < this.budget.amount)
  );
});

// Method to record impression
promotionSchema.methods.recordImpression = async function () {
  this.stats.impressions += 1;
  this.stats.ctr = this.stats.impressions > 0
    ? (this.stats.clicks / this.stats.impressions) * 100
    : 0;
  await this.save();
};

// Method to record click
promotionSchema.methods.recordClick = async function (userId) {
  this.stats.clicks += 1;

  // Track unique clicks
  if (userId && !this.clickedBy.includes(userId)) {
    this.clickedBy.push(userId);
    this.stats.uniqueClicks += 1;
  }

  this.stats.ctr = this.stats.impressions > 0
    ? (this.stats.clicks / this.stats.impressions) * 100
    : 0;

  // For CPC model, deduct from budget
  const slot = await mongoose.model('PromotionSlot').findById(this.slot);
  if (slot && slot.pricingModel === 'cpc' && slot.pricing.perClick > 0) {
    this.budget.spent += slot.pricing.perClick;

    // Check if budget exhausted
    if (this.budget.type !== 'unlimited' && this.budget.spent >= this.budget.amount) {
      this.status = 'paused';
    }
  }

  await this.save();
};

// Static method to get active promotions for a slot
promotionSchema.statics.getActiveForSlot = async function (slotPlacement, limit = 5) {
  const slot = await mongoose.model('PromotionSlot').findOne({ placement: slotPlacement, isActive: true });
  if (!slot) return [];

  const now = new Date();
  return this.find({
    slot: slot._id,
    status: 'active',
    'scheduling.startsAt': { $lte: now },
    'scheduling.expiresAt': { $gt: now },
    $or: [
      { 'budget.type': 'unlimited' },
      { $expr: { $lt: ['$budget.spent', '$budget.amount'] } },
    ],
  })
    .populate('entity')
    .populate('vendor', 'storeName')
    .sort({ bidAmount: -1, createdAt: 1 })
    .limit(limit);
};

module.exports = mongoose.model('Promotion', promotionSchema);
