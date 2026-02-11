const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    couponCode: {
      type: String,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    orderTotal: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'],
    },
    // Who absorbed the discount cost
    absorbedBy: {
      type: String,
      enum: ['platform', 'vendor', 'split'],
      default: 'platform',
    },
    platformAbsorption: {
      type: Number,
      default: 0,
    },
    vendorAbsorption: {
      type: Number,
      default: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
couponUsageSchema.index({ coupon: 1, customer: 1 });
couponUsageSchema.index({ order: 1 });
couponUsageSchema.index({ vendor: 1 });
couponUsageSchema.index({ usedAt: -1 });

// Static method to get coupon usage stats
couponUsageSchema.statics.getCouponStats = async function (couponId) {
  const stats = await this.aggregate([
    { $match: { coupon: new mongoose.Types.ObjectId(couponId) } },
    {
      $group: {
        _id: null,
        totalUsage: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' },
        totalRevenue: { $sum: '$orderTotal' },
        avgDiscount: { $avg: '$discountAmount' },
        avgOrderValue: { $avg: '$orderTotal' },
        uniqueCustomers: { $addToSet: '$customer' },
      },
    },
    {
      $project: {
        _id: 0,
        totalUsage: 1,
        totalDiscount: 1,
        totalRevenue: 1,
        avgDiscount: { $round: ['$avgDiscount', 2] },
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        uniqueCustomers: { $size: '$uniqueCustomers' },
      },
    },
  ]);

  return stats[0] || {
    totalUsage: 0,
    totalDiscount: 0,
    totalRevenue: 0,
    avgDiscount: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0,
  };
};

// Static method to check user's usage count for a coupon
couponUsageSchema.statics.getUserUsageCount = async function (couponId, userId) {
  return this.countDocuments({ coupon: couponId, customer: userId });
};

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
