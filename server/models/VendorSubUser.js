const mongoose = require('mongoose');

const vendorSubUserSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorRole',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  invitedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'removed'],
    default: 'pending',
  },
  inviteToken: String,
  inviteTokenExpires: Date,
  acceptedAt: Date,
  lastActiveAt: Date,
}, {
  timestamps: true,
});

// Indexes
vendorSubUserSchema.index({ vendor: 1, user: 1 }, { unique: true });
vendorSubUserSchema.index({ inviteToken: 1 });
vendorSubUserSchema.index({ status: 1 });

// Generate invite token
vendorSubUserSchema.methods.generateInviteToken = function() {
  const crypto = require('crypto');
  this.inviteToken = crypto.randomBytes(32).toString('hex');
  this.inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.inviteToken;
};

module.exports = mongoose.model('VendorSubUser', vendorSubUserSchema);
