const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    channels: {
      email: {
        enabled: { type: Boolean, default: true },
        address: String,
        verified: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        phone: String,
        verified: { type: Boolean, default: false },
      },
      whatsapp: {
        enabled: { type: Boolean, default: false },
        phone: String,
        verified: { type: Boolean, default: false },
      },
    },

    // Consent for marketing
    marketingConsent: {
      type: Boolean,
      default: true,
    },
    marketingConsentDate: Date,

    // Granular preferences
    preferences: {
      // Transactional (always on, can't disable)
      orderUpdates: { type: Boolean, default: true },
      shippingUpdates: { type: Boolean, default: true },
      paymentReceipts: { type: Boolean, default: true },

      // Marketing (user can disable)
      promotions: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      backInStock: { type: Boolean, default: true },
      newArrivals: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },

      // Engagement
      reviews: { type: Boolean, default: true },
      rewards: { type: Boolean, default: true },

      // Vendor (for vendors)
      vendorOrders: { type: Boolean, default: true },
      vendorPayouts: { type: Boolean, default: true },
      vendorReviews: { type: Boolean, default: true },
    },

    // Quiet hours
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' }, // HH:MM format
      end: { type: String, default: '08:00' },
      timezone: { type: String, default: 'Asia/Karachi' },
    },

    // Frequency limits
    frequency: {
      maxPerDay: { type: Number, default: 10 },
      maxPerWeek: { type: Number, default: 30 },
    },

    // Unsubscribe tracking
    unsubscribedAt: Date,
    unsubscribeReason: String,
    unsubscribeToken: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationPreferenceSchema.index({ user: 1 });
notificationPreferenceSchema.index({ unsubscribeToken: 1 });

// Static method to get or create preferences for a user
notificationPreferenceSchema.statics.getOrCreate = async function (userId, email) {
  let prefs = await this.findOne({ user: userId });

  if (!prefs) {
    prefs = await this.create({
      user: userId,
      channels: {
        email: {
          enabled: true,
          address: email,
        },
      },
      marketingConsentDate: new Date(),
    });
  }

  return prefs;
};

// Method to check if notification should be sent
notificationPreferenceSchema.methods.canSend = function (type, channel) {
  // Check if channel is enabled
  if (!this.channels[channel]?.enabled) {
    return false;
  }

  // Check marketing consent for promotional content
  const marketingTypes = ['promotions', 'priceDrops', 'backInStock', 'newArrivals', 'newsletter', 'recommendations'];
  if (marketingTypes.includes(type) && !this.marketingConsent) {
    return false;
  }

  // Check specific preference
  if (this.preferences[type] === false) {
    return false;
  }

  // Check quiet hours for push notifications
  if (channel === 'push' && this.quietHours.enabled) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.quietHours.timezone,
    });

    const start = this.quietHours.start;
    const end = this.quietHours.end;

    // Simple quiet hours check
    if (start < end) {
      if (currentTime >= start && currentTime < end) {
        return false;
      }
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      if (currentTime >= start || currentTime < end) {
        return false;
      }
    }
  }

  return true;
};

// Method to generate unsubscribe token
notificationPreferenceSchema.methods.generateUnsubscribeToken = function () {
  this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
  return this.unsubscribeToken;
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
