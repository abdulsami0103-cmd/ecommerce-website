const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bank_transfer', 'easypaisa', 'jazzcash', 'paypal', 'stripe'],
    required: true,
  },
  isDefault: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  details: {
    // Bank transfer
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountTitle: { type: String, trim: true },
    branchCode: { type: String, trim: true },
    iban: { type: String, trim: true },
    swiftCode: { type: String, trim: true },

    // Easypaisa/Jazzcash
    mobileNumber: { type: String, trim: true },
    cnic: { type: String, trim: true },
    accountName: { type: String, trim: true },

    // PayPal
    paypalEmail: { type: String, trim: true, lowercase: true },

    // Stripe
    stripeAccountId: { type: String, trim: true },
  },

  nickname: { type: String, maxlength: 50 }, // e.g., "My HBL Account"
  addedAt: { type: Date, default: Date.now },
});

const payoutSettingsSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true,
  },

  // Available payment methods
  paymentMethods: [paymentMethodSchema],

  // Preferences
  minimumWithdrawal: { type: Number, default: 1000 }, // PKR
  preferredCurrency: { type: String, default: 'PKR' },

  // Auto-withdrawal settings
  autoWithdraw: {
    enabled: { type: Boolean, default: false },
    threshold: { type: Number, default: 10000 },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, for weekly
    dayOfMonth: { type: Number, min: 1, max: 28 }, // For monthly
  },

  // Rate limiting tracking
  lastPayoutRequestAt: { type: Date },

  // Notification preferences
  notifications: {
    payoutRequested: { type: Boolean, default: true },
    payoutApproved: { type: Boolean, default: true },
    payoutCompleted: { type: Boolean, default: true },
    payoutRejected: { type: Boolean, default: true },
    lowBalanceAlert: { type: Boolean, default: false },
    lowBalanceThreshold: { type: Number, default: 1000 },
  },
}, {
  timestamps: true,
});

// Index
payoutSettingsSchema.index({ vendor: 1 });

// Method to get default payment method
payoutSettingsSchema.methods.getDefaultMethod = function() {
  return this.paymentMethods.find(m => m.isDefault) || this.paymentMethods[0];
};

// Method to add payment method
payoutSettingsSchema.methods.addPaymentMethod = async function(methodData) {
  // If this is the first method or marked as default, set it as default
  const isFirst = this.paymentMethods.length === 0;
  const shouldBeDefault = isFirst || methodData.isDefault;

  // If setting as default, unset other defaults
  if (shouldBeDefault) {
    this.paymentMethods.forEach(m => m.isDefault = false);
  }

  this.paymentMethods.push({
    ...methodData,
    isDefault: shouldBeDefault,
    isVerified: false,
    addedAt: new Date(),
  });

  return this.save();
};

// Method to update payment method
payoutSettingsSchema.methods.updatePaymentMethod = async function(methodId, updates) {
  const method = this.paymentMethods.id(methodId);
  if (!method) {
    throw new Error('Payment method not found');
  }

  // If setting as default, unset other defaults
  if (updates.isDefault) {
    this.paymentMethods.forEach(m => m.isDefault = false);
  }

  Object.assign(method, updates);
  return this.save();
};

// Method to remove payment method
payoutSettingsSchema.methods.removePaymentMethod = async function(methodId) {
  const method = this.paymentMethods.id(methodId);
  if (!method) {
    throw new Error('Payment method not found');
  }

  const wasDefault = method.isDefault;
  method.deleteOne();

  // If removed was default, set first remaining as default
  if (wasDefault && this.paymentMethods.length > 0) {
    this.paymentMethods[0].isDefault = true;
  }

  return this.save();
};

// Method to set default payment method
payoutSettingsSchema.methods.setDefaultMethod = async function(methodId) {
  const method = this.paymentMethods.id(methodId);
  if (!method) {
    throw new Error('Payment method not found');
  }

  this.paymentMethods.forEach(m => m.isDefault = false);
  method.isDefault = true;
  return this.save();
};

// Method to verify payment method (admin action)
payoutSettingsSchema.methods.verifyMethod = async function(methodId, userId) {
  const method = this.paymentMethods.id(methodId);
  if (!method) {
    throw new Error('Payment method not found');
  }

  method.isVerified = true;
  method.verifiedAt = new Date();
  method.verifiedBy = userId;
  return this.save();
};

// Static method to get or create settings for vendor
payoutSettingsSchema.statics.getOrCreateSettings = async function(vendorId) {
  let settings = await this.findOne({ vendor: vendorId });
  if (!settings) {
    settings = await this.create({ vendor: vendorId });
  }
  return settings;
};

// Validation: Ensure required fields based on payment method type
paymentMethodSchema.pre('validate', function(next) {
  const details = this.details || {};

  switch (this.type) {
    case 'bank_transfer':
      if (!details.bankName || !details.accountNumber || !details.accountTitle) {
        return next(new Error('Bank name, account number, and account title are required for bank transfer'));
      }
      break;
    case 'easypaisa':
    case 'jazzcash':
      if (!details.mobileNumber || !details.accountName) {
        return next(new Error('Mobile number and account name are required for mobile wallet'));
      }
      break;
    case 'paypal':
      if (!details.paypalEmail) {
        return next(new Error('PayPal email is required'));
      }
      break;
    case 'stripe':
      if (!details.stripeAccountId) {
        return next(new Error('Stripe account ID is required'));
      }
      break;
  }

  next();
});

module.exports = mongoose.model('PayoutSettings', payoutSettingsSchema);
