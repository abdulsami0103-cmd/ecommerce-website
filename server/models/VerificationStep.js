const mongoose = require('mongoose');

const verificationStepSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  stepNumber: {
    type: Number,
    required: true,
  },
  stepName: {
    type: String,
    enum: ['business_profile', 'documents_upload', 'bank_details', 'admin_review', 'final_approval'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
  },
  completedAt: Date,
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  notes: String,
}, {
  timestamps: true,
});

// Index
verificationStepSchema.index({ vendor: 1, stepNumber: 1 });

module.exports = mongoose.model('VerificationStep', verificationStepSchema);
