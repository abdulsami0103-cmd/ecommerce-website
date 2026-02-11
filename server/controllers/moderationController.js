const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const ModerationLog = require('../models/ModerationLog');

// @desc    Get moderation queue
// @route   GET /api/admin/products/moderation-queue
// @access  Private (Admin)
exports.getModerationQueue = async (req, res) => {
  try {
    const {
      status = 'pending_review',
      vendor,
      category,
      dateFrom,
      dateTo,
      sort = 'submittedAt_asc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Status filter
    if (status !== 'all') {
      query['moderation.status'] = status;
    }

    // Vendor filter
    if (vendor) {
      query.vendor = vendor;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query['moderation.submittedAt'] = {};
      if (dateFrom) query['moderation.submittedAt'].$gte = new Date(dateFrom);
      if (dateTo) query['moderation.submittedAt'].$lte = new Date(dateTo);
    }

    // Sorting
    let sortObj = {};
    if (sort === 'submittedAt_asc') {
      sortObj = { 'moderation.submittedAt': 1 };
    } else if (sort === 'submittedAt_desc') {
      sortObj = { 'moderation.submittedAt': -1 };
    } else if (sort === 'name_asc') {
      sortObj = { name: 1 };
    } else if (sort === 'name_desc') {
      sortObj = { name: -1 };
    }

    const products = await Product.find(query)
      .populate('vendor', 'storeName storeSlug trustedVendor')
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get moderation queue statistics
// @route   GET /api/admin/products/moderation-queue/stats
// @access  Private (Admin)
exports.getModerationStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$moderation.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending_review: 0,
      approved: 0,
      published: 0,
      rejected: 0,
      changes_requested: 0,
      draft: 0,
    };

    stats.forEach(s => {
      if (s._id && formattedStats.hasOwnProperty(s._id)) {
        formattedStats[s._id] = s.count;
      }
    });

    res.json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Moderate a product
// @route   PATCH /api/admin/products/:id/moderate
// @access  Private (Admin)
exports.moderateProduct = async (req, res) => {
  try {
    const { action, reason, notes } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStatus = product.moderation.status;
    let newStatus;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        product.moderation.status = 'approved';
        product.moderation.reviewedAt = new Date();
        product.moderation.reviewedBy = req.user._id;
        product.moderation.rejectionReason = null;
        product.moderation.changesRequested = null;
        break;

      case 'reject':
        if (!reason) {
          return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }
        newStatus = 'rejected';
        product.moderation.status = 'rejected';
        product.moderation.reviewedAt = new Date();
        product.moderation.reviewedBy = req.user._id;
        product.moderation.rejectionReason = reason;
        break;

      case 'request_changes':
        if (!reason) {
          return res.status(400).json({ success: false, message: 'Please specify what changes are needed' });
        }
        newStatus = 'changes_requested';
        product.moderation.status = 'changes_requested';
        product.moderation.reviewedAt = new Date();
        product.moderation.reviewedBy = req.user._id;
        product.moderation.changesRequested = reason;
        break;

      case 'publish':
        if (product.moderation.status !== 'approved') {
          return res.status(400).json({ success: false, message: 'Product must be approved before publishing' });
        }
        newStatus = 'published';
        product.moderation.status = 'published';
        product.status = 'active'; // Also set the main status to active
        break;

      case 'unpublish':
        newStatus = 'approved';
        product.moderation.status = 'approved';
        product.status = 'inactive';
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await product.save();

    // Map action to log action (frontend sends 'approve', log expects 'approved')
    const logActionMap = {
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
      publish: 'published',
      unpublish: 'unpublished',
    };

    // Log the moderation action
    await ModerationLog.logAction({
      product: product._id,
      vendor: product.vendor,
      reviewer: req.user._id,
      action: logActionMap[action] || action,
      previousStatus,
      newStatus,
      reason,
      notes,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // TODO: Send notification to vendor

    res.json({
      success: true,
      message: `Product ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'request_changes' ? 'changes requested' : action}`,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get moderation history for a product
// @route   GET /api/admin/products/:id/moderation-history
// @access  Private (Admin)
exports.getProductModerationHistory = async (req, res) => {
  try {
    const history = await ModerationLog.getProductHistory(req.params.id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle trusted vendor status
// @route   PUT /api/admin/vendors/:id/trusted-status
// @access  Private (Admin)
exports.toggleTrustedStatus = async (req, res) => {
  try {
    const { isTrusted, autoApproveProducts } = req.body;
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.trustedVendor = {
      isTrusted: isTrusted !== undefined ? isTrusted : vendor.trustedVendor?.isTrusted,
      autoApproveProducts: autoApproveProducts !== undefined ? autoApproveProducts : vendor.trustedVendor?.autoApproveProducts,
      trustedAt: isTrusted ? new Date() : vendor.trustedVendor?.trustedAt,
      trustedBy: isTrusted ? req.user._id : vendor.trustedVendor?.trustedBy,
    };

    await vendor.save();

    res.json({
      success: true,
      message: `Vendor trusted status updated`,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit product for review (vendor)
// @route   POST /api/products/:id/submit-for-review
// @access  Private (Vendor)
exports.submitForReview = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if product can be submitted
    if (!['draft', 'changes_requested', 'rejected'].includes(product.moderation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Product cannot be submitted in current state',
      });
    }

    const previousStatus = product.moderation.status;

    // Check if vendor is trusted for auto-approval
    if (vendor.trustedVendor?.isTrusted && vendor.trustedVendor?.autoApproveProducts) {
      product.moderation.status = 'approved';
      product.moderation.autoApproved = true;
      product.moderation.reviewedAt = new Date();

      await ModerationLog.logAction({
        product: product._id,
        vendor: vendor._id,
        action: 'auto_approved',
        previousStatus,
        newStatus: 'approved',
      });
    } else {
      product.moderation.status = 'pending_review';
      product.moderation.submittedAt = new Date();
      product.moderation.reviewCount += 1;

      await ModerationLog.logAction({
        product: product._id,
        vendor: vendor._id,
        action: previousStatus === 'draft' ? 'submitted' : 'resubmitted',
        previousStatus,
        newStatus: 'pending_review',
      });
    }

    await product.save();

    res.json({
      success: true,
      message: product.moderation.autoApproved
        ? 'Product auto-approved'
        : 'Product submitted for review',
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
