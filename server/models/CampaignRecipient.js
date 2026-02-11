const mongoose = require('mongoose');

const campaignRecipientSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },

    // For A/B testing
    variant: {
      type: String,
    },

    // Tracking
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clicks: [{
      url: String,
      clickedAt: { type: Date, default: Date.now },
    }],
    unsubscribedAt: Date,
    bouncedAt: Date,
    bounceType: {
      type: String,
      enum: ['hard', 'soft'],
    },
    bounceReason: String,
    complainedAt: Date,

    // Conversion tracking
    convertedAt: Date,
    conversionValue: Number,
    conversionOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },

    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained'],
      default: 'pending',
    },

    // Error tracking
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignRecipientSchema.index({ campaign: 1, user: 1 }, { unique: true });
campaignRecipientSchema.index({ campaign: 1, status: 1 });
campaignRecipientSchema.index({ user: 1 });

// Update status based on events
campaignRecipientSchema.pre('save', function (next) {
  if (this.complainedAt) {
    this.status = 'complained';
  } else if (this.unsubscribedAt) {
    this.status = 'unsubscribed';
  } else if (this.bouncedAt) {
    this.status = 'bounced';
  } else if (this.clicks && this.clicks.length > 0) {
    this.status = 'clicked';
  } else if (this.openedAt) {
    this.status = 'opened';
  } else if (this.deliveredAt) {
    this.status = 'delivered';
  } else if (this.sentAt) {
    this.status = 'sent';
  }
  next();
});

module.exports = mongoose.model('CampaignRecipient', campaignRecipientSchema);
