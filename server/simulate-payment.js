const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Order = require('./models/Order');
  const SubOrder = require('./models/SubOrder');
  const Vendor = require('./models/Vendor');

  // Get a pending order
  const order = await Order.findOne({ 'payment.status': 'pending' });

  if (!order) {
    console.log('No pending orders found');
    mongoose.disconnect();
    return;
  }

  console.log('Simulating payment for Order:', order.orderNumber);
  console.log('Total: Rs.', order.totals.total.toLocaleString());

  // Update order payment status to 'paid'
  order.payment.status = 'paid';
  order.payment.method = 'stripe';
  order.payment.transactionId = 'test_pi_' + Date.now();
  order.payment.paidAt = new Date();
  order.status = 'processing';
  await order.save();

  console.log('\nOrder payment status updated to: PAID');

  // Update sub-orders status
  const subOrders = await SubOrder.find({ parentOrder: order._id });
  console.log('\nUpdating', subOrders.length, 'sub-orders...\n');

  for (const subOrder of subOrders) {
    subOrder.status = 'confirmed';
    subOrder.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment received - Order confirmed',
    });
    await subOrder.save();

    // Update vendor earnings
    const vendor = await Vendor.findById(subOrder.vendor);
    if (vendor) {
      const commissionRate = vendor.commissionRate || 10;
      const commissionAmount = (subOrder.total * commissionRate) / 100;
      const vendorEarnings = subOrder.total - commissionAmount;

      vendor.payoutBalance = (vendor.payoutBalance || 0) + vendorEarnings;
      vendor.totalEarnings = (vendor.totalEarnings || 0) + vendorEarnings;
      await vendor.save();

      console.log('Vendor:', vendor.storeName);
      console.log('  - SubOrder Total: Rs.', subOrder.total.toLocaleString());
      console.log('  - Commission (' + commissionRate + '%): Rs.', commissionAmount.toLocaleString());
      console.log('  - Vendor Earnings: Rs.', vendorEarnings.toLocaleString());
      console.log('  - New Payout Balance: Rs.', vendor.payoutBalance.toLocaleString());
      console.log('');
    }
  }

  console.log('========================================');
  console.log('PAYMENT SIMULATION COMPLETE!');
  console.log('========================================');
  console.log('Order Number:', order.orderNumber);
  console.log('Payment Method: Stripe (Card)');
  console.log('Payment Status: PAID');
  console.log('Transaction ID:', order.payment.transactionId);
  console.log('Order Status:', order.status);
  console.log('========================================');

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  mongoose.disconnect();
});
