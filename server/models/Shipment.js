const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  address: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, default: 'PK' },
  phone: { type: String, required: true },
  email: { type: String },
});

const packageSchema = new mongoose.Schema({
  weight: { type: Number, required: true }, // in kg
  weightUnit: { type: String, default: 'kg' },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  dimensionUnit: { type: String, default: 'cm' },
  description: { type: String },
  declaredValue: { type: Number },
  itemCount: { type: Number, default: 1 },
});

const shipmentSchema = new mongoose.Schema(
  {
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },

    // Courier Information
    courier: {
      name: {
        type: String,
        required: true,
        enum: ['TCS', 'Leopards', 'PostEx', 'BlueEx', 'Trax', 'M&P', 'CallCourier', 'Manual'],
      },
      code: {
        type: String,
        required: true,
        enum: ['tcs', 'leopards', 'postex', 'blueex', 'trax', 'mnp', 'callcourier', 'manual'],
      },
      trackingNumber: { type: String },
      awbNumber: { type: String }, // Air Waybill Number
      labelUrl: { type: String },
      labelData: { type: mongoose.Schema.Types.Mixed }, // Raw label data from courier
      bookingId: { type: String }, // Courier's internal booking ID
    },

    // Status
    status: {
      type: String,
      enum: [
        'pending',           // Shipment created, awaiting label
        'label_created',     // Label generated
        'ready_for_pickup',  // Ready for courier pickup
        'picked_up',         // Picked up by courier
        'in_transit',        // In transit
        'out_for_delivery',  // Out for delivery
        'delivered',         // Successfully delivered
        'attempted_delivery', // Delivery attempted, failed
        'returned',          // Returned to sender
        'failed',            // Delivery failed permanently
        'cancelled',         // Shipment cancelled
      ],
      default: 'pending',
    },

    // Addresses
    origin: addressSchema,
    destination: addressSchema,

    // Package Details
    package: packageSchema,

    // Dates
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    pickedUpAt: { type: Date },
    lastTrackingUpdate: { type: Date },

    // COD (Cash on Delivery)
    isCOD: { type: Boolean, default: false },
    codAmount: { type: Number, default: 0 },
    codCollected: { type: Boolean, default: false },
    codCollectedAt: { type: Date },

    // Costs
    shippingCost: { type: Number, default: 0 },
    insuranceCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },

    // Service Type
    serviceType: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'same_day', 'economy'],
      default: 'standard',
    },

    // Special Instructions
    specialInstructions: { type: String },
    deliveryInstructions: { type: String },

    // Attempts
    deliveryAttempts: { type: Number, default: 0 },
    maxDeliveryAttempts: { type: Number, default: 3 },

    // Return Shipment
    isReturn: { type: Boolean, default: false },
    originalShipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },

    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed },

    // Error tracking
    lastError: {
      code: { type: String },
      message: { type: String },
      timestamp: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shipmentSchema.index({ subOrder: 1 });
shipmentSchema.index({ order: 1 });
shipmentSchema.index({ vendor: 1, createdAt: -1 });
shipmentSchema.index({ 'courier.trackingNumber': 1 });
shipmentSchema.index({ 'courier.code': 1, status: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ createdAt: -1 });

// Pre-save to calculate total cost
shipmentSchema.pre('save', function (next) {
  this.totalCost = (this.shippingCost || 0) + (this.insuranceCost || 0);
  next();
});

// Methods
shipmentSchema.methods.updateStatus = async function (newStatus, note) {
  const ShipmentTrackingEvent = mongoose.model('ShipmentTrackingEvent');

  this.status = newStatus;
  this.lastTrackingUpdate = new Date();

  // Update specific timestamps
  if (newStatus === 'picked_up') {
    this.pickedUpAt = new Date();
  } else if (newStatus === 'delivered') {
    this.actualDelivery = new Date();
    if (this.isCOD && !this.codCollected) {
      this.codCollected = true;
      this.codCollectedAt = new Date();
    }
  } else if (newStatus === 'attempted_delivery') {
    this.deliveryAttempts += 1;
  }

  await this.save();

  // Create tracking event
  await ShipmentTrackingEvent.create({
    shipment: this._id,
    status: newStatus,
    description: note || `Status updated to ${newStatus}`,
    timestamp: new Date(),
    source: 'manual',
  });

  return this;
};

// Static method to get shipments needing tracking updates
shipmentSchema.statics.getShipmentsForTrackingUpdate = function () {
  const activeStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'attempted_delivery'];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  return this.find({
    status: { $in: activeStatuses },
    $or: [
      { lastTrackingUpdate: { $lt: oneHourAgo } },
      { lastTrackingUpdate: { $exists: false } },
    ],
  })
    .populate('vendor', 'storeName')
    .limit(100);
};

// Virtual for tracking URL
shipmentSchema.virtual('trackingUrl').get(function () {
  if (!this.courier.trackingNumber) return null;

  const trackingUrls = {
    tcs: `https://www.tcsexpress.com/track/${this.courier.trackingNumber}`,
    leopards: `https://leopardscourier.com/tracking/${this.courier.trackingNumber}`,
    postex: `https://postex.pk/tracking/${this.courier.trackingNumber}`,
    blueex: `https://www.blue-ex.com/tracking/${this.courier.trackingNumber}`,
    trax: `https://trax.pk/tracking/${this.courier.trackingNumber}`,
  };

  return trackingUrls[this.courier.code] || null;
});

module.exports = mongoose.model('Shipment', shipmentSchema);
