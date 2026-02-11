const mongoose = require('mongoose');

const taxExemptionSchema = new mongoose.Schema({
  // Who is exempt
  entityType: {
    type: String,
    enum: ['vendor', 'customer'],
    required: true,
  },
  entityRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel',
    required: true,
  },
  entityModel: {
    type: String,
    enum: ['Vendor', 'User'],
    required: true,
  },

  // Exemption details
  exemptionType: {
    type: String,
    enum: ['full', 'partial'],
    default: 'full',
  },
  partialRate: {
    type: Number,
    min: 0,
    max: 100,
  }, // For partial exemption - percentage exempted

  // Certificate information
  certificateNumber: {
    type: String,
    required: true,
    trim: true,
  },
  certificateType: {
    type: String,
    trim: true,
  }, // e.g., "GST Exemption Certificate", "Export License"
  certificateFile: { type: String }, // URL to uploaded document
  issuingAuthority: { type: String, trim: true },
  issueDate: { type: Date },

  // Validity
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },

  // Scope
  zones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxZone',
  }], // Empty = all zones

  taxTypes: [{
    type: String,
    enum: ['vat', 'sales_tax', 'gst', 'service_tax', 'custom'],
  }], // Empty = all tax types

  // Status
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'expired', 'revoked'],
    default: 'pending_verification',
  },

  // Verification
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  verificationNotes: { type: String },

  // Rejection
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },

  // Revocation
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revokedAt: { type: Date },
  revocationReason: { type: String },

  // Additional info
  notes: { type: String, maxlength: 1000 },
  metadata: mongoose.Schema.Types.Mixed,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes
taxExemptionSchema.index({ entityRef: 1, entityType: 1, status: 1 });
taxExemptionSchema.index({ validUntil: 1, status: 1 });
taxExemptionSchema.index({ status: 1, createdAt: -1 });
taxExemptionSchema.index({ certificateNumber: 1 });

// Set entityModel based on entityType
taxExemptionSchema.pre('save', function(next) {
  this.entityModel = this.entityType === 'vendor' ? 'Vendor' : 'User';
  next();
});

// Virtual to check if currently valid
taxExemptionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.status === 'verified' &&
    this.validFrom <= now &&
    this.validUntil >= now
  );
});

// Virtual for days until expiry
taxExemptionSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.validUntil) return null;
  const now = new Date();
  const diff = this.validUntil - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to verify exemption
taxExemptionSchema.methods.verify = async function(userId, notes) {
  this.status = 'verified';
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

// Method to reject exemption
taxExemptionSchema.methods.reject = async function(userId, reason) {
  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Method to revoke exemption
taxExemptionSchema.methods.revoke = async function(userId, reason) {
  this.status = 'revoked';
  this.revokedBy = userId;
  this.revokedAt = new Date();
  this.revocationReason = reason;
  return this.save();
};

// Static method to check exemption for entity
taxExemptionSchema.statics.checkExemption = async function(entityType, entityId, zoneId = null, taxType = null) {
  const now = new Date();

  const query = {
    entityType,
    entityRef: entityId,
    status: 'verified',
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  };

  // If zone specified, check if exemption covers it
  if (zoneId) {
    query.$or = [
      { zones: { $size: 0 } }, // All zones
      { zones: zoneId },
    ];
  }

  // If tax type specified, check if exemption covers it
  if (taxType) {
    query.$or = query.$or || [];
    query.$or.push(
      { taxTypes: { $size: 0 } }, // All tax types
      { taxTypes: taxType }
    );
  }

  const exemption = await this.findOne(query);

  if (!exemption) {
    return { isExempt: false };
  }

  return {
    isExempt: true,
    exemption: {
      id: exemption._id,
      type: exemption.exemptionType,
      rate: exemption.exemptionType === 'partial' ? exemption.partialRate : 100,
      certificateNumber: exemption.certificateNumber,
      validUntil: exemption.validUntil,
    },
  };
};

// Static method to get pending verifications
taxExemptionSchema.statics.getPendingVerifications = async function() {
  return this.find({ status: 'pending_verification' })
    .populate({
      path: 'entityRef',
      select: 'storeName email profile',
    })
    .sort({ createdAt: 1 });
};

// Static method to get expiring exemptions
taxExemptionSchema.statics.getExpiringExemptions = async function(daysAhead = 30) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    status: 'verified',
    validUntil: { $gte: now, $lte: futureDate },
  })
    .populate({
      path: 'entityRef',
      select: 'storeName email profile',
    })
    .sort({ validUntil: 1 });
};

// Static method to mark expired exemptions
taxExemptionSchema.statics.markExpired = async function() {
  const now = new Date();
  return this.updateMany(
    {
      status: 'verified',
      validUntil: { $lt: now },
    },
    {
      status: 'expired',
    }
  );
};

taxExemptionSchema.set('toJSON', { virtuals: true });
taxExemptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TaxExemption', taxExemptionSchema);
