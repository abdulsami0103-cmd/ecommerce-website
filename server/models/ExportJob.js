const mongoose = require('mongoose');

const exportJobSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['csv', 'xml'],
      required: true,
    },
    scope: {
      type: String,
      enum: ['vendor', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    filters: {
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      }],
      status: [{ type: String }],
      moderationStatus: [{ type: String }],
      dateFrom: { type: Date },
      dateTo: { type: Date },
      priceMin: { type: Number },
      priceMax: { type: Number },
      inStock: { type: Boolean },
    },
    file: {
      name: { type: String },
      url: { type: String },
      size: { type: Number },
      expiresAt: { type: Date },
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      exportedProducts: { type: Number, default: 0 },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
exportJobSchema.index({ vendor: 1, status: 1, createdAt: -1 });
exportJobSchema.index({ status: 1, createdAt: -1 });
exportJobSchema.index({ 'file.expiresAt': 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired exports

// Static method to get vendor's export history
exportJobSchema.statics.getVendorHistory = function (vendorId, options = {}) {
  const { status, limit = 20, skip = 0 } = options;
  const query = { vendor: vendorId };

  if (status) query.status = status;

  return this.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to get pending export jobs
exportJobSchema.statics.getPendingJobs = function (limit = 10) {
  return this.find({ status: 'pending' })
    .sort('createdAt')
    .limit(limit);
};

// Check if file is still valid
exportJobSchema.methods.isFileValid = function () {
  if (!this.file.expiresAt) return false;
  return new Date() < this.file.expiresAt;
};

module.exports = mongoose.model('ExportJob', exportJobSchema);
