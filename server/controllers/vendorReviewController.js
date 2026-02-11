const Review = require('../models/Review');
const ReviewReply = require('../models/ReviewReply');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');

/**
 * @desc    Get all reviews for vendor's products
 * @route   GET /api/vendor/reviews
 * @access  Private (Vendor)
 */
exports.getVendorReviews = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { rating, hasReply, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Get all vendor's products
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map((p) => p._id);

    // Build query
    const query = { product: { $in: productIds } };

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Get reviews
    let reviews = await Review.find(query)
      .populate('user', 'profile.firstName profile.lastName email')
      .populate('product', 'name images slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get replies for these reviews
    const reviewIds = reviews.map((r) => r._id);
    const replies = await ReviewReply.find({ review: { $in: reviewIds } });
    const replyMap = replies.reduce((acc, reply) => {
      acc[reply.review.toString()] = reply;
      return acc;
    }, {});

    // Add reply info to reviews
    reviews = reviews.map((review) => {
      const reviewObj = review.toObject();
      reviewObj.reply = replyMap[review._id.toString()] || null;
      return reviewObj;
    });

    // Filter by hasReply if requested
    if (hasReply === 'true') {
      reviews = reviews.filter((r) => r.reply);
    } else if (hasReply === 'false') {
      reviews = reviews.filter((r) => !r.reply);
    }

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get review statistics for vendor
 * @route   GET /api/vendor/reviews/stats
 * @access  Private (Vendor)
 */
exports.getVendorReviewStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Get all vendor's products
    const vendorProducts = await Product.find({ vendor: vendor._id }).select('_id');
    const productIds = vendorProducts.map((p) => p._id);

    // Aggregate review stats
    const stats = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpful: { $sum: '$helpfulCount' },
        },
      },
    ]);

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Format distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    distribution.forEach((d) => {
      ratingDistribution[d._id] = d.count;
    });

    // Count replies
    const totalReplies = await ReviewReply.countDocuments({ vendor: vendor._id });

    // Recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await Review.aggregate([
      {
        $match: {
          product: { $in: productIds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    res.json({
      totalReviews: stats[0]?.totalReviews || 0,
      averageRating: Math.round((stats[0]?.averageRating || 0) * 10) / 10,
      totalHelpful: stats[0]?.totalHelpful || 0,
      ratingDistribution,
      totalReplies,
      responseRate:
        stats[0]?.totalReviews > 0
          ? Math.round((totalReplies / stats[0].totalReviews) * 100)
          : 0,
      last30Days: {
        count: recentStats[0]?.count || 0,
        averageRating: Math.round((recentStats[0]?.averageRating || 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Reply to a review
 * @route   POST /api/vendor/reviews/:id/reply
 * @access  Private (Vendor)
 */
exports.replyToReview = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Get the review
    const review = await Review.findById(req.params.id).populate('product');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify the product belongs to this vendor
    if (review.product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ message: 'You can only reply to reviews on your products' });
    }

    // Check if reply already exists
    const existingReply = await ReviewReply.findOne({ review: review._id });
    if (existingReply) {
      return res.status(400).json({ message: 'You have already replied to this review' });
    }

    // Create reply
    const reply = new ReviewReply({
      review: review._id,
      vendor: vendor._id,
      repliedBy: req.user._id,
      content: content.trim(),
    });

    await reply.save();

    res.status(201).json({
      message: 'Reply posted successfully',
      reply,
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update reply to a review
 * @route   PUT /api/vendor/reviews/:id/reply
 * @access  Private (Vendor)
 */
exports.updateReviewReply = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { content } = req.body;

    const reply = await ReviewReply.findOne({
      review: req.params.id,
      vendor: vendor._id,
    });

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check edit deadline
    if (!reply.canEdit()) {
      return res.status(400).json({
        message: 'Reply can only be edited within 48 hours of posting',
      });
    }

    reply.content = content.trim();
    reply.isEdited = true;
    reply.editedAt = new Date();

    await reply.save();

    res.json({
      message: 'Reply updated successfully',
      reply,
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete reply to a review
 * @route   DELETE /api/vendor/reviews/:id/reply
 * @access  Private (Vendor)
 */
exports.deleteReviewReply = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const reply = await ReviewReply.findOneAndDelete({
      review: req.params.id,
      vendor: vendor._id,
    });

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get public review with reply (for product page)
 * @route   GET /api/reviews/:id
 * @access  Public
 */
exports.getReviewWithReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'profile.firstName profile.lastName')
      .populate('product', 'name slug');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const reply = await ReviewReply.findOne({
      review: review._id,
      isPublic: true,
    }).populate('vendor', 'storeName logo');

    res.json({
      review,
      reply,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
