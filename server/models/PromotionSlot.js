const mongoose = require('mongoose');

const promotionSlotSchema = new mongoose.Schema(
  {
    placement: {
      type: String,
      enum: [
        'homepage_hero',
        'homepage_featured',
        'category_banner',
        'search_sponsored',
        'product_cross_sell',
        'checkout_upsell',
        'sidebar_ad',
      ],
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Slot name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    maxSlots: {
      type: Number,
      default: 5, // Max active promotions in this placement
    },

    pricing: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      perClick: { type: Number, default: 0 }, // For CPC model
      perImpression: { type: Number, default: 0 }, // Per 1000 impressions (CPM)
    },

    pricingModel: {
      type: String,
      enum: ['fixed', 'cpc', 'cpm', 'auction'],
      default: 'fixed',
    },

    dimensions: {
      width: Number,
      height: Number,
      aspectRatio: String, // e.g., "16:9", "1:1"
    },

    allowedEntityTypes: [{
      type: String,
      enum: ['product', 'vendor', 'category'],
    }],

    guidelines: {
      type: String, // Creative guidelines
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index
promotionSlotSchema.index({ placement: 1 });
promotionSlotSchema.index({ isActive: 1 });

// Static method to get available slots
promotionSlotSchema.statics.getAvailableSlots = async function () {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

module.exports = mongoose.model('PromotionSlot', promotionSlotSchema);
