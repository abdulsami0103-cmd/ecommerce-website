const mongoose = require('mongoose');

const audienceSegmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Segment name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    rules: [{
      field: {
        type: String,
        required: true,
        // Available fields: total_orders, last_order_date, total_spent,
        // location, signup_date, days_since_last_order, avg_order_value,
        // has_reviewed, cart_abandoned, email_opened, push_enabled
      },
      operator: {
        type: String,
        enum: ['>=', '<=', '==', '!=', '>', '<', 'in', 'not_in', 'contains', 'within_days'],
        required: true,
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    }],
    matchType: {
      type: String,
      enum: ['all', 'any'], // AND vs OR
      default: 'all',
    },

    // Cached customer count
    customerCount: {
      type: Number,
      default: 0,
    },
    lastRefreshed: Date,

    // System-defined segments
    isPrebuilt: {
      type: Boolean,
      default: false,
    },
    prebuiltType: {
      type: String,
      enum: ['all_customers', 'new_customers', 'returning_customers', 'vip', 'inactive', 'cart_abandoners'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
audienceSegmentSchema.index({ isActive: 1 });
audienceSegmentSchema.index({ isPrebuilt: 1 });

// Method to build MongoDB query from rules
audienceSegmentSchema.methods.buildQuery = function () {
  const conditions = this.rules.map(rule => {
    const fieldMap = {
      total_orders: 'orderCount',
      total_spent: 'totalSpent',
      location: 'profile.city',
      signup_date: 'createdAt',
      email_opened: 'emailEngagement.lastOpened',
      push_enabled: 'pushEnabled',
    };

    const field = fieldMap[rule.field] || rule.field;

    switch (rule.operator) {
      case '>=':
        return { [field]: { $gte: rule.value } };
      case '<=':
        return { [field]: { $lte: rule.value } };
      case '>':
        return { [field]: { $gt: rule.value } };
      case '<':
        return { [field]: { $lt: rule.value } };
      case '==':
        return { [field]: rule.value };
      case '!=':
        return { [field]: { $ne: rule.value } };
      case 'in':
        return { [field]: { $in: Array.isArray(rule.value) ? rule.value : [rule.value] } };
      case 'not_in':
        return { [field]: { $nin: Array.isArray(rule.value) ? rule.value : [rule.value] } };
      case 'contains':
        return { [field]: { $regex: rule.value, $options: 'i' } };
      case 'within_days':
        return { [field]: { $gte: new Date(Date.now() - rule.value * 24 * 60 * 60 * 1000) } };
      default:
        return {};
    }
  });

  if (this.matchType === 'all') {
    return { $and: conditions };
  } else {
    return { $or: conditions };
  }
};

// Method to refresh customer count
audienceSegmentSchema.methods.refreshCount = async function () {
  const User = mongoose.model('User');

  if (this.isPrebuilt) {
    // Handle prebuilt segments
    switch (this.prebuiltType) {
      case 'all_customers':
        this.customerCount = await User.countDocuments({ role: 'customer' });
        break;
      case 'new_customers':
        this.customerCount = await User.countDocuments({
          role: 'customer',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        });
        break;
      case 'returning_customers':
        // Users with more than 1 order
        this.customerCount = await User.countDocuments({
          role: 'customer',
          orderCount: { $gt: 1 },
        });
        break;
      default:
        break;
    }
  } else if (this.rules && this.rules.length > 0) {
    const query = this.buildQuery();
    query.role = 'customer';
    this.customerCount = await User.countDocuments(query);
  }

  this.lastRefreshed = new Date();
  await this.save();
  return this.customerCount;
};

// Static method to get prebuilt segments
audienceSegmentSchema.statics.getPrebuiltSegments = async function () {
  const prebuiltTypes = [
    { type: 'all_customers', name: 'All Customers', description: 'All registered customers' },
    { type: 'new_customers', name: 'New Customers', description: 'Customers who signed up in the last 30 days' },
    { type: 'returning_customers', name: 'Returning Customers', description: 'Customers with more than one order' },
    { type: 'inactive', name: 'Inactive Customers', description: 'Customers who haven\'t ordered in 60+ days' },
    { type: 'cart_abandoners', name: 'Cart Abandoners', description: 'Customers with abandoned carts' },
  ];

  const segments = [];
  for (const pt of prebuiltTypes) {
    let segment = await this.findOne({ prebuiltType: pt.type, isPrebuilt: true });
    if (!segment) {
      segment = await this.create({
        name: pt.name,
        description: pt.description,
        isPrebuilt: true,
        prebuiltType: pt.type,
        rules: [],
      });
    }
    await segment.refreshCount();
    segments.push(segment);
  }
  return segments;
};

module.exports = mongoose.model('AudienceSegment', audienceSegmentSchema);
