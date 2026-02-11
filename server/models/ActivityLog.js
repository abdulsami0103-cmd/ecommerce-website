const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: ['admin', 'vendor', 'customer', 'system'],
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'actorType',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
activityLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 365 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

// Static method to log an action
activityLogSchema.statics.log = async function (data) {
  return this.create(data);
};

// Static method to log with diff
activityLogSchema.statics.logWithDiff = async function (
  actorType,
  actorId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  req = null
) {
  const logData = {
    actorType,
    actorId,
    action,
    entityType,
    entityId,
    description: `${action} on ${entityType}`,
    oldValues: oldData,
    newValues: newData,
  };

  if (req) {
    logData.ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0];
    logData.userAgent = req.headers['user-agent'];
    logData.sessionId = req.sessionID || req.headers['x-session-id'];
  }

  return this.create(logData);
};

// Get recent activity with filters
activityLogSchema.statics.getRecentActivity = async function (filters = {}, options = {}) {
  const query = {};

  if (filters.actorType) query.actorType = filters.actorType;
  if (filters.actorId) query.actorId = filters.actorId;
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.severity) query.severity = filters.severity;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return { logs, total };
};

// Get activity summary by action type
activityLogSchema.statics.getActivitySummary = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { action: '$action', severity: '$severity' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
