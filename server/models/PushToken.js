const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceType: {
      type: String,
      enum: ['web', 'ios', 'android'],
      required: true,
    },
    deviceInfo: {
      type: String, // User agent or device identifier
    },
    deviceName: {
      type: String, // Human-readable device name
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    failureCount: {
      type: Number,
      default: 0, // Track failed delivery attempts
    },
    lastFailure: Date,
    lastFailureReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
pushTokenSchema.index({ user: 1 });
pushTokenSchema.index({ token: 1 });
pushTokenSchema.index({ isActive: 1 });

// Static method to register or update token
pushTokenSchema.statics.registerToken = async function (userId, token, deviceType, deviceInfo) {
  // Check if token already exists
  let pushToken = await this.findOne({ token });

  if (pushToken) {
    // Update existing token
    pushToken.user = userId;
    pushToken.deviceType = deviceType;
    pushToken.deviceInfo = deviceInfo;
    pushToken.isActive = true;
    pushToken.lastUsed = new Date();
    pushToken.failureCount = 0;
    await pushToken.save();
  } else {
    // Create new token
    pushToken = await this.create({
      user: userId,
      token,
      deviceType,
      deviceInfo,
    });
  }

  return pushToken;
};

// Static method to get active tokens for a user
pushTokenSchema.statics.getActiveTokens = function (userId) {
  return this.find({
    user: userId,
    isActive: true,
    failureCount: { $lt: 3 }, // Exclude tokens with too many failures
  });
};

// Static method to mark token as failed
pushTokenSchema.statics.markFailed = async function (token, reason) {
  const pushToken = await this.findOne({ token });
  if (pushToken) {
    pushToken.failureCount += 1;
    pushToken.lastFailure = new Date();
    pushToken.lastFailureReason = reason;

    // Deactivate after 3 failures
    if (pushToken.failureCount >= 3) {
      pushToken.isActive = false;
    }

    await pushToken.save();
  }
};

// Static method to deactivate token
pushTokenSchema.statics.deactivateToken = function (token) {
  return this.findOneAndUpdate(
    { token },
    { isActive: false },
    { new: true }
  );
};

module.exports = mongoose.model('PushToken', pushTokenSchema);
