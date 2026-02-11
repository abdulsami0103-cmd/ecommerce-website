const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product and vendor rating after save
reviewSchema.post('save', async function () {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  const Vendor = mongoose.model('Vendor');

  const stats = await Review.aggregate([
    { $match: { product: this.product } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const product = await Product.findByIdAndUpdate(this.product, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].count,
    }, { new: true });

    // Update vendor's overall rating from all their product reviews
    if (product?.vendor) {
      const vendorProducts = await Product.find({ vendor: product.vendor }).distinct('_id');
      const vendorStats = await Review.aggregate([
        { $match: { product: { $in: vendorProducts } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (vendorStats.length > 0) {
        await Vendor.findByIdAndUpdate(product.vendor, {
          'rating.average': Math.round(vendorStats[0].avgRating * 10) / 10,
          'rating.count': vendorStats[0].count,
        });
      }
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
