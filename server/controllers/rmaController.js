const RMARequest = require('../models/RMARequest');
const RMAMessage = require('../models/RMAMessage');
const RMAStatusLog = require('../models/RMAStatusLog');
const SubOrder = require('../models/SubOrder');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
const OrderCommission = require('../models/OrderCommission');

/**
 * @desc    Create RMA request (Customer)
 * @route   POST /api/rma
 * @access  Private
 */
exports.createRMARequest = async (req, res) => {
  try {
    const { orderId, subOrderId, type, items } = req.body;

    // Validate order belongs to customer
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get sub-order if specified
    let subOrder = null;
    if (subOrderId) {
      subOrder = await SubOrder.findOne({
        _id: subOrderId,
        parentOrder: orderId,
      });

      if (!subOrder) {
        return res.status(404).json({ message: 'Sub-order not found' });
      }

      // Check if sub-order is delivered
      if (subOrder.status !== 'delivered') {
        return res.status(400).json({
          message: 'RMA can only be requested for delivered orders',
        });
      }
    }

    // Calculate total item value
    const totalItemValue = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Determine vendor
    const vendorId = subOrder?.vendor || order.items[0]?.vendor;

    const rma = await RMARequest.create({
      order: orderId,
      subOrder: subOrderId,
      customer: req.user._id,
      vendor: vendorId,
      type,
      items: items.map((item) => ({
        ...item,
        productName: item.productName || item.name,
      })),
      totalItemValue,
      refundableAmount: totalItemValue,
      vendorResponseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    });

    // Create initial status log
    await RMAStatusLog.create({
      rmaRequest: rma._id,
      fromStatus: 'none',
      toStatus: 'requested',
      changedBy: req.user._id,
      changedByType: 'customer',
      reason: 'RMA request created',
    });

    // Create system message
    await RMAMessage.createSystemMessage(
      rma._id,
      `RMA request created for ${type}. Vendor has 48 hours to respond.`
    );

    res.status(201).json({
      message: 'RMA request created successfully',
      rma,
    });
  } catch (error) {
    console.error('Error creating RMA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get customer's RMA requests
 * @route   GET /api/rma
 * @access  Private
 */
exports.getCustomerRMAs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const rmas = await RMARequest.find(query)
      .populate('order', 'orderNumber')
      .populate('subOrder', 'subOrderNumber')
      .populate('vendor', 'storeName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RMARequest.countDocuments(query);

    res.json({
      rmas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching RMAs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get RMA details
 * @route   GET /api/rma/:id
 * @access  Private
 */
exports.getRMADetails = async (req, res) => {
  try {
    const rma = await RMARequest.findById(req.params.id)
      .populate('order', 'orderNumber totals payment')
      .populate('subOrder', 'subOrderNumber status')
      .populate('vendor', 'storeName email phone')
      .populate('customer', 'email profile')
      .populate('resolution.resolvedBy', 'email profile');

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found' });
    }

    // Check authorization
    const vendor = await Vendor.findOne({ user: req.user._id });
    const isCustomer = rma.customer._id.toString() === req.user._id.toString();
    const isVendor = vendor && rma.vendor._id.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get messages
    const messages = await RMAMessage.getConversation(rma._id, isAdmin);

    // Get status history
    const statusHistory = await RMAStatusLog.getHistory(rma._id);

    res.json({
      rma,
      messages,
      statusHistory,
    });
  } catch (error) {
    console.error('Error fetching RMA details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add message to RMA
 * @route   POST /api/rma/:id/messages
 * @access  Private
 */
exports.addMessage = async (req, res) => {
  try {
    const { message, attachments, isInternal } = req.body;

    const rma = await RMARequest.findById(req.params.id);

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found' });
    }

    // Determine sender type
    let senderType = 'customer';
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (req.user.role === 'admin') {
      senderType = 'admin';
    } else if (vendor && rma.vendor.toString() === vendor._id.toString()) {
      senderType = 'vendor';
    }

    const rmaMessage = await RMAMessage.create({
      rmaRequest: rma._id,
      sender: {
        type: senderType,
        user: req.user._id,
        name: `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim() || req.user.email,
      },
      message,
      attachments: attachments || [],
      isInternal: isInternal && senderType === 'admin',
    });

    res.status(201).json(rmaMessage);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark return as shipped (Customer)
 * @route   PUT /api/rma/:id/return-shipped
 * @access  Private
 */
exports.markReturnShipped = async (req, res) => {
  try {
    const { trackingNumber, courier } = req.body;

    const rma = await RMARequest.findOne({
      _id: req.params.id,
      customer: req.user._id,
      status: 'approved',
    });

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found or not approved' });
    }

    rma.returnShipment = {
      trackingNumber,
      courier,
      shippedAt: new Date(),
    };

    await rma.updateStatus('return_shipped', 'Return item shipped', req.user._id);

    res.json({ message: 'Return marked as shipped', rma });
  } catch (error) {
    console.error('Error marking return shipped:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get vendor's RMA requests
 * @route   GET /api/vendor/rma
 * @access  Private (Vendor)
 */
exports.getVendorRMAs = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (status) {
      query.status = status;
    }

    const rmas = await RMARequest.find(query)
      .populate('order', 'orderNumber')
      .populate('subOrder', 'subOrderNumber')
      .populate('customer', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RMARequest.countDocuments(query);

    // Get stats
    const stats = await RMARequest.getVendorStats(vendor._id);

    res.json({
      rmas,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor RMAs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Vendor respond to RMA (approve/reject)
 * @route   PUT /api/vendor/rma/:id/respond
 * @access  Private (Vendor)
 */
exports.vendorRespond = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { accepted, note, resolutionType, refundAmount, restockingFee } = req.body;

    const rma = await RMARequest.findOne({
      _id: req.params.id,
      vendor: vendor._id,
      status: { $in: ['requested', 'vendor_review'] },
    });

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found or already processed' });
    }

    rma.vendorResponse = {
      accepted,
      note,
      respondedAt: new Date(),
    };

    if (accepted) {
      rma.resolution = {
        type: resolutionType || (rma.type === 'return' ? 'full_refund' : rma.type),
        amount: refundAmount || rma.totalItemValue - (restockingFee || 0),
        note,
      };
      rma.restockingFee = restockingFee || 0;
      rma.refundableAmount = rma.totalItemValue - (restockingFee || 0);

      await rma.updateStatus('approved', note, req.user._id);

      await RMAMessage.createSystemMessage(
        rma._id,
        `Vendor approved the ${rma.type} request. ${rma.type === 'return' ? 'Please ship the item back.' : 'Refund will be processed.'}`
      );

      // If refund only (no return needed), process refund
      if (rma.type === 'refund_only') {
        await processRefund(rma, req.user._id);
      }
    } else {
      await rma.updateStatus('rejected', note, req.user._id);

      await RMAMessage.createSystemMessage(
        rma._id,
        `Vendor rejected the request. Reason: ${note || 'No reason provided'}. You can escalate to admin if you disagree.`
      );
    }

    res.json({ message: accepted ? 'RMA approved' : 'RMA rejected', rma });
  } catch (error) {
    console.error('Error responding to RMA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark return as received (Vendor)
 * @route   PUT /api/vendor/rma/:id/received
 * @access  Private (Vendor)
 */
exports.markReturnReceived = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { condition, conditionNote, images, processRefund: shouldProcessRefund } = req.body;

    const rma = await RMARequest.findOne({
      _id: req.params.id,
      vendor: vendor._id,
      status: 'return_shipped',
    });

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found or wrong status' });
    }

    rma.returnShipment.receivedAt = new Date();
    rma.returnShipment.condition = condition;
    rma.returnShipment.conditionNote = conditionNote;
    rma.returnShipment.images = images || [];

    await rma.updateStatus('return_received', 'Return item received', req.user._id);

    // Process refund if requested
    if (shouldProcessRefund) {
      await processRefund(rma, req.user._id);
    } else {
      await rma.updateStatus('inspection', 'Item under inspection', req.user._id);
    }

    res.json({ message: 'Return marked as received', rma });
  } catch (error) {
    console.error('Error marking return received:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all RMA requests (Admin)
 * @route   GET /api/admin/rma
 * @access  Private (Admin)
 */
exports.adminGetAllRMAs = async (req, res) => {
  try {
    const { status, isEscalated, vendor, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isEscalated === 'true') query.isEscalated = true;
    if (vendor) query.vendor = vendor;

    const rmas = await RMARequest.find(query)
      .populate('order', 'orderNumber')
      .populate('vendor', 'storeName')
      .populate('customer', 'email profile.firstName profile.lastName')
      .sort({ isEscalated: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RMARequest.countDocuments(query);

    // Get escalated count
    const escalatedCount = await RMARequest.countDocuments({ isEscalated: true, status: 'escalated' });

    res.json({
      rmas,
      escalatedCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin RMAs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Escalate RMA to admin (Customer)
 * @route   PUT /api/rma/:id/escalate
 * @access  Private
 */
exports.escalateRMA = async (req, res) => {
  try {
    const { reason } = req.body;

    const rma = await RMARequest.findOne({
      _id: req.params.id,
      customer: req.user._id,
      status: 'rejected',
    });

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found or cannot be escalated' });
    }

    await rma.updateStatus('escalated', reason, req.user._id);
    rma.escalatedReason = reason;
    await rma.save();

    await RMAMessage.createSystemMessage(
      rma._id,
      `Customer escalated this RMA to admin. Reason: ${reason}`
    );

    res.json({ message: 'RMA escalated to admin', rma });
  } catch (error) {
    console.error('Error escalating RMA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Admin resolve RMA
 * @route   PUT /api/admin/rma/:id/resolve
 * @access  Private (Admin)
 */
exports.adminResolve = async (req, res) => {
  try {
    const { resolutionType, refundAmount, note } = req.body;

    const rma = await RMARequest.findById(req.params.id);

    if (!rma) {
      return res.status(404).json({ message: 'RMA not found' });
    }

    rma.resolution = {
      type: resolutionType,
      amount: refundAmount || 0,
      note,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    };
    rma.adminNote = note;

    if (['full_refund', 'partial_refund'].includes(resolutionType)) {
      await processRefund(rma, req.user._id);
    } else {
      await rma.updateStatus('resolved', note, req.user._id);
    }

    await RMAMessage.createSystemMessage(
      rma._id,
      `Admin resolved this RMA: ${resolutionType}. ${note || ''}`
    );

    res.json({ message: 'RMA resolved', rma });
  } catch (error) {
    console.error('Error resolving RMA:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to process refund
async function processRefund(rma, processedBy) {
  try {
    const refundAmount = rma.resolution?.amount || rma.refundableAmount || rma.totalItemValue;

    // Update RMA status
    await rma.updateStatus('refund_processing', 'Processing refund', processedBy);

    // Reverse vendor commission
    const wallet = await VendorWallet.findOne({ vendor: rma.vendor });
    if (wallet) {
      await wallet.processRefund(
        refundAmount,
        `Refund for RMA ${rma.rmaNumber}`,
        { type: 'RMARequest', id: rma._id }
      );
    }

    // Update commission records
    await OrderCommission.updateMany(
      { order: rma.order, vendor: rma.vendor },
      { status: 'refunded' }
    );

    // Record refund
    rma.refund = {
      amount: refundAmount,
      method: 'wallet_credit', // or original_payment
      processedAt: new Date(),
      processedBy,
    };

    await rma.updateStatus('resolved', 'Refund processed', processedBy);

    return rma;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}
