const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Payout = require('../models/Payout');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
const STRIPE_MINIMUM_AMOUNTS = {
  usd: 0.50, eur: 0.50, gbp: 0.30, pkr: 150, inr: 50, aed: 2,
};

const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check minimum amount for Stripe
    const currency = order.totals.currency.toLowerCase();
    const minAmount = STRIPE_MINIMUM_AMOUNTS[currency] || 0.50;
    if (order.totals.total < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for card payment is ${order.totals.currency} ${minAmount}. Please use Cash on Delivery for smaller orders.`,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totals.total * 100), // Convert to cents
      currency,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment (webhook or manual)
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }

    // Update order
    order.payment.status = 'paid';
    order.payment.transactionId = paymentIntentId;
    order.payment.paidAt = new Date();
    order.status = 'processing';

    // Update vendor balances
    const vendorPayments = {};
    order.items.forEach((item) => {
      const vendorId = item.vendor.toString();
      if (!vendorPayments[vendorId]) {
        vendorPayments[vendorId] = 0;
      }
      vendorPayments[vendorId] += item.price * item.quantity;
    });

    for (const [vendorId, amount] of Object.entries(vendorPayments)) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const commission = (amount * vendor.commissionRate) / 100;
        const vendorAmount = amount - commission;
        vendor.payoutBalance += vendorAmount;
        vendor.totalEarnings += vendorAmount;
        await vendor.save();
      }
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

// @desc    Create Stripe Connect account for vendor
// @route   POST /api/vendors/stripe-connect
// @access  Private (Vendor)
const createStripeAccount = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    if (vendor.stripeAccountId) {
      // Return existing account link
      const accountLink = await stripe.accountLinks.create({
        account: vendor.stripeAccountId,
        refresh_url: `${process.env.CLIENT_URL}/vendor/settings`,
        return_url: `${process.env.CLIENT_URL}/vendor/settings?stripe=success`,
        type: 'account_onboarding',
      });

      return res.status(200).json({
        success: true,
        url: accountLink.url,
      });
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: vendor.contactEmail,
      metadata: {
        vendorId: vendor._id.toString(),
      },
    });

    vendor.stripeAccountId = account.id;
    await vendor.save();

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/vendor/settings`,
      return_url: `${process.env.CLIENT_URL}/vendor/settings?stripe=success`,
      type: 'account_onboarding',
    });

    res.status(200).json({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request instant payout
// @route   POST /api/vendors/payout
// @access  Private (Vendor)
const requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    if (!vendor.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Please connect your Stripe account first',
      });
    }

    if (amount > vendor.payoutBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payout amount is $1',
      });
    }

    // Create payout record
    const payout = await Payout.create({
      vendor: vendor._id,
      amount,
      status: 'processing',
    });

    try {
      // Transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: vendor.stripeAccountId,
        metadata: {
          payoutId: payout._id.toString(),
          vendorId: vendor._id.toString(),
        },
      });

      payout.stripeTransferId = transfer.id;
      payout.status = 'completed';
      payout.processedAt = new Date();
      await payout.save();

      // Update vendor balance
      vendor.payoutBalance -= amount;
      await vendor.save();

      res.status(200).json({
        success: true,
        data: payout,
      });
    } catch (stripeError) {
      payout.status = 'failed';
      payout.failureReason = stripeError.message;
      await payout.save();

      return res.status(400).json({
        success: false,
        message: 'Payout failed: ' + stripeError.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payout history
// @route   GET /api/vendors/payouts
// @access  Private (Vendor)
const getPayoutHistory = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const payouts = await Payout.find({ vendor: vendor._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payout.countDocuments({ vendor: vendor._id });

    res.status(200).json({
      success: true,
      data: payouts,
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

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update order payment status
      if (paymentIntent.metadata.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          'payment.status': 'paid',
          'payment.transactionId': paymentIntent.id,
          'payment.paidAt': new Date(),
          status: 'processing',
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      if (failedPayment.metadata.orderId) {
        await Order.findByIdAndUpdate(failedPayment.metadata.orderId, {
          'payment.status': 'failed',
        });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createStripeAccount,
  requestPayout,
  getPayoutHistory,
  stripeWebhook,
};
