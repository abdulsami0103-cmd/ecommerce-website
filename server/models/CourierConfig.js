const mongoose = require('mongoose');

const rateSlabSchema = new mongoose.Schema({
  maxWeight: { type: Number, required: true }, // in kg
  rate: { type: Number, required: true }, // in PKR
});

const rateCardSchema = new mongoose.Schema({
  fromCity: { type: String, required: true },
  toCity: { type: String, required: true },
  weightSlabs: [rateSlabSchema],
  baseRate: { type: Number }, // Flat rate if no weight slabs
  perKgRate: { type: Number }, // Rate per additional kg
});

const courierConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    displayName: { type: String },
    logo: { type: String },
    isActive: {
      type: Boolean,
      default: false,
    },

    // API Credentials
    apiCredentials: {
      apiKey: { type: String },
      apiSecret: { type: String },
      accountNumber: { type: String },
      username: { type: String },
      password: { type: String },
      baseUrl: { type: String },
      testBaseUrl: { type: String },
      costCenterId: { type: String }, // TCS specific
      pickupAddress: { type: String },
    },

    // Environment
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },

    // Supported Services
    services: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        estimatedDays: { type: Number },
        isActive: { type: Boolean, default: true },
      },
    ],

    // Coverage
    supportedCities: [{ type: String }],
    supportedCountries: [{ type: String, default: ['PK'] }],

    // Rate Card
    rateCard: [rateCardSchema],
    defaultRate: { type: Number }, // Fallback rate
    fuelSurchargePercent: { type: Number, default: 0 },

    // Webhook Configuration
    webhookSecret: { type: String },
    webhookEndpoint: { type: String },
    webhookEvents: [{ type: String }], // Events to receive

    // Settings
    settings: {
      autoFetchTracking: { type: Boolean, default: true },
      trackingFetchInterval: { type: Number, default: 60 }, // minutes
      maxTrackingRetries: { type: Number, default: 3 },
      supportsCOD: { type: Boolean, default: true },
      supportsPickup: { type: Boolean, default: true },
      supportsReturn: { type: Boolean, default: true },
      maxWeight: { type: Number, default: 30 }, // kg
      maxDeclaredValue: { type: Number, default: 500000 }, // PKR
    },

    // Contact Information
    supportPhone: { type: String },
    supportEmail: { type: String },

    // Status mapping - maps courier's status codes to our standard statuses
    statusMapping: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Priority for rate comparison
    priority: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
courierConfigSchema.index({ code: 1 });
courierConfigSchema.index({ isActive: 1 });
courierConfigSchema.index({ 'supportedCities': 1 });

// Methods
courierConfigSchema.methods.calculateRate = function (fromCity, toCity, weight) {
  // Find matching rate card entry
  const rateEntry = this.rateCard.find(
    (r) =>
      r.fromCity.toLowerCase() === fromCity.toLowerCase() &&
      r.toCity.toLowerCase() === toCity.toLowerCase()
  );

  if (rateEntry) {
    // Find applicable weight slab
    if (rateEntry.weightSlabs && rateEntry.weightSlabs.length > 0) {
      const slab = rateEntry.weightSlabs.find((s) => weight <= s.maxWeight);
      if (slab) {
        const rate = slab.rate;
        const fuelSurcharge = rate * (this.fuelSurchargePercent / 100);
        return Math.ceil(rate + fuelSurcharge);
      }
    }

    // Use base rate + per kg rate
    if (rateEntry.baseRate) {
      let rate = rateEntry.baseRate;
      if (rateEntry.perKgRate && weight > 1) {
        rate += (weight - 1) * rateEntry.perKgRate;
      }
      const fuelSurcharge = rate * (this.fuelSurchargePercent / 100);
      return Math.ceil(rate + fuelSurcharge);
    }
  }

  // Fallback to default rate
  if (this.defaultRate) {
    const fuelSurcharge = this.defaultRate * (this.fuelSurchargePercent / 100);
    return Math.ceil(this.defaultRate + fuelSurcharge);
  }

  return null;
};

// Static method to get active couriers
courierConfigSchema.statics.getActiveCouriers = function () {
  return this.find({ isActive: true }).sort({ priority: -1 });
};

// Static method to get courier by code
courierConfigSchema.statics.getByCode = function (code) {
  return this.findOne({ code: code.toLowerCase(), isActive: true });
};

// Method to normalize status from courier-specific to standard
courierConfigSchema.methods.normalizeStatus = function (courierStatus) {
  const mapping = this.statusMapping.get(courierStatus.toLowerCase());
  return mapping || 'in_transit'; // Default to in_transit if unknown
};

module.exports = mongoose.model('CourierConfig', courierConfigSchema);
