const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      required: true,
      enum: [
        'brute_force',
        'unusual_location',
        'bulk_price_change',
        'suspicious_payout',
        'permission_escalation',
        'multiple_failed_logins',
        'account_lockout',
        'new_device_login',
        'mass_data_export',
        'unauthorized_access',
        'api_abuse',
        'suspicious_activity',
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true,
    },
    actorType: {
      type: String,
      enum: ['admin', 'vendor', 'customer', 'system', 'unknown'],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    targetType: {
      type: String,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    triggeredRule: {
      type: String,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
    },
    resolutionAction: {
      type: String,
      enum: [
        'dismissed',
        'blocked_user',
        'blocked_ip',
        'forced_logout',
        'password_reset',
        'escalated',
        'investigated',
        'false_positive',
      ],
    },
    autoActions: [{
      action: String,
      executedAt: Date,
      success: Boolean,
      error: String,
    }],
    relatedAlerts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityAlert',
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
securityAlertSchema.index({ alertType: 1, createdAt: -1 });
securityAlertSchema.index({ severity: 1, isResolved: 1, createdAt: -1 });
securityAlertSchema.index({ actorId: 1, createdAt: -1 });
securityAlertSchema.index({ isResolved: 1, createdAt: -1 });
securityAlertSchema.index({ createdAt: -1 });

// Create a new alert
securityAlertSchema.statics.createAlert = async function (data) {
  const alert = await this.create(data);

  // Check for related alerts (same actor, same type, within 1 hour)
  const relatedAlerts = await this.find({
    _id: { $ne: alert._id },
    actorId: data.actorId,
    alertType: data.alertType,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  }).select('_id');

  if (relatedAlerts.length > 0) {
    await this.findByIdAndUpdate(alert._id, {
      relatedAlerts: relatedAlerts.map(a => a._id),
    });
  }

  return alert;
};

// Get alerts with filters
securityAlertSchema.statics.getAlerts = async function (filters = {}, options = {}) {
  const query = {};

  if (filters.alertType) query.alertType = filters.alertType;
  if (filters.severity) query.severity = filters.severity;
  if (filters.actorId) query.actorId = filters.actorId;
  if (typeof filters.isResolved === 'boolean') query.isResolved = filters.isResolved;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  const [alerts, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('resolvedBy', 'email profile.firstName profile.lastName')
      .lean(),
    this.countDocuments(query),
  ]);

  return { alerts, total };
};

// Resolve an alert
securityAlertSchema.statics.resolve = async function (
  alertId,
  resolvedBy,
  resolutionNote,
  resolutionAction = 'investigated'
) {
  return this.findByIdAndUpdate(
    alertId,
    {
      isResolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNote,
      resolutionAction,
    },
    { new: true }
  ).populate('resolvedBy', 'email profile.firstName profile.lastName');
};

// Get alert summary by severity
securityAlertSchema.statics.getSummary = async function () {
  const [bySeverity, byType, unresolvedCount] = await Promise.all([
    this.aggregate([
      { $match: { isResolved: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { isResolved: false } },
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    this.countDocuments({ isResolved: false }),
  ]);

  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  bySeverity.forEach(item => {
    severityCounts[item._id] = item.count;
  });

  return {
    bySeverity: severityCounts,
    topTypes: byType,
    unresolvedCount,
  };
};

// Get recent alerts for dashboard
securityAlertSchema.statics.getRecentAlerts = async function (limit = 10) {
  return this.find({ isResolved: false })
    .sort({ severity: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Record auto-action
securityAlertSchema.statics.recordAutoAction = async function (alertId, action, success, error = null) {
  return this.findByIdAndUpdate(
    alertId,
    {
      $push: {
        autoActions: {
          action,
          executedAt: new Date(),
          success,
          error,
        },
      },
    },
    { new: true }
  );
};

// Get alert trends over time
securityAlertSchema.statics.getAlertTrends = async function (days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: { createdAt: { $gte: startDate } },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          severity: '$severity',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);
};

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
