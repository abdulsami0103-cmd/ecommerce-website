const mongoose = require('mongoose');

const vendorPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  price: {
    monthly: {
      type: Number,
      default: 0,
    },
    yearly: {
      type: Number,
      default: 0,
    },
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Limits
  limits: {
    maxProducts: {
      type: Number,
      default: 50,
    },
    maxSubAccounts: {
      type: Number,
      default: 1,
    },
    maxCategories: {
      type: Number,
      default: 5,
    },
    storageGB: {
      type: Number,
      default: 1,
    },
  },
  // Commission rate (percentage)
  commissionRate: {
    type: Number,
    default: 15,
  },
  // Features
  features: {
    basicAnalytics: { type: Boolean, default: true },
    advancedAnalytics: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    bulkUpload: { type: Boolean, default: false },
    promotionalTools: { type: Boolean, default: false },
    multiCurrency: { type: Boolean, default: false },
    inventoryAlerts: { type: Boolean, default: true },
    orderNotifications: { type: Boolean, default: true },
    customerChat: { type: Boolean, default: false },
    exportReports: { type: Boolean, default: false },
  },
  // Display
  isPopular: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  // Stripe
  stripePriceIdMonthly: String,
  stripePriceIdYearly: String,
}, {
  timestamps: true,
});

// Static method to create default plans
vendorPlanSchema.statics.createDefaultPlans = async function() {
  const existingPlans = await this.countDocuments();
  if (existingPlans > 0) return;

  const defaultPlans = [
    {
      name: 'Basic',
      slug: 'basic',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      limits: {
        maxProducts: 50,
        maxSubAccounts: 1,
        maxCategories: 5,
        storageGB: 1,
      },
      commissionRate: 15,
      features: {
        basicAnalytics: true,
        advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
        customBranding: false,
        bulkUpload: false,
        promotionalTools: false,
        multiCurrency: false,
        inventoryAlerts: true,
        orderNotifications: true,
        customerChat: false,
        exportReports: false,
      },
      sortOrder: 1,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For growing businesses',
      price: { monthly: 19, yearly: 190 },
      limits: {
        maxProducts: 500,
        maxSubAccounts: 5,
        maxCategories: 20,
        storageGB: 10,
      },
      commissionRate: 10,
      features: {
        basicAnalytics: true,
        advancedAnalytics: true,
        apiAccess: false,
        prioritySupport: true,
        customBranding: true,
        bulkUpload: true,
        promotionalTools: true,
        multiCurrency: true,
        inventoryAlerts: true,
        orderNotifications: true,
        customerChat: true,
        exportReports: true,
      },
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large scale operations',
      price: { monthly: 49, yearly: 490 },
      limits: {
        maxProducts: -1, // Unlimited
        maxSubAccounts: -1,
        maxCategories: -1,
        storageGB: 100,
      },
      commissionRate: 5,
      features: {
        basicAnalytics: true,
        advancedAnalytics: true,
        apiAccess: true,
        prioritySupport: true,
        customBranding: true,
        bulkUpload: true,
        promotionalTools: true,
        multiCurrency: true,
        inventoryAlerts: true,
        orderNotifications: true,
        customerChat: true,
        exportReports: true,
      },
      sortOrder: 3,
    },
  ];

  return this.insertMany(defaultPlans);
};

module.exports = mongoose.model('VendorPlan', vendorPlanSchema);
