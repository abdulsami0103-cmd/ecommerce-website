const mongoose = require('mongoose');

const importErrorSchema = new mongoose.Schema({
  row: { type: Number, required: true },
  column: { type: String },
  value: { type: String },
  message: { type: String, required: true },
});

const importJobSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    type: {
      type: String,
      enum: ['csv', 'xml'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'validating', 'validated', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    file: {
      originalName: { type: String },
      storedName: { type: String },
      url: { type: String },
      size: { type: Number },
    },
    stats: {
      totalRows: { type: Number, default: 0 },
      validRows: { type: Number, default: 0 },
      invalidRows: { type: Number, default: 0 },
      processedRows: { type: Number, default: 0 },
      createdProducts: { type: Number, default: 0 },
      updatedProducts: { type: Number, default: 0 },
      skippedProducts: { type: Number, default: 0 },
      failedProducts: { type: Number, default: 0 },
    },
    errors: [importErrorSchema],
    options: {
      updateExisting: { type: Boolean, default: false },
      skipDuplicates: { type: Boolean, default: true },
      sendToModeration: { type: Boolean, default: true },
    },
    // Progress tracking
    progress: {
      currentRow: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    startedAt: { type: Date },
    validatedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String }, // For failed jobs
  },
  {
    timestamps: true,
  }
);

// Indexes
importJobSchema.index({ vendor: 1, status: 1, createdAt: -1 });
importJobSchema.index({ status: 1, createdAt: -1 });

// Static method to get vendor's import history
importJobSchema.statics.getVendorHistory = function (vendorId, options = {}) {
  const { status, limit = 20, skip = 0 } = options;
  const query = { vendor: vendorId };

  if (status) query.status = status;

  return this.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
};

// Static method to get pending jobs for processing
importJobSchema.statics.getPendingJobs = function (limit = 10) {
  return this.find({ status: 'validated' })
    .sort('createdAt')
    .limit(limit);
};

// Update progress helper
importJobSchema.methods.updateProgress = function (currentRow, totalRows) {
  this.progress.currentRow = currentRow;
  this.progress.percentage = Math.round((currentRow / totalRows) * 100);
  return this.save();
};

module.exports = mongoose.model('ImportJob', importJobSchema);
