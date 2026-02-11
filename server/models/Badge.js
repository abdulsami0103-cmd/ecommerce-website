const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Badge name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String, // Icon name or URL
    },
    color: {
      type: String,
      default: '#ffc107', // Gold color
    },
    backgroundColor: {
      type: String,
      default: '#fff8e1',
    },

    entityType: {
      type: String,
      enum: ['product', 'vendor'],
      required: true,
    },

    criteria: {
      type: {
        type: String,
        enum: ['manual', 'automatic'],
        default: 'manual',
      },
      rules: [{
        metric: {
          type: String, // 'rating', 'sales_count', 'review_count', 'order_count', 'days_active'
        },
        operator: {
          type: String,
          enum: ['>=', '<=', '==', '>', '<'],
        },
        value: Number,
      }],
    },

    // Auto-refresh settings for automatic badges
    autoRefresh: {
      enabled: { type: Boolean, default: false },
      intervalDays: { type: Number, default: 7 }, // How often to re-evaluate
      lastRefreshed: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    // How long the badge lasts when awarded (null = permanent)
    validityDays: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
badgeSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
badgeSchema.index({ slug: 1 });
badgeSchema.index({ entityType: 1, isActive: 1 });
badgeSchema.index({ 'criteria.type': 1 });

// Static method to get badges for display
badgeSchema.statics.getActiveBadges = function (entityType) {
  return this.find({
    entityType,
    isActive: true,
  }).sort({ displayOrder: 1 });
};

// Static method to evaluate automatic badges for an entity
badgeSchema.statics.evaluateForEntity = async function (entityType, entityId, metrics) {
  const automaticBadges = await this.find({
    entityType,
    isActive: true,
    'criteria.type': 'automatic',
  });

  const EntityBadge = mongoose.model('EntityBadge');
  const qualifiedBadges = [];

  for (const badge of automaticBadges) {
    let qualifies = true;

    for (const rule of badge.criteria.rules) {
      const metricValue = metrics[rule.metric];
      if (metricValue === undefined) {
        qualifies = false;
        break;
      }

      switch (rule.operator) {
        case '>=':
          qualifies = metricValue >= rule.value;
          break;
        case '<=':
          qualifies = metricValue <= rule.value;
          break;
        case '==':
          qualifies = metricValue === rule.value;
          break;
        case '>':
          qualifies = metricValue > rule.value;
          break;
        case '<':
          qualifies = metricValue < rule.value;
          break;
        default:
          qualifies = false;
      }

      if (!qualifies) break;
    }

    if (qualifies) {
      qualifiedBadges.push(badge);

      // Check if entity already has this badge
      const existingBadge = await EntityBadge.findOne({
        badge: badge._id,
        entityType,
        entity: entityId,
      });

      if (!existingBadge) {
        // Award the badge
        await EntityBadge.create({
          badge: badge._id,
          entityType,
          entity: entityId,
          awardedAt: new Date(),
          expiresAt: badge.validityDays
            ? new Date(Date.now() + badge.validityDays * 24 * 60 * 60 * 1000)
            : null,
          reason: 'Automatically awarded based on criteria',
        });
      }
    }
  }

  return qualifiedBadges;
};

module.exports = mongoose.model('Badge', badgeSchema);
