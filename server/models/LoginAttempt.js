const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      enum: [
        'wrong_password',
        'account_locked',
        'account_disabled',
        '2fa_failed',
        'ip_blocked',
        'user_not_found',
        'email_not_verified',
        'rate_limited',
        null,
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      deviceType: String,
      browser: String,
      os: String,
      country: String,
      city: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rate limiting queries
loginAttemptSchema.index({ email: 1, ipAddress: 1, attemptedAt: -1 });
loginAttemptSchema.index({ ipAddress: 1, attemptedAt: -1 });
loginAttemptSchema.index({ email: 1, status: 1, attemptedAt: -1 });

// TTL index - auto-delete attempts older than 30 days
loginAttemptSchema.index(
  { attemptedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Record a login attempt
loginAttemptSchema.statics.record = async function (data) {
  return this.create({
    ...data,
    attemptedAt: new Date(),
  });
};

// Count failed attempts in a time window
loginAttemptSchema.statics.countFailedAttempts = async function (
  email,
  ipAddress,
  windowMinutes = 15
) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const [byEmail, byIP] = await Promise.all([
    this.countDocuments({
      email,
      status: 'failed',
      attemptedAt: { $gte: windowStart },
    }),
    this.countDocuments({
      ipAddress,
      status: 'failed',
      attemptedAt: { $gte: windowStart },
    }),
  ]);

  return { byEmail, byIP, total: Math.max(byEmail, byIP) };
};

// Check if should block login
loginAttemptSchema.statics.shouldBlockLogin = async function (email, ipAddress) {
  const counts = await this.countFailedAttempts(email, ipAddress, 15);

  // Block thresholds
  const BLOCK_THRESHOLDS = {
    WARNING: 3,
    SOFT_BLOCK: 5,
    HARD_BLOCK: 10,
  };

  if (counts.total >= BLOCK_THRESHOLDS.HARD_BLOCK) {
    return {
      blocked: true,
      reason: 'ip_blocked',
      message: 'Too many failed attempts. Please try again in 1 hour.',
      lockoutMinutes: 60,
    };
  }

  if (counts.total >= BLOCK_THRESHOLDS.SOFT_BLOCK) {
    return {
      blocked: true,
      reason: 'rate_limited',
      message: 'Too many failed attempts. Please try again in 15 minutes.',
      lockoutMinutes: 15,
    };
  }

  return {
    blocked: false,
    attemptsRemaining: BLOCK_THRESHOLDS.SOFT_BLOCK - counts.total,
  };
};

// Get recent attempts for an email
loginAttemptSchema.statics.getRecentAttempts = async function (
  filters = {},
  options = {}
) {
  const query = {};

  if (filters.email) query.email = filters.email;
  if (filters.ipAddress) query.ipAddress = filters.ipAddress;
  if (filters.status) query.status = filters.status;
  if (filters.userId) query.userId = filters.userId;

  if (filters.startDate || filters.endDate) {
    query.attemptedAt = {};
    if (filters.startDate) query.attemptedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.attemptedAt.$lte = new Date(filters.endDate);
  }

  const limit = options.limit || 100;
  const skip = options.skip || 0;

  const [attempts, total] = await Promise.all([
    this.find(query)
      .sort({ attemptedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email profile.firstName profile.lastName role')
      .lean(),
    this.countDocuments(query),
  ]);

  return { attempts, total };
};

// Get failed login statistics
loginAttemptSchema.statics.getFailedLoginStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'failed',
        attemptedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          reason: '$failureReason',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$attemptedAt' } },
        },
        count: { $sum: 1 },
        uniqueIPs: { $addToSet: '$ipAddress' },
        uniqueEmails: { $addToSet: '$email' },
      },
    },
    {
      $project: {
        _id: 0,
        reason: '$_id.reason',
        date: '$_id.date',
        count: 1,
        uniqueIPCount: { $size: '$uniqueIPs' },
        uniqueEmailCount: { $size: '$uniqueEmails' },
      },
    },
    {
      $sort: { date: -1, count: -1 },
    },
  ]);
};

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
