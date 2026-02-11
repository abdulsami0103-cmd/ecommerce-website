const mongoose = require('mongoose');
const crypto = require('crypto');

const activeSessionSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ['admin', 'vendor', 'customer'],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    deviceInfo: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    location: {
      country: String,
      countryCode: String,
      city: String,
      region: String,
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    terminatedAt: {
      type: Date,
    },
    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    terminationReason: {
      type: String,
      enum: ['logout', 'expired', 'forced', 'security', 'password_change'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activeSessionSchema.index({ userId: 1, isActive: 1 });
activeSessionSchema.index({ userId: 1, lastActiveAt: -1 });
activeSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a unique session token
activeSessionSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for storage
activeSessionSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create a new session
activeSessionSchema.statics.createSession = async function (userData, req, expiresInDays = 7) {
  const rawToken = this.generateToken();
  const hashedToken = this.hashToken(rawToken);

  // Parse user agent
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  const session = await this.create({
    userType: userData.role || 'customer',
    userId: userData._id,
    sessionToken: hashedToken,
    ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
    deviceInfo: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    deviceType: deviceInfo.deviceType,
    startedAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
  });

  // Return raw token to send to client
  return { session, rawToken };
};

// Find session by token
activeSessionSchema.statics.findByToken = async function (rawToken) {
  const hashedToken = this.hashToken(rawToken);
  return this.findOne({
    sessionToken: hashedToken,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).populate('userId', 'email role profile');
};

// Update last active time
activeSessionSchema.statics.updateActivity = async function (sessionToken) {
  const hashedToken = this.hashToken(sessionToken);
  return this.findOneAndUpdate(
    { sessionToken: hashedToken, isActive: true },
    { lastActiveAt: new Date() },
    { new: true }
  );
};

// Get user's active sessions
activeSessionSchema.statics.getUserSessions = async function (userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActiveAt: -1 })
    .lean();
};

// Terminate a session
activeSessionSchema.statics.terminate = async function (
  sessionId,
  terminatedBy = null,
  reason = 'logout'
) {
  return this.findByIdAndUpdate(
    sessionId,
    {
      isActive: false,
      terminatedAt: new Date(),
      terminatedBy,
      terminationReason: reason,
    },
    { new: true }
  );
};

// Terminate all sessions for a user (except current)
activeSessionSchema.statics.terminateAllExcept = async function (
  userId,
  currentSessionId,
  reason = 'forced'
) {
  return this.updateMany(
    {
      userId,
      _id: { $ne: currentSessionId },
      isActive: true,
    },
    {
      isActive: false,
      terminatedAt: new Date(),
      terminationReason: reason,
    }
  );
};

// Terminate all sessions for a user
activeSessionSchema.statics.terminateAll = async function (userId, reason = 'security') {
  return this.updateMany(
    { userId, isActive: true },
    {
      isActive: false,
      terminatedAt: new Date(),
      terminationReason: reason,
    }
  );
};

// Get all active sessions (admin)
activeSessionSchema.statics.getAllActiveSessions = async function (filters = {}, options = {}) {
  const query = { isActive: true, expiresAt: { $gt: new Date() } };

  if (filters.userType) query.userType = filters.userType;
  if (filters.userId) query.userId = filters.userId;

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  const [sessions, total] = await Promise.all([
    this.find(query)
      .sort({ lastActiveAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email role profile.firstName profile.lastName')
      .lean(),
    this.countDocuments(query),
  ]);

  return { sessions, total };
};

// Check for suspicious sessions (same user, different location)
activeSessionSchema.statics.checkSuspiciousSessions = async function (userId) {
  const sessions = await this.find({
    userId,
    isActive: true,
    'location.countryCode': { $exists: true },
  }).lean();

  if (sessions.length < 2) return { suspicious: false };

  const countries = [...new Set(sessions.map(s => s.location?.countryCode).filter(Boolean))];

  return {
    suspicious: countries.length > 1,
    countries,
    sessionCount: sessions.length,
  };
};

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const result = {
    browser: 'Unknown',
    os: 'Unknown',
    deviceType: 'unknown',
  };

  // Detect browser
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  else if (userAgent.includes('Opera')) result.browser = 'Opera';

  // Detect OS
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac OS')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) result.os = 'iOS';

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    result.deviceType = userAgent.includes('Tablet') ? 'tablet' : 'mobile';
  } else {
    result.deviceType = 'desktop';
  }

  return result;
}

module.exports = mongoose.model('ActiveSession', activeSessionSchema);
