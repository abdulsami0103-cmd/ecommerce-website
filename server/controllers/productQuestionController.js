const ProductQuestion = require('../models/ProductQuestion');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Get questions for a product
// @route   GET /api/products/:productId/questions
// @access  Public
const getProductQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const questions = await ProductQuestion.find({ product: req.params.productId })
      .populate('user', 'profile.firstName profile.lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ProductQuestion.countDocuments({ product: req.params.productId });

    res.status(200).json({
      success: true,
      data: questions,
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

// @desc    Ask a question on a product
// @route   POST /api/products/:productId/questions
// @access  Private
const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newQuestion = await ProductQuestion.create({
      product: req.params.productId,
      user: req.user.id,
      question: question.trim(),
    });

    await newQuestion.populate('user', 'profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      data: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions for vendor's products
// @route   GET /api/vendor/questions
// @access  Private (Vendor)
const getVendorQuestions = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor not found' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get all vendor's product IDs
    const vendorProducts = await Product.find({ vendor: vendor._id }).distinct('_id');

    const filter = { product: { $in: vendorProducts } };

    // Filter by answered/unanswered
    if (req.query.status === 'answered') {
      filter['answer.content'] = { $exists: true, $ne: null };
    } else if (req.query.status === 'unanswered') {
      filter.$or = [{ 'answer.content': { $exists: false } }, { 'answer.content': null }];
    }

    const questions = await ProductQuestion.find(filter)
      .populate('user', 'profile.firstName profile.lastName')
      .populate('product', 'name slug images')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ProductQuestion.countDocuments(filter);
    const totalUnanswered = await ProductQuestion.countDocuments({
      product: { $in: vendorProducts },
      $or: [{ 'answer.content': { $exists: false } }, { 'answer.content': null }],
    });

    res.status(200).json({
      success: true,
      data: questions,
      totalUnanswered,
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

// @desc    Answer a question
// @route   PUT /api/vendor/questions/:id/answer
// @access  Private (Vendor)
const answerQuestion = async (req, res, next) => {
  try {
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Answer is required' });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor not found' });
    }

    const question = await ProductQuestion.findById(req.params.id).populate('product', 'vendor');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Check ownership
    if (question.product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    question.answer = {
      content: answer.trim(),
      answeredBy: req.user.id,
      answeredAt: new Date(),
    };
    await question.save();

    await question.populate('user', 'profile.firstName profile.lastName');
    await question.populate('product', 'name slug images');

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductQuestions,
  askQuestion,
  getVendorQuestions,
  answerQuestion,
};
