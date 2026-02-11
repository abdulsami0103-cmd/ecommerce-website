const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  estimatedDays: { type: Number, required: true },
});

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    contactEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    contactPhone: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    shipping: {
      methods: [shippingMethodSchema],
      freeShippingThreshold: { type: Number, default: 0 },
    },
    stripeAccountId: { type: String },
    payoutBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    commissionRate: { type: Number, default: 10 }, // Platform commission percentage

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    verificationStep: {
      type: Number,
      default: 1,
    },
    verificationNotes: String,
    verifiedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,

    // Business Details
    businessDetails: {
      businessName: String,
      businessType: {
        type: String,
        enum: ['individual', 'company', 'partnership', 'llc', 'corporation'],
      },
      taxId: String,
      registrationNumber: String,
      yearEstablished: Number,
    },

    // Bank Details
    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      swiftCode: String,
      iban: String,
      isVerified: { type: Boolean, default: false },
    },

    // Subscription
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorPlan',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing', 'none'],
      default: 'none',
    },

    // Trusted vendor status (for auto-approval of products)
    trustedVendor: {
      isTrusted: { type: Boolean, default: false },
      autoApproveProducts: { type: Boolean, default: false },
      trustedAt: { type: Date },
      trustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    // Notification preferences
    notificationPreferences: {
      inventory: {
        lowStock: {
          enabled: { type: Boolean, default: true },
          channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            webhook: { type: Boolean, default: false },
          },
          emailDigest: {
            enabled: { type: Boolean, default: true },
            frequency: {
              type: String,
              enum: ['immediate', 'hourly', 'daily', 'weekly'],
              default: 'daily',
            },
            time: { type: String, default: '09:00' }, // For daily/weekly
            day: { type: String, default: 'monday' }, // For weekly
          },
        },
        outOfStock: {
          enabled: { type: Boolean, default: true },
          channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            webhook: { type: Boolean, default: false },
          },
        },
      },
      orders: {
        newOrder: {
          enabled: { type: Boolean, default: true },
          channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
          },
        },
      },
      moderation: {
        statusChange: {
          enabled: { type: Boolean, default: true },
          channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
          },
        },
      },
      webhookUrl: { type: String },
      webhookSecret: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from store name before saving
vendorSchema.pre('save', function (next) {
  if (this.isModified('storeName')) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for products count
vendorSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendor',
  count: true,
});

module.exports = mongoose.model('Vendor', vendorSchema);
