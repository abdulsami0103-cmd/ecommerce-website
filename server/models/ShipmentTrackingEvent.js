const mongoose = require('mongoose');

const shipmentTrackingEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    statusCode: { type: String }, // Courier-specific status code
    description: { type: String, required: true },
    location: {
      city: { type: String },
      facility: { type: String },
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rawData: { type: mongoose.Schema.Types.Mixed }, // Original response from courier API
    source: {
      type: String,
      enum: ['courier_api', 'webhook', 'manual', 'system'],
      default: 'system',
    },
    // Additional details
    signedBy: { type: String }, // Name of person who signed for delivery
    proofOfDelivery: { type: String }, // URL to POD image
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
shipmentTrackingEventSchema.index({ shipment: 1, timestamp: -1 });
shipmentTrackingEventSchema.index({ shipment: 1, status: 1 });
shipmentTrackingEventSchema.index({ timestamp: -1 });

// Static method to get tracking timeline for a shipment
shipmentTrackingEventSchema.statics.getTimeline = function (shipmentId) {
  return this.find({ shipment: shipmentId })
    .sort({ timestamp: 1 })
    .lean();
};

// Static method to get latest event for a shipment
shipmentTrackingEventSchema.statics.getLatestEvent = function (shipmentId) {
  return this.findOne({ shipment: shipmentId })
    .sort({ timestamp: -1 })
    .lean();
};

// Static method to bulk create events from courier API response
shipmentTrackingEventSchema.statics.createFromCourierResponse = async function (
  shipmentId,
  events,
  courierCode
) {
  const bulkOps = events.map((event) => ({
    insertOne: {
      document: {
        shipment: shipmentId,
        status: event.status,
        statusCode: event.statusCode,
        description: event.description,
        location: event.location,
        timestamp: event.timestamp,
        rawData: event.rawData,
        source: 'courier_api',
      },
    },
  }));

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps, { ordered: false });
  }

  return events.length;
};

module.exports = mongoose.model('ShipmentTrackingEvent', shipmentTrackingEventSchema);
