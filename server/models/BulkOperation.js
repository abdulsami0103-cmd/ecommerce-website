const mongoose = require('mongoose');

const errorSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  sku: {
    type: String,
  },
  message: {
    type: String,
  },
  row: {
    type: Number,
  },
}, { _id: false });

const bulkOperationSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    // Operation type
    type: {
      type: String,
      enum: [
        'price_update',
        'inventory_update',
        'status_update',
        'delete',
        'category_update',
        'tag_update',
        'csv_import',
        'csv_export',
      ],
      required: true,
    },
    // Operation status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    // Products to operate on (for non-import operations)
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    productCount: {
      type: Number,
      default: 0,
    },
    // Operation configuration
    operationData: {
      // For price_update
      priceChange: {
        type: String,
        enum: ['set', 'increase', 'decrease', 'percent_increase', 'percent_decrease'],
      },
      priceValue: {
        type: Number,
      },
      // For status_update
      newStatus: {
        type: String,
        enum: ['draft', 'active', 'inactive'],
      },
      // For category_update
      newCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
      // For inventory_update
      inventoryChange: {
        type: String,
        enum: ['set', 'adjust'],
      },
      inventoryValue: {
        type: Number,
      },
      // For tag_update
      tagsToAdd: [{ type: String }],
      tagsToRemove: [{ type: String }],
      // For csv_import
      fileUrl: {
        type: String,
      },
      fileName: {
        type: String,
      },
      updateExisting: {
        type: Boolean,
        default: false,
      },
      skipDuplicates: {
        type: Boolean,
        default: true,
      },
    },
    // Progress tracking
    progress: {
      processed: {
        type: Number,
        default: 0,
      },
      succeeded: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      skipped: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
    // Errors encountered
    errors: [errorSchema],
    // Timing
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    // Who requested
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Result file (for exports)
    resultFileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bulkOperationSchema.index({ vendor: 1, status: 1 });
bulkOperationSchema.index({ vendor: 1, createdAt: -1 });
bulkOperationSchema.index({ status: 1, createdAt: 1 });

// Static: Create bulk operation
bulkOperationSchema.statics.createOperation = async function (vendorId, type, productIds, operationData, userId) {
  return this.create({
    vendor: vendorId,
    type,
    productIds,
    productCount: productIds?.length || 0,
    operationData,
    requestedBy: userId,
  });
};

// Static: Get vendor operations
bulkOperationSchema.statics.getVendorOperations = async function (vendorId, limit = 20) {
  return this.find({ vendor: vendorId })
    .sort('-createdAt')
    .limit(limit)
    .populate('requestedBy', 'email profile.firstName profile.lastName');
};

// Static: Get pending operations
bulkOperationSchema.statics.getPendingOperations = async function () {
  return this.find({ status: { $in: ['pending', 'processing'] } })
    .sort('createdAt')
    .populate('vendor', 'storeName')
    .populate('requestedBy', 'email');
};

// Instance method: Start processing
bulkOperationSchema.methods.startProcessing = async function () {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

// Instance method: Update progress
bulkOperationSchema.methods.updateProgress = async function (processed, succeeded, failed, skipped = 0) {
  this.progress.processed = processed;
  this.progress.succeeded = succeeded;
  this.progress.failed = failed;
  this.progress.skipped = skipped;

  const total = this.productCount || 1;
  this.progress.percentage = Math.round((processed / total) * 100);

  return this.save();
};

// Instance method: Add error
bulkOperationSchema.methods.addError = async function (productId, message, sku = null, row = null) {
  this.errors.push({ productId, message, sku, row });

  // Keep only last 1000 errors
  if (this.errors.length > 1000) {
    this.errors = this.errors.slice(-1000);
  }

  return this.save();
};

// Instance method: Complete operation
bulkOperationSchema.methods.complete = async function (resultFileUrl = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress.percentage = 100;
  if (resultFileUrl) {
    this.resultFileUrl = resultFileUrl;
  }
  return this.save();
};

// Instance method: Fail operation
bulkOperationSchema.methods.fail = async function (errorMessage) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.errors.push({ message: errorMessage });
  return this.save();
};

// Instance method: Cancel operation
bulkOperationSchema.methods.cancel = async function () {
  if (['pending', 'processing'].includes(this.status)) {
    this.status = 'cancelled';
    this.completedAt = new Date();
    return this.save();
  }
  throw new Error('Cannot cancel completed or failed operation');
};

// Instance method: Get summary
bulkOperationSchema.methods.getSummary = function () {
  return {
    id: this._id,
    type: this.type,
    status: this.status,
    productCount: this.productCount,
    progress: this.progress,
    errorCount: this.errors.length,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    duration: this.completedAt && this.startedAt
      ? Math.round((this.completedAt - this.startedAt) / 1000)
      : null,
  };
};

// Virtual: Is cancellable
bulkOperationSchema.virtual('isCancellable').get(function () {
  return ['pending', 'processing'].includes(this.status);
});

// Virtual: Is complete
bulkOperationSchema.virtual('isComplete').get(function () {
  return ['completed', 'failed', 'cancelled'].includes(this.status);
});

module.exports = mongoose.model('BulkOperation', bulkOperationSchema);
