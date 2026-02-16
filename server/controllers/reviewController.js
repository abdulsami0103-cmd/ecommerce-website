const Review = require('../models/Review');
const ReviewReply = require('../models/ReviewReply');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'profile.firstName profile.lastName profile.avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ product: req.params.productId });

    // Fetch vendor replies for these reviews
    const reviewIds = reviews.map(r => r._id);
    const replies = await ReviewReply.find({ review: { $in: reviewIds }, isPublic: true })
      .populate('vendor', 'storeName');

    const replyMap = {};
    replies.forEach(reply => {
      replyMap[reply.review.toString()] = reply;
    });

    const reviewsWithReplies = reviews.map(review => {
      const obj = review.toObject();
      obj.vendorReply = replyMap[review._id.toString()] || null;
      return obj;
    });

    // Get rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { $match: { product: new (require('mongoose').Types.ObjectId)(req.params.productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: reviewsWithReplies,
      ratingBreakdown,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review
// @route   POST /api/products/:productId/reviews
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { rating, title, comment, images } = req.body;

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: req.params.productId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Check if user has purchased this product (verified purchase)
    const hasPurchased = await Order.findOne({
      customer: req.user.id,
      'items.product': req.params.productId,
      'payment.status': 'paid',
    });

    const review = await Review.create({
      user: req.user.id,
      product: req.params.productId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase: !!hasPurchased,
    });

    await review.populate('user', 'profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment, images } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, title, comment, images },
      { new: true, runValidators: true }
    ).populate('user', 'profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
};
