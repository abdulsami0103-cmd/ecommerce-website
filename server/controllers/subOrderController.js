const SubOrder = require('../models/SubOrder');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const VendorWallet = require('../models/VendorWallet');
const OrderCommission = require('../models/OrderCommission');
const Shipment = require('../models/Shipment');
const { getCourierAdapter } = require('../services/couriers');

/**
 * @desc    Get vendor's sub-orders
 * @route   GET /api/vendor/suborders
 * @access  Private (Vendor)
 */
exports.getVendorSubOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { status, page = 1, limit = 20, sort = '-createdAt', search, dateFrom, dateTo } = req.query;

    const query = { vendor: vendor._id };

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { subOrderNumber: searchRegex },
        { 'items.name': searchRegex },
      ];
    }

    let subOrdersQuery = SubOrder.find(query)
      .populate('parentOrder', 'orderNumber')
      .populate('customer', 'email profile.firstName profile.lastName')
      .populate('items.product', 'name images sku')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const subOrders = await subOrdersQuery;

    // If searching by customer name/email, filter after populate
    let filteredSubOrders = subOrders;
    if (search && !query.$or) {
      const searchLower = search.toLowerCase();
      filteredSubOrders = subOrders.filter(order => {
        const customerName = `${order.customer?.profile?.firstName || ''} ${order.customer?.profile?.lastName || ''}`.toLowerCase();
        const customerEmail = (order.customer?.email || '').toLowerCase();
        return customerName.includes(searchLower) || customerEmail.includes(searchLower);
      });
    }

    const total = await SubOrder.countDocuments(query);

    res.json({
      subOrders: filteredSubOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor sub-orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get sub-order details
 * @route   GET /api/vendor/suborders/:id
 * @access  Private (Vendor)
 */
exports.getSubOrderDetails = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const subOrder = await SubOrder.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    })
      .populate('parentOrder', 'orderNumber payment totals')
      .populate('customer', 'email profile phone')
      .populate('items.product', 'name images sku')
      .populate('shipment');

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    res.json(subOrder);
  } catch (error) {
    console.error('Error fetching sub-order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update sub-order status
 * @route   PUT /api/vendor/suborders/:id/status
 * @access  Private (Vendor)
 */
exports.updateSubOrderStatus = async (req, res) => {
  try {
    console.log('=== Update SubOrder Status ===');
    console.log('User ID:', req.user._id);
    console.log('SubOrder ID:', req.params.id);
    console.log('Request body:', req.body);

    const vendor = await Vendor.findOne({ user: req.user._id });
    console.log('Found vendor:', vendor?._id, vendor?.storeName);

    if (!vendor) {
      console.log('ERROR: Vendor not found for user:', req.user._id);
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { status, note } = req.body;

    const subOrder = await SubOrder.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });
    console.log('Found subOrder:', subOrder?._id, subOrder?.subOrderNumber, 'Vendor in SubOrder:', subOrder?.vendor);

    if (!subOrder) {
      console.log('ERROR: SubOrder not found. Checking if exists without vendor filter...');
      const anySubOrder = await SubOrder.findById(req.params.id);
      if (anySubOrder) {
        console.log('SubOrder exists but belongs to different vendor:', anySubOrder.vendor);
      }
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered', 'returned'],
      delivered: ['returned'],
    };

    const allowedStatuses = validTransitions[subOrder.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${subOrder.status} to ${status}`,
        allowedStatuses,
      });
    }

    // Update status
    await subOrder.updateStatus(status, note, req.user._id);

    // Handle delivered status - credit vendor wallet
    if (status === 'delivered') {
      await creditVendorEarnings(subOrder);
    }

    // Update parent order status
    await updateParentOrderStatus(subOrder.parentOrder);

    res.json({
      message: 'Status updated successfully',
      subOrder,
    });
  } catch (error) {
    console.error('Error updating sub-order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get sub-orders for an order (Customer)
 * @route   GET /api/orders/:orderId/suborders
 * @access  Private
 */
exports.getOrderSubOrders = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const subOrders = await SubOrder.find({ parentOrder: order._id })
      .populate('vendor', 'storeName logo')
      .populate('items.product', 'name images')
      .populate('shipment', 'courier status trackingUrl');

    res.json(subOrders);
  } catch (error) {
    console.error('Error fetching order sub-orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get sub-order stats for vendor
 * @route   GET /api/vendor/suborders/stats
 * @access  Private (Vendor)
 */
exports.getSubOrderStats = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const stats = await SubOrder.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' },
        },
      },
    ]);

    const formattedStats = stats.reduce((acc, item) => {
      acc[item._id] = { count: item.count, totalValue: item.totalValue };
      return acc;
    }, {});

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await SubOrder.aggregate([
      {
        $match: {
          vendor: vendor._id,
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]);

    res.json({
      byStatus: formattedStats,
      today: todayStats[0] || { orders: 0, revenue: 0 },
    });
  } catch (error) {
    console.error('Error fetching sub-order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Cancel sub-order (Admin)
 * @route   PUT /api/admin/suborders/:id/cancel
 * @access  Private (Admin)
 */
exports.adminCancelSubOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const subOrder = await SubOrder.findById(req.params.id);

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    if (['delivered', 'cancelled'].includes(subOrder.status)) {
      return res.status(400).json({
        message: `Cannot cancel sub-order with status: ${subOrder.status}`,
      });
    }

    subOrder.status = 'cancelled';
    subOrder.cancellationReason = reason;
    subOrder.cancelledAt = new Date();
    subOrder.cancelledBy = req.user._id;
    subOrder.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
      changedBy: req.user._id,
    });

    await subOrder.save();

    // Update parent order status
    await updateParentOrderStatus(subOrder.parentOrder);

    res.json({
      message: 'Sub-order cancelled successfully',
      subOrder,
    });
  } catch (error) {
    console.error('Error cancelling sub-order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create shipment for sub-order (partial or full)
 * @route   POST /api/vendor/suborders/:id/shipments
 * @access  Private (Vendor)
 */
exports.createSubOrderShipment = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const subOrder = await SubOrder.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    }).populate('parentOrder', 'orderNumber');

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    // Validate sub-order can be shipped
    if (!['confirmed', 'processing', 'shipped'].includes(subOrder.status)) {
      return res.status(400).json({
        message: `Cannot create shipment for order with status: ${subOrder.status}`,
      });
    }

    const { items, courierCode, trackingNumber, weight, dimensions, generateLabel, isCOD, codAmount, specialInstructions } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Validate and update fulfillment quantities
    const shipmentItems = [];
    let totalItemCount = 0;
    for (const shipItem of items) {
      const orderItem = subOrder.items.id(shipItem.itemId);

      if (!orderItem) {
        return res.status(400).json({ message: `Item ${shipItem.itemId} not found in order` });
      }

      const availableQty = orderItem.quantity - (orderItem.fulfilledQuantity || 0);
      if (shipItem.quantity > availableQty) {
        return res.status(400).json({
          message: `Cannot ship ${shipItem.quantity} of ${orderItem.name}. Only ${availableQty} available.`,
        });
      }

      shipmentItems.push({
        product: orderItem.product,
        name: orderItem.name,
        variant: orderItem.variant,
        variantName: orderItem.variantName,
        quantity: shipItem.quantity,
        price: orderItem.price,
      });
      totalItemCount += shipItem.quantity;
    }

    // Get courier name mapping
    const courierNames = {
      manual: 'Manual',
      tcs: 'TCS',
      leopards: 'Leopards',
      postex: 'PostEx',
      blueex: 'BlueEx',
      trax: 'Trax',
    };

    const selectedCourier = courierCode || 'manual';
    const courierName = courierNames[selectedCourier] || 'Manual';

    // Build destination address from subOrder.shippingAddress
    const shippingAddr = subOrder.shippingAddress || {};
    const destination = {
      name: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || 'Customer',
      address: shippingAddr.street || shippingAddr.address || 'N/A',
      city: shippingAddr.city || 'N/A',
      state: shippingAddr.state || '',
      postalCode: shippingAddr.zipCode || shippingAddr.postalCode || '',
      country: shippingAddr.country || 'PK',
      phone: shippingAddr.phone || '0000000000',
      email: subOrder.customer?.email || '',
    };

    // Build origin address from vendor
    const origin = {
      name: vendor.storeName || 'Vendor',
      address: vendor.address?.street || 'Warehouse',
      city: vendor.address?.city || 'Karachi',
      state: vendor.address?.state || '',
      postalCode: vendor.address?.zipCode || '',
      country: vendor.address?.country || 'PK',
      phone: vendor.contactPhone || '0000000000',
      email: vendor.contactEmail || '',
    };

    // Create shipment with proper structure matching the model
    const shipmentData = {
      subOrder: subOrder._id,
      order: subOrder.parentOrder?._id || subOrder.parentOrder,
      vendor: vendor._id,
      courier: {
        name: courierName,
        code: selectedCourier,
        trackingNumber: trackingNumber || `TRK${Date.now()}`,
      },
      origin,
      destination,
      package: {
        weight: parseFloat(weight) || 0.5,
        dimensions: {
          length: parseFloat(dimensions?.length) || 20,
          width: parseFloat(dimensions?.width) || 15,
          height: parseFloat(dimensions?.height) || 10,
        },
        itemCount: totalItemCount,
      },
      status: 'pending',
      isCOD: isCOD || false,
      codAmount: isCOD ? (parseFloat(codAmount) || subOrder.total) : 0,
      specialInstructions: specialInstructions || '',
    };

    const shipment = new Shipment(shipmentData);

    // Generate tracking number and label if courier is selected (not manual)
    if (selectedCourier !== 'manual') {
      try {
        const adapter = getCourierAdapter(selectedCourier);
        if (adapter) {
          const bookingResult = await adapter.createShipment({
            ...shipmentData,
            orderNumber: subOrder.subOrderNumber,
            customerName: destination.name,
            customerPhone: destination.phone,
            customerEmail: destination.email,
          });

          shipment.courier.trackingNumber = bookingResult.trackingNumber;
          shipment.courier.bookingId = bookingResult.bookingId;
          shipment.courier.labelUrl = bookingResult.labelUrl;
          shipment.status = 'label_created';
        }
      } catch (courierError) {
        console.error('Courier booking error:', courierError);
        // Continue with manual shipment if courier fails
        shipment.courier.name = 'Manual';
        shipment.courier.code = 'manual';
        shipment.specialInstructions = `Courier booking failed: ${courierError.message}. ${specialInstructions || ''}`;
      }
    }

    await shipment.save();

    // Update order item fulfillment quantities
    for (const shipItem of items) {
      const orderItem = subOrder.items.id(shipItem.itemId);
      orderItem.fulfilledQuantity += shipItem.quantity;

      // Update item status
      if (orderItem.fulfilledQuantity >= orderItem.quantity) {
        orderItem.itemStatus = 'fulfilled';
      } else if (orderItem.fulfilledQuantity > 0) {
        orderItem.itemStatus = 'partial';
      }
    }

    // Check if all items are fulfilled
    const allFulfilled = subOrder.items.every(item => item.fulfilledQuantity >= item.quantity);
    const anyFulfilled = subOrder.items.some(item => item.fulfilledQuantity > 0);

    // Update sub-order status if needed
    if (allFulfilled && subOrder.status !== 'shipped') {
      subOrder.status = 'shipped';
      subOrder.shippedAt = new Date();
      subOrder.statusHistory.push({
        status: 'shipped',
        timestamp: new Date(),
        note: 'All items shipped',
        changedBy: req.user._id,
      });
    } else if (anyFulfilled && subOrder.status === 'confirmed') {
      subOrder.status = 'processing';
      subOrder.statusHistory.push({
        status: 'processing',
        timestamp: new Date(),
        note: 'Partial shipment created',
        changedBy: req.user._id,
      });
    }

    // Link shipment to sub-order (for backwards compatibility, store the latest)
    subOrder.shipment = shipment._id;
    await subOrder.save();

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
      subOrder,
    });
  } catch (error) {
    console.error('Error creating sub-order shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get shipments for a sub-order
 * @route   GET /api/vendor/suborders/:id/shipments
 * @access  Private (Vendor)
 */
exports.getSubOrderShipments = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const subOrder = await SubOrder.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    const shipments = await Shipment.find({ subOrder: subOrder._id })
      .sort({ createdAt: -1 });

    res.json(shipments);
  } catch (error) {
    console.error('Error fetching sub-order shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get shipping rates for sub-order
 * @route   POST /api/vendor/suborders/:id/rates
 * @access  Private (Vendor)
 */
exports.getSubOrderShippingRates = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const subOrder = await SubOrder.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    const { weight, dimensions } = req.body;

    const CourierConfig = require('../models/CourierConfig');
    const activeCouriers = await CourierConfig.find({ isActive: true, vendor: vendor._id });

    const rates = [];
    for (const courier of activeCouriers) {
      try {
        const adapter = getCourierAdapter(courier.courierCode);
        if (adapter) {
          const rate = await adapter.calculateRate({
            weight: weight || 0.5,
            dimensions: dimensions || { length: 20, width: 15, height: 10 },
            origin: vendor.address,
            destination: subOrder.shippingAddress,
          });

          rates.push({
            courier: courier.courierCode,
            courierName: courier.courierName,
            logo: courier.logo,
            rate: rate.amount,
            estimatedDays: rate.estimatedDays,
            serviceType: rate.serviceType,
          });
        }
      } catch (rateError) {
        console.error(`Rate error for ${courier.courierCode}:`, rateError.message);
      }
    }

    // Add manual option
    rates.push({
      courier: 'manual',
      courierName: 'Manual Shipping',
      logo: null,
      rate: 0,
      estimatedDays: null,
      serviceType: 'Manual entry',
    });

    res.json(rates);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to credit vendor earnings
async function creditVendorEarnings(subOrder) {
  try {
    const wallet = await VendorWallet.findOne({ vendor: subOrder.vendor });

    if (wallet) {
      const vendorEarning = subOrder.vendorEarnings || (subOrder.total - subOrder.commissionAmount);

      await wallet.addPendingEarnings(
        vendorEarning,
        `Earnings from order ${subOrder.subOrderNumber}`,
        { type: 'SubOrder', id: subOrder._id }
      );

      // Update commission status
      await OrderCommission.updateMany(
        { subOrder: subOrder._id },
        { status: 'credited' }
      );
    }
  } catch (error) {
    console.error('Error crediting vendor earnings:', error);
  }
}

// Helper function to update parent order status
async function updateParentOrderStatus(parentOrderId) {
  try {
    const aggregatedStatus = await SubOrder.aggregateParentStatus(parentOrderId);

    await Order.findByIdAndUpdate(parentOrderId, {
      status: aggregatedStatus,
    });
  } catch (error) {
    console.error('Error updating parent order status:', error);
  }
}
