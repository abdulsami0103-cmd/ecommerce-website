const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Coupon name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Value cannot be negative'],
    },
    scope: {
      type: String,
      enum: ['platform', 'vendor', 'category', 'product'],
      default: 'platform',
    },
    // For category/product scope - which items this coupon applies to
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number, // Maximum discount amount for percentage coupons
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 1 },
      },
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null, // null means platform-wide coupon
    },
    // New advanced fields
    stackable: {
      type: Boolean,
      default: false, // Can combine with other coupons
    },
    autoApply: {
      type: Boolean,
      default: false, // Auto-apply at checkout (no code needed)
    },
    commissionAbsorber: {
      type: String,
      enum: ['platform', 'vendor', 'split'],
      default: 'platform', // Who absorbs the discount cost
    },
    // For buy_x_get_y type
    buyXGetY: {
      buyQuantity: { type: Number, default: 0 },
      getQuantity: { type: Number, default: 0 },
      getDiscount: { type: Number, default: 100 }, // Percentage off the "get" items
    },
    // First order only
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    // Customer groups
    customerGroups: [{
      type: String,
      enum: ['new', 'returning', 'vip', 'wholesale'],
    }],
    // Minimum items required
    minItems: {
      type: Number,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Check if coupon is valid
couponSchema.methods.isValid = function (userId, cartTotal, options = {}) {
  const now = new Date();
  const { cartItems = [], isFirstOrder = false, customerGroup = 'returning' } = options;

  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.startsAt && this.startsAt > now) return { valid: false, message: 'Coupon is not yet active' };
  if (this.expiresAt < now) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  if (cartTotal < this.minPurchase) {
    return { valid: false, message: `Minimum purchase of Rs. ${this.minPurchase} required` };
  }

  // Check per-user limit
  if (userId) {
    const userUsage = this.usedBy.find((u) => u.user && u.user.toString() === userId.toString());
    if (userUsage && userUsage.count >= this.perUserLimit) {
      return { valid: false, message: 'You have already used this coupon the maximum number of times' };
    }
  }

  // Check first order only
  if (this.firstOrderOnly && !isFirstOrder) {
    return { valid: false, message: 'This coupon is valid for first orders only' };
  }

  // Check customer groups
  if (this.customerGroups && this.customerGroups.length > 0) {
    if (!this.customerGroups.includes(customerGroup)) {
      return { valid: false, message: 'This coupon is not available for your customer group' };
    }
  }

  // Check minimum items
  if (this.minItems > 0) {
    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (totalItems < this.minItems) {
      return { valid: false, message: `Minimum ${this.minItems} items required` };
    }
  }

  // Check applicable categories/products for scoped coupons
  if (this.scope === 'category' && this.applicableCategories.length > 0) {
    const hasApplicableItem = cartItems.some(item =>
      this.applicableCategories.some(cat =>
        cat.toString() === (item.category?.toString() || item.categoryId?.toString())
      )
    );
    if (!hasApplicableItem) {
      return { valid: false, message: 'No items in cart are eligible for this coupon' };
    }
  }

  if (this.scope === 'product' && this.applicableProducts.length > 0) {
    const hasApplicableItem = cartItems.some(item =>
      this.applicableProducts.some(prod =>
        prod.toString() === (item.product?.toString() || item.productId?.toString())
      )
    );
    if (!hasApplicableItem) {
      return { valid: false, message: 'No items in cart are eligible for this coupon' };
    }
  }

  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function (total, options = {}) {
  const { cartItems = [], shippingCost = 0 } = options;
  let discount = 0;

  if (this.type === 'percentage') {
    let applicableTotal = total;

    // Calculate applicable total for scoped coupons
    if (this.scope === 'category' && this.applicableCategories.length > 0) {
      applicableTotal = cartItems
        .filter(item => this.applicableCategories.some(cat =>
          cat.toString() === (item.category?.toString() || item.categoryId?.toString())
        ))
        .reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    } else if (this.scope === 'product' && this.applicableProducts.length > 0) {
      applicableTotal = cartItems
        .filter(item => this.applicableProducts.some(prod =>
          prod.toString() === (item.product?.toString() || item.productId?.toString())
        ))
        .reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }

    discount = (applicableTotal * this.value) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.type === 'fixed') {
    discount = this.value;
  } else if (this.type === 'free_shipping') {
    discount = shippingCost;
  } else if (this.type === 'buy_x_get_y') {
    // Calculate buy X get Y discount
    const { buyQuantity, getQuantity, getDiscount } = this.buyXGetY;
    if (buyQuantity && getQuantity) {
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const eligibleSets = Math.floor(totalItems / (buyQuantity + getQuantity));
      if (eligibleSets > 0) {
        // Apply discount to the cheapest items as "get" items
        const sortedPrices = cartItems
          .flatMap(item => Array((item.quantity || 1)).fill(item.price))
          .sort((a, b) => a - b);
        const freeItems = eligibleSets * getQuantity;
        const freeItemsTotal = sortedPrices.slice(0, freeItems).reduce((sum, p) => sum + p, 0);
        discount = (freeItemsTotal * getDiscount) / 100;
      }
    }
  }

  return Math.min(discount, total);
};

// Static method to find auto-apply coupons
couponSchema.statics.findAutoApplyCoupons = function (options = {}) {
  const { vendorId, cartTotal, cartItems } = options;
  const now = new Date();

  const query = {
    isActive: true,
    autoApply: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ],
  };

  if (cartTotal) {
    query.minPurchase = { $lte: cartTotal };
  }

  // Include platform coupons and vendor-specific coupons
  if (vendorId) {
    query.$or = [
      { vendor: null, scope: 'platform' },
      { vendor: vendorId },
    ];
  } else {
    query.vendor = null;
  }

  return this.find(query).sort({ value: -1 });
};

// Index for efficient queries
couponSchema.index({ code: 1 });
couponSchema.index({ vendor: 1, isActive: 1 });
couponSchema.index({ autoApply: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
