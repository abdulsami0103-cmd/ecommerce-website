const mongoose = require('mongoose');

const orderCommissionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // subdocument ID from Order.items
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  // Sale details
  saleAmount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },

  // Commission calculation details
  commissionRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionRule',
  },
  commissionType: {
    type: String,
    enum: ['fixed', 'percentage', 'tiered', 'plan_default'],
    required: true,
  },
  commissionRate: { type: Number, required: true }, // percentage or fixed value used
  tierLevel: { type: String }, // e.g., "0-10000" for tiered

  // Calculated amounts
  commissionAmount: { type: Number, required: true },
  vendorEarning: { type: Number, required: true },

  // Snapshot of rule at time of calculation (for audit)
  appliedRuleSnapshot: {
    name: String,
    scope: String,
    type: String,
    value: Number,
    ruleId: mongoose.Schema.Types.ObjectId,
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'credited', 'refunded', 'disputed', 'cancelled'],
    default: 'pending',
  },

  // When earnings were credited to vendor wallet
  creditedAt: { type: Date },
  creditedToWallet: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorWallet' },

  // For refunds
  refundedAt: { type: Date },
  refundAmount: { type: Number },
  refundReason: { type: String },
}, {
  timestamps: true,
});

// Indexes
orderCommissionSchema.index({ order: 1 });
orderCommissionSchema.index({ vendor: 1, createdAt: -1 });
orderCommissionSchema.index({ vendor: 1, status: 1 });
orderCommissionSchema.index({ status: 1, createdAt: -1 });
orderCommissionSchema.index({ product: 1 });

// Static method to get vendor's period sales for tiered calculation
orderCommissionSchema.statics.getVendorPeriodSales = async function(vendorId, period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'per_order':
    default:
      return 0; // Per-order doesn't need cumulative sales
  }

  const result = await this.aggregate([
    {
      $match: {
        vendor: vendorId,
        createdAt: { $gte: startDate },
        status: { $nin: ['refunded', 'cancelled'] },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$saleAmount' },
      },
    },
  ]);

  return result[0]?.totalSales || 0;
};

// Static method to get commission summary for vendor
orderCommissionSchema.statics.getVendorCommissionSummary = async function(vendorId, startDate, endDate) {
  const match = {
    vendor: mongoose.Types.ObjectId(vendorId),
    status: { $nin: ['cancelled'] },
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        totalSales: { $sum: '$saleAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalEarnings: { $sum: '$vendorEarning' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    totalSales: 0,
    totalCommission: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    creditedEarnings: 0,
    refundedAmount: 0,
    orderCount: 0,
  };

  result.forEach(item => {
    summary.totalSales += item.totalSales;
    summary.totalCommission += item.totalCommission;
    summary.orderCount += item.count;

    if (item._id === 'credited') {
      summary.creditedEarnings += item.totalEarnings;
      summary.totalEarnings += item.totalEarnings;
    } else if (item._id === 'pending') {
      summary.pendingEarnings += item.totalEarnings;
      summary.totalEarnings += item.totalEarnings;
    } else if (item._id === 'refunded') {
      summary.refundedAmount += item.totalEarnings;
    }
  });

  return summary;
};

module.exports = mongoose.model('OrderCommission', orderCommissionSchema);
