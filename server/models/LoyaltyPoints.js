const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const loyaltyPointsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    referralCode: {
      type: String,
      unique: true,
    },
    transactions: [loyaltyTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code before saving
loyaltyPointsSchema.pre('save', async function (next) {
  if (!this.referralCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.referralCode = code;
  }

  // Update tier based on lifetime points
  if (this.lifetimePoints >= 10000) {
    this.tier = 'platinum';
  } else if (this.lifetimePoints >= 5000) {
    this.tier = 'gold';
  } else if (this.lifetimePoints >= 2000) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }

  next();
});

// Method to add points
loyaltyPointsSchema.methods.addPoints = async function (points, type, description, orderId = null) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Points expire in 1 year

  this.transactions.push({
    type,
    points,
    description,
    orderId,
    expiresAt,
  });

  this.totalPoints += points;
  this.availablePoints += points;
  this.lifetimePoints += points;

  await this.save();
  return this;
};

// Method to redeem points
loyaltyPointsSchema.methods.redeemPoints = async function (points, description, orderId = null) {
  if (points > this.availablePoints) {
    throw new Error('Insufficient points');
  }

  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description,
    orderId,
  });

  this.availablePoints -= points;

  await this.save();
  return this;
};

// Index for quick lookups
loyaltyPointsSchema.index({ user: 1 });
loyaltyPointsSchema.index({ referralCode: 1 });

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
