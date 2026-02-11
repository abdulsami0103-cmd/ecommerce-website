const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['promotional', 'transactional', 'drip', 'abandoned_cart', 'newsletter'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'push', 'sms', 'multi'],
      required: true,
    },

    audience: {
      segmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AudienceSegment',
      },
      estimatedReach: {
        type: Number,
        default: 0,
      },
      // For quick targeting without segment
      targetAll: {
        type: Boolean,
        default: false,
      },
      filters: {
        hasOrdered: Boolean,
        lastOrderDays: Number, // Days since last order
        minOrders: Number,
        maxOrders: Number,
        locations: [String],
      },
    },

    content: {
      // Email content
      subject: {
        type: String,
        maxlength: 200,
      },
      preheader: {
        type: String,
        maxlength: 200,
      },
      htmlBody: String,
      textBody: String,
      // Push notification content
      pushTitle: {
        type: String,
        maxlength: 100,
      },
      pushBody: {
        type: String,
        maxlength: 500,
      },
      pushImage: String,
      pushAction: String, // Deep link or URL
      // SMS content
      smsBody: {
        type: String,
        maxlength: 160,
      },
    },

    // Template variables available
    variables: [{
      type: String, // e.g., {{customer_name}}, {{order_total}}
    }],

    scheduling: {
      scheduledAt: Date,
      timezone: {
        type: String,
        default: 'Asia/Karachi',
      },
      sendImmediately: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
      default: 'draft',
    },

    sentAt: Date,
    completedAt: Date,

    stats: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      complained: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },

    // A/B testing
    abTest: {
      enabled: { type: Boolean, default: false },
      variants: [{
        name: String,
        subject: String,
        content: String,
        percentage: Number, // % of audience
        stats: {
          sent: Number,
          opened: Number,
          clicked: Number,
        },
      }],
      winningCriteria: {
        type: String,
        enum: ['open_rate', 'click_rate', 'conversion'],
        default: 'open_rate',
      },
    },

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
campaignSchema.index({ status: 1, 'scheduling.scheduledAt': 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ createdAt: -1 });

// Virtual for open rate
campaignSchema.virtual('openRate').get(function () {
  if (this.stats.delivered === 0) return 0;
  return ((this.stats.opened / this.stats.delivered) * 100).toFixed(2);
});

// Virtual for click rate
campaignSchema.virtual('clickRate').get(function () {
  if (this.stats.delivered === 0) return 0;
  return ((this.stats.clicked / this.stats.delivered) * 100).toFixed(2);
});

// Method to update stats
campaignSchema.methods.updateStats = async function () {
  const CampaignRecipient = mongoose.model('CampaignRecipient');

  const stats = await CampaignRecipient.aggregate([
    { $match: { campaign: this._id } },
    {
      $group: {
        _id: null,
        sent: { $sum: { $cond: [{ $ne: ['$sentAt', null] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $ne: ['$deliveredAt', null] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $ne: ['$openedAt', null] }, 1, 0] } },
        clicked: { $sum: { $cond: [{ $gt: [{ $size: '$clicks' }, 0] }, 1, 0] } },
        unsubscribed: { $sum: { $cond: [{ $ne: ['$unsubscribedAt', null] }, 1, 0] } },
        bounced: { $sum: { $cond: [{ $ne: ['$bouncedAt', null] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length > 0) {
    this.stats = { ...this.stats, ...stats[0], _id: undefined };
    await this.save();
  }
};

module.exports = mongoose.model('Campaign', campaignSchema);
