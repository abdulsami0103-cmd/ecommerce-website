const mongoose = require('mongoose');

const entityBadgeSchema = new mongoose.Schema(
  {
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    entityType: {
      type: String,
      enum: ['product', 'vendor'],
      required: true,
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = automatic
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // null = permanent
    },
    reason: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    revokeReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
entityBadgeSchema.index({ badge: 1, entityType: 1, entity: 1 }, { unique: true });
entityBadgeSchema.index({ entityType: 1, entity: 1, isActive: 1 });
entityBadgeSchema.index({ expiresAt: 1 });

// Virtual for checking if badge is currently valid
entityBadgeSchema.virtual('isValid').get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
});

// Static method to get badges for an entity
entityBadgeSchema.statics.getEntityBadges = async function (entityType, entityId) {
  const now = new Date();
  return this.find({
    entityType,
    entity: entityId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  })
    .populate('badge')
    .sort({ awardedAt: -1 });
};

// Static method to revoke a badge
entityBadgeSchema.statics.revokeBadge = async function (entityBadgeId, userId, reason) {
  return this.findByIdAndUpdate(
    entityBadgeId,
    {
      isActive: false,
      revokedAt: new Date(),
      revokedBy: userId,
      revokeReason: reason,
    },
    { new: true }
  );
};

// Static method to cleanup expired badges
entityBadgeSchema.statics.cleanupExpired = async function () {
  const now = new Date();
  return this.updateMany(
    {
      isActive: true,
      expiresAt: { $lt: now },
    },
    {
      isActive: false,
      revokeReason: 'Badge expired',
    }
  );
};

module.exports = mongoose.model('EntityBadge', entityBadgeSchema);
