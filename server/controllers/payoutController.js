const VendorWallet = require('../models/VendorWallet');
const WalletTransaction = require('../models/WalletTransaction');
const PayoutRequest = require('../models/PayoutRequest');
const PayoutSettings = require('../models/PayoutSettings');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const OrderCommission = require('../models/OrderCommission');

// Configuration
const HOLDING_PERIOD_DAYS = parseInt(process.env.HOLDING_PERIOD_DAYS) || 7;
const MIN_WITHDRAWAL_DEFAULT = parseInt(process.env.MIN_WITHDRAWAL) || 1000;

// ============ VENDOR WALLET ENDPOINTS ============

// @desc    Get vendor wallet
// @route   GET /api/payouts/wallet
// @access  Private (Vendor)
exports.getWallet = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const wallet = await VendorWallet.getOrCreateWallet(vendor._id);

    res.json({
      success: true,
      data: {
        ...wallet.toObject(),
        totalBalance: wallet.totalBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wallet transactions
// @route   GET /api/payouts/wallet/transactions
// @access  Private (Vendor)
exports.getWalletTransactions = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { type, category, page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { vendor: vendor._id };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
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

// @desc    Get expected earnings (from pending/processing/shipped orders)
// @route   GET /api/payouts/wallet/expected
// @access  Private (Vendor)
exports.getExpectedEarnings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get sub-orders that are not yet delivered or cancelled
    const pendingSubOrders = await SubOrder.find({
      vendor: vendor._id,
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'] }
    }).populate('parentOrder', 'orderNumber payment');

    // Calculate expected earnings
    let totalExpected = 0;
    let paidOrdersExpected = 0;
    let unpaidOrdersExpected = 0;
    const orderBreakdown = [];

    for (const subOrder of pendingSubOrders) {
      const vendorEarning = subOrder.vendorEarnings || (subOrder.total - (subOrder.commissionAmount || 0));
      const isPaid = subOrder.parentOrder?.payment?.status === 'paid';

      totalExpected += vendorEarning;

      if (isPaid) {
        paidOrdersExpected += vendorEarning;
      } else {
        unpaidOrdersExpected += vendorEarning;
      }

      orderBreakdown.push({
        subOrderId: subOrder._id,
        subOrderNumber: subOrder.subOrderNumber,
        orderNumber: subOrder.parentOrder?.orderNumber,
        status: subOrder.status,
        paymentStatus: subOrder.parentOrder?.payment?.status || 'pending',
        total: subOrder.total,
        commission: subOrder.commissionAmount || 0,
        vendorEarning,
        createdAt: subOrder.createdAt
      });
    }

    res.json({
      success: true,
      data: {
        totalExpected,
        paidOrdersExpected,
        unpaidOrdersExpected,
        orderCount: pendingSubOrders.length,
        breakdown: orderBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PAYOUT REQUEST ENDPOINTS ============

// @desc    Request payout
// @route   POST /api/payouts/request
// @access  Private (Vendor)
exports.requestPayout = async (req, res) => {
  try {
    const { amount, paymentMethodId, notes } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const wallet = await VendorWallet.getOrCreateWallet(vendor._id);
    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);

    // Safety Check 1: Minimum withdrawal threshold
    const minWithdrawal = settings.minimumWithdrawal || MIN_WITHDRAWAL_DEFAULT;
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${minWithdrawal} ${wallet.currency}`,
      });
    }

    // Safety Check 2: Sufficient available balance
    if (amount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance. Available: ${wallet.availableBalance} ${wallet.currency}`,
      });
    }

    // Safety Check 3: Rate limiting (1 request per 24 hours for non-completed)
    const canRequest = await PayoutRequest.canVendorRequestPayout(vendor._id);
    if (!canRequest.canRequest) {
      return res.status(400).json({
        success: false,
        message: canRequest.reason,
        nextAvailableAt: canRequest.nextAvailableAt,
      });
    }

    // Safety Check 4: Open disputes
    const openDisputes = await Order.countDocuments({
      'items.vendor': vendor._id,
      status: { $in: ['disputed', 'refund_requested'] },
    });

    if (openDisputes > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot process payout with ${openDisputes} open dispute(s). Please resolve them first.`,
      });
    }

    // Get payment method
    let paymentMethod;
    if (paymentMethodId) {
      paymentMethod = settings.paymentMethods.id(paymentMethodId);
    } else {
      paymentMethod = settings.getDefaultMethod();
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'No payment method found. Please add a payment method first.',
      });
    }

    if (!paymentMethod.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is not verified. Please verify your payment method first.',
      });
    }

    // Reserve the amount from wallet
    await wallet.reserveForPayout(amount);

    // Create payout request
    const payoutRequest = await PayoutRequest.create({
      vendor: vendor._id,
      wallet: wallet._id,
      requestedAmount: amount,
      currency: wallet.currency,
      paymentMethod: {
        type: paymentMethod.type,
        details: paymentMethod.details,
      },
      vendorNotes: notes,
      safetyChecks: {
        hasOpenDisputes: false,
        disputeCount: 0,
        lastPayoutWithin24h: false,
        balanceVerified: true,
        paymentMethodVerified: true,
      },
      statusHistory: [{
        status: 'requested',
        changedAt: new Date(),
      }],
    });

    // Update last payout request time
    settings.lastPayoutRequestAt = new Date();
    await settings.save();

    // Create wallet transaction for hold
    await WalletTransaction.createTransaction({
      wallet: wallet._id,
      vendor: vendor._id,
      type: 'hold',
      category: 'payout',
      amount,
      reference: {
        type: 'PayoutRequest',
        id: payoutRequest._id,
      },
      description: `Payout request #${payoutRequest._id.toString().slice(-8)}`,
    });

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payoutRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor's payout requests
// @route   GET /api/payouts/requests
// @access  Private (Vendor)
exports.getPayoutRequests = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (status) query.status = status;

    const requests = await PayoutRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PayoutRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
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

// @desc    Get payout request details
// @route   GET /api/payouts/requests/:id
// @access  Private (Vendor)
exports.getPayoutRequest = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const request = await PayoutRequest.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel payout request
// @route   DELETE /api/payouts/requests/:id
// @access  Private (Vendor)
exports.cancelPayoutRequest = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const request = await PayoutRequest.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    await request.cancel(req.user._id, 'Cancelled by vendor');

    // Create wallet transaction for release
    const wallet = await VendorWallet.findById(request.wallet);
    await WalletTransaction.createTransaction({
      wallet: wallet._id,
      vendor: vendor._id,
      type: 'release',
      category: 'payout',
      amount: request.requestedAmount,
      reference: {
        type: 'PayoutRequest',
        id: request._id,
      },
      description: `Payout request cancelled`,
    });

    res.json({
      success: true,
      message: 'Payout request cancelled',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PAYOUT SETTINGS ENDPOINTS ============

// @desc    Get payout settings
// @route   GET /api/payouts/settings
// @access  Private (Vendor)
exports.getPayoutSettings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payout settings
// @route   PUT /api/payouts/settings
// @access  Private (Vendor)
exports.updatePayoutSettings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);

    const allowedUpdates = ['minimumWithdrawal', 'preferredCurrency', 'autoWithdraw', 'notifications'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.json({
      success: true,
      message: 'Payout settings updated',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add payment method
// @route   POST /api/payouts/settings/methods
// @access  Private (Vendor)
exports.addPaymentMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);
    await settings.addPaymentMethod(req.body);

    res.status(201).json({
      success: true,
      message: 'Payment method added',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment method
// @route   PUT /api/payouts/settings/methods/:methodId
// @access  Private (Vendor)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);
    await settings.updatePaymentMethod(req.params.methodId, req.body);

    res.json({
      success: true,
      message: 'Payment method updated',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove payment method
// @route   DELETE /api/payouts/settings/methods/:methodId
// @access  Private (Vendor)
exports.removePaymentMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const settings = await PayoutSettings.getOrCreateSettings(vendor._id);
    await settings.removePaymentMethod(req.params.methodId);

    res.json({
      success: true,
      message: 'Payment method removed',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ ADMIN ENDPOINTS ============

// @desc    Get all payout requests (Admin)
// @route   GET /api/admin/payouts
// @access  Private (Admin)
exports.getAllPayoutRequests = async (req, res) => {
  try {
    const { status, vendor, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vendor) query.vendor = vendor;

    const requests = await PayoutRequest.find(query)
      .populate('vendor', 'storeName storeSlug user')
      .populate('wallet', 'availableBalance pendingBalance')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PayoutRequest.countDocuments(query);

    // Get stats
    const stats = await PayoutRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$requestedAmount' },
        },
      },
    ]);

    res.json({
      success: true,
      data: requests,
      stats: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, total: s.total };
        return acc;
      }, {}),
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

// @desc    Start review of payout request
// @route   PUT /api/admin/payouts/:id/review
// @access  Private (Admin)
exports.startReview = async (req, res) => {
  try {
    const request = await PayoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    await request.startReview(req.user._id);

    res.json({
      success: true,
      message: 'Review started',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve payout request
// @route   PUT /api/admin/payouts/:id/approve
// @access  Private (Admin)
exports.approvePayout = async (req, res) => {
  try {
    const { notes } = req.body;

    const request = await PayoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    await request.approve(req.user._id, notes);

    res.json({
      success: true,
      message: 'Payout approved',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject payout request
// @route   PUT /api/admin/payouts/:id/reject
// @access  Private (Admin)
exports.rejectPayout = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const request = await PayoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    await request.reject(req.user._id, reason);

    // Create wallet transaction for release
    const wallet = await VendorWallet.findById(request.wallet);
    await WalletTransaction.createTransaction({
      wallet: wallet._id,
      vendor: request.vendor,
      type: 'release',
      category: 'payout',
      amount: request.requestedAmount,
      reference: {
        type: 'PayoutRequest',
        id: request._id,
      },
      description: `Payout rejected: ${reason}`,
      performedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Payout rejected',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process approved payout
// @route   PUT /api/admin/payouts/:id/process
// @access  Private (Admin)
exports.processPayout = async (req, res) => {
  try {
    const { transactionId, externalReference } = req.body;

    const request = await PayoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Payout must be approved before processing' });
    }

    // Start processing
    await request.startProcessing(req.user._id);

    // Complete the payout
    await request.complete(transactionId, externalReference, req.user._id);

    // Create wallet transaction for debit
    const wallet = await VendorWallet.findById(request.wallet);
    await WalletTransaction.createTransaction({
      wallet: wallet._id,
      vendor: request.vendor,
      type: 'debit',
      category: 'payout',
      amount: request.requestedAmount,
      reference: {
        type: 'PayoutRequest',
        id: request._id,
      },
      description: `Payout completed - ${transactionId}`,
      performedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Payout processed successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify vendor payment method (Admin)
// @route   PUT /api/admin/payouts/verify-method/:vendorId/:methodId
// @access  Private (Admin)
exports.verifyPaymentMethod = async (req, res) => {
  try {
    const { vendorId, methodId } = req.params;

    const settings = await PayoutSettings.findOne({ vendor: vendorId });
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Vendor settings not found' });
    }

    await settings.verifyMethod(methodId, req.user._id);

    res.json({
      success: true,
      message: 'Payment method verified',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ HELPER FUNCTIONS ============

// Credit vendor earnings (called after order item delivered)
exports.creditVendorEarnings = async (orderCommission) => {
  const wallet = await VendorWallet.getOrCreateWallet(orderCommission.vendor);

  // Calculate release date
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() + HOLDING_PERIOD_DAYS);

  // Add to pending balance
  await wallet.addPendingEarnings(orderCommission.vendorEarning, orderCommission.commissionAmount);

  // Create transaction record
  await WalletTransaction.create({
    wallet: wallet._id,
    vendor: orderCommission.vendor,
    type: 'credit',
    category: 'sale',
    amount: orderCommission.vendorEarning,
    balanceAfter: {
      available: wallet.availableBalance,
      pending: wallet.pendingBalance,
      reserved: wallet.reservedBalance,
    },
    reference: {
      type: 'OrderCommission',
      id: orderCommission._id,
    },
    description: `Sale earnings - Order ${orderCommission.order}`,
    releaseDate,
  });

  // Update commission status
  orderCommission.status = 'credited';
  orderCommission.creditedAt = new Date();
  orderCommission.creditedToWallet = wallet._id;
  await orderCommission.save();

  return wallet;
};

// Release pending earnings (cron job helper)
exports.releasePendingEarnings = async () => {
  const now = new Date();

  // Find transactions ready for release
  const pendingTransactions = await WalletTransaction.getPendingRelease(now);

  let releasedCount = 0;
  let releasedAmount = 0;

  for (const tx of pendingTransactions) {
    try {
      const wallet = tx.wallet;

      // Move from pending to available
      await wallet.releasePendingEarnings(tx.amount);

      // Mark as released
      tx.releasedAt = now;
      await tx.save();

      // Create release transaction
      await WalletTransaction.create({
        wallet: wallet._id,
        vendor: tx.vendor,
        type: 'release',
        category: 'sale',
        amount: tx.amount,
        balanceAfter: {
          available: wallet.availableBalance,
          pending: wallet.pendingBalance,
          reserved: wallet.reservedBalance,
        },
        reference: tx.reference,
        description: 'Earnings released after holding period',
      });

      releasedCount++;
      releasedAmount += tx.amount;
    } catch (error) {
      console.error(`Failed to release transaction ${tx._id}:`, error.message);
    }
  }

  return { releasedCount, releasedAmount };
};
