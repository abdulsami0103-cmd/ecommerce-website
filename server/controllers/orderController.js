const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const OrderCommission = require('../models/OrderCommission');
const CommissionRule = require('../models/CommissionRule');
const TaxRate = require('../models/TaxRate');
const TaxZone = require('../models/TaxZone');

// @desc    Create order with multi-vendor support (order splitting)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    console.log('=== Order Creation Request ===');
    console.log('User ID:', req.user?.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const itemsByVendor = {};

    for (const item of items) {
      const product = await Product.findById(item.product).populate('vendor').populate('category');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product is not available: ${product.name}`,
        });
      }

      // Check if vendor exists
      if (!product.vendor || !product.vendor._id) {
        return res.status(400).json({
          success: false,
          message: `Product vendor not found: ${product.name}`,
        });
      }

      // Check inventory for physical products
      if (product.type === 'physical' && product.inventory.trackInventory) {
        if (product.inventory.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient inventory for: ${product.name}`,
          });
        }
      }

      const itemPrice = product.price.amount;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      const orderItem = {
        product: product._id,
        vendor: product.vendor._id,
        name: product.name,
        image: product.images?.[0] || '',
        price: itemPrice,
        quantity: item.quantity,
        variant: item.variant,
        category: product.category?._id,
      };

      orderItems.push(orderItem);

      // Group by vendor for sub-orders
      const vendorId = product.vendor._id.toString();
      if (!itemsByVendor[vendorId]) {
        itemsByVendor[vendorId] = {
          vendor: product.vendor,
          items: [],
          subtotal: 0,
        };
      }
      itemsByVendor[vendorId].items.push({
        ...orderItem,
        total: itemTotal,
        productData: product,
      });
      itemsByVendor[vendorId].subtotal += itemTotal;
    }

    // Determine if multi-vendor order
    const vendorIds = Object.keys(itemsByVendor);
    const isMultiVendor = vendorIds.length > 1;

    // Calculate tax based on shipping address
    let totalTax = 0;
    try {
      const taxZone = await TaxZone.findOne({
        countryCode: shippingAddress.country || 'PK',
        isActive: true,
      }).sort({ priority: -1 });

      if (taxZone) {
        const taxRates = await TaxRate.find({
          zone: taxZone._id,
          isActive: true,
          appliesTo: { $in: ['all', 'products_only'] },
        });

        if (taxRates.length > 0) {
          const taxRate = taxRates[0].rate / 100;
          totalTax = Math.round(subtotal * taxRate);
        }
      }
    } catch (err) {
      console.log('Tax calculation skipped:', err.message);
    }

    // Calculate totals
    const shipping = 0; // Calculate based on shipping method
    const discount = 0; // Calculate based on coupon
    const total = subtotal + shipping + totalTax - discount;

    // Create parent order
    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
      },
      totals: {
        subtotal,
        shipping,
        tax: totalTax,
        discount,
        total,
        currency: 'PKR',
      },
      couponCode,
      notes,
      orderType: isMultiVendor ? 'multi_vendor' : 'single_vendor',
      vendorCount: vendorIds.length,
    });

    // Create sub-orders for each vendor
    const subOrderIds = [];

    for (const vendorId of vendorIds) {
      const vendorData = itemsByVendor[vendorId];

      // Calculate vendor's shipping and tax portion
      const vendorShipping = Math.round(shipping / vendorIds.length);
      const vendorTax = Math.round((vendorData.subtotal / subtotal) * totalTax);
      const vendorTotal = vendorData.subtotal + vendorShipping + vendorTax;

      // Create sub-order
      const subOrder = await SubOrder.create({
        parentOrder: order._id,
        vendor: vendorId,
        customer: req.user.id,
        items: vendorData.items.map((item) => ({
          product: item.product,
          name: item.name,
          image: item.image,
          variant: item.variant,
          variantName: item.variant,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: vendorData.subtotal,
        shippingCost: vendorShipping,
        tax: vendorTax,
        total: vendorTotal,
        currency: 'PKR',
        shippingAddress,
        status: 'pending',
        statusHistory: [{ status: 'pending', timestamp: new Date() }],
      });

      subOrderIds.push(subOrder._id);

      // Calculate and create commission records for each item
      for (const item of vendorData.items) {
        try {
          const commissionRate = await calculateCommissionRate(
            vendorId,
            item.category,
            item.product
          );

          const commissionAmount = Math.round(item.total * (commissionRate / 100));
          const vendorEarning = item.total - commissionAmount;

          await OrderCommission.create({
            order: order._id,
            subOrder: subOrder._id,
            orderItem: item.product,
            vendor: vendorId,
            product: item.product,
            saleAmount: item.total,
            quantity: item.quantity,
            unitPrice: item.price,
            commissionType: 'percentage',
            commissionRate,
            commissionAmount,
            vendorEarning,
            status: 'pending',
          });

          // Update sub-order with commission info
          subOrder.commissionAmount = (subOrder.commissionAmount || 0) + commissionAmount;
          subOrder.vendorEarnings = (subOrder.vendorEarnings || 0) + vendorEarning;
        } catch (err) {
          console.log('Commission calculation skipped:', err.message);
        }
      }

      await subOrder.save();
    }

    // Update parent order with sub-order references
    order.subOrders = subOrderIds;
    await order.save();

    // Update product inventory
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product && product.type === 'physical' && product.inventory?.trackInventory) {
        product.inventory.quantity -= item.quantity;
        product.salesCount = (product.salesCount || 0) + item.quantity;
        await product.save();
      }
    }

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('subOrders')
      .populate('items.vendor', 'storeName');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: isMultiVendor
        ? `Order split into ${vendorIds.length} sub-orders for different vendors`
        : 'Order created successfully',
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

// Helper function to calculate commission rate
async function calculateCommissionRate(vendorId, categoryId, productId) {
  try {
    // 1. Check product-specific rule
    let rule = await CommissionRule.findOne({
      scope: 'product',
      scopeRef: productId,
      isActive: true,
    });

    // 2. Check category rule
    if (!rule && categoryId) {
      rule = await CommissionRule.findOne({
        scope: 'category',
        scopeRef: categoryId,
        isActive: true,
      });
    }

    // 3. Check vendor-specific rule
    if (!rule) {
      rule = await CommissionRule.findOne({
        scope: 'vendor',
        scopeRef: vendorId,
        isActive: true,
      });
    }

    // 4. Platform default
    if (!rule) {
      rule = await CommissionRule.findOne({
        scope: 'platform',
        isActive: true,
      }).sort({ priority: 1 });
    }

    if (rule && rule.type === 'percentage') {
      return rule.value;
    }

    // Default 10% if no rule found
    return 10;
  } catch (error) {
    return 10; // Default commission
  }
}

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ customer: req.user.id });

    res.status(200).json({
      success: true,
      data: orders,
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'email profile')
      .populate('items.product', 'images slug')
      .populate('items.vendor', 'storeName storeSlug')
      .populate({
        path: 'subOrders',
        populate: [
          { path: 'vendor', select: 'storeName storeSlug logo' },
          { path: 'shipment', select: 'courier status estimatedDelivery' },
        ],
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user has access to this order
    const vendor = await Vendor.findOne({ user: req.user.id });
    const isCustomer = order.customer._id.toString() === req.user.id;
    const isVendor = vendor && order.items.some((item) => item.vendor._id.toString() === vendor._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's orders
// @route   GET /api/vendors/orders
// @access  Private (Vendor)
const getVendorOrders = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ 'items.vendor': vendor._id })
      .populate('customer', 'email profile')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Filter items to only show vendor's items
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.vendor.toString() === vendor._id.toString()
      );
      return orderObj;
    });

    const total = await Order.countDocuments({ 'items.vendor': vendor._id });

    res.status(200).json({
      success: true,
      data: filteredOrders,
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

// @desc    Update order item status
// @route   PUT /api/orders/:orderId/items/:itemId/status
// @access  Private (Vendor)
const updateItemStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const item = order.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found',
      });
    }

    // Check if vendor owns this item
    if (item.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item',
      });
    }

    item.status = status;
    if (trackingNumber) item.trackingNumber = trackingNumber;
    if (status === 'shipped') item.shippedAt = new Date();
    if (status === 'delivered') item.deliveredAt = new Date();

    // Update overall order status
    const allDelivered = order.items.every((i) => i.status === 'delivered');
    const allCancelled = order.items.every((i) => i.status === 'cancelled');
    const anyShipped = order.items.some((i) => i.status === 'shipped');

    if (allDelivered) {
      order.status = 'completed';
    } else if (allCancelled) {
      order.status = 'cancelled';
    } else if (anyShipped) {
      order.status = 'processing';
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, transactionId, paidAt } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify the order belongs to the user
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    // Update payment info
    order.payment.status = status || order.payment.status;
    if (transactionId) order.payment.transactionId = transactionId;
    if (paidAt) order.payment.paidAt = new Date(paidAt);

    // If payment is successful, update order status
    if (status === 'paid') {
      order.status = 'processing';
    }

    await order.save();

    // Also update related sub-orders
    if (order.subOrders && order.subOrders.length > 0) {
      await SubOrder.updateMany(
        { _id: { $in: order.subOrders } },
        {
          'payment.status': status,
          'payment.transactionId': transactionId,
          'payment.paidAt': paidAt ? new Date(paidAt) : undefined
        }
      );
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getVendorOrders,
  updateItemStatus,
  updatePaymentStatus,
};
