const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  documentType: {
    type: String,
    enum: ['trade_license', 'national_id', 'tax_certificate', 'bank_statement', 'address_proof', 'other'],
    required: true,
  },
  documentName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resubmit_required'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  rejectionReason: String,
  notes: String,
}, {
  timestamps: true,
});

// Index for faster queries
vendorDocumentSchema.index({ vendor: 1, documentType: 1 });
vendorDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);
