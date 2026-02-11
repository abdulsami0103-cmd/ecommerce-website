const mongoose = require('mongoose');

const rmaStatusLogSchema = new mongoose.Schema(
  {
    rmaRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMARequest',
      required: true,
    },
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedByType: {
      type: String,
      enum: ['customer', 'vendor', 'admin', 'system'],
    },
    reason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Indexes
rmaStatusLogSchema.index({ rmaRequest: 1, createdAt: -1 });
rmaStatusLogSchema.index({ changedBy: 1 });

// Static method to get status history
rmaStatusLogSchema.statics.getHistory = function (rmaRequestId) {
  return this.find({ rmaRequest: rmaRequestId })
    .populate('changedBy', 'email profile.firstName profile.lastName role')
    .sort({ createdAt: 1 });
};

// Static method to get latest status change
rmaStatusLogSchema.statics.getLatest = function (rmaRequestId) {
  return this.findOne({ rmaRequest: rmaRequestId })
    .populate('changedBy', 'email profile.firstName profile.lastName role')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('RMAStatusLog', rmaStatusLogSchema);
