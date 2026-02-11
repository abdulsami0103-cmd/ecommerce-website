const cron = require('node-cron');
const Shipment = require('../models/Shipment');
const SubOrder = require('../models/SubOrder');

/**
 * Send delivery status notifications
 * Runs every 30 minutes
 */

const notifyDeliveryStatus = async () => {
  console.log('[Job] Checking for delivery notifications...');

  try {
    // Find shipments with status changes that need notifications
    const recentlyUpdatedShipments = await Shipment.find({
      lastTrackingUpdate: {
        $gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      },
      status: { $in: ['out_for_delivery', 'delivered', 'attempted_delivery'] },
    })
      .populate('subOrder')
      .populate('vendor', 'storeName');

    console.log(`[Job] Found ${recentlyUpdatedShipments.length} shipments for notification`);

    for (const shipment of recentlyUpdatedShipments) {
      try {
        // Get customer from sub-order
        const subOrder = await SubOrder.findById(shipment.subOrder)
          .populate('customer', 'email profile phone');

        if (!subOrder || !subOrder.customer) continue;

        const customer = subOrder.customer;
        const customerName = customer.profile?.firstName || 'Customer';

        // Prepare notification based on status
        let notificationMessage = '';
        let notificationType = '';

        switch (shipment.status) {
          case 'out_for_delivery':
            notificationType = 'out_for_delivery';
            notificationMessage = `Hi ${customerName}, your order ${subOrder.subOrderNumber} is out for delivery today!`;
            break;

          case 'delivered':
            notificationType = 'delivered';
            notificationMessage = `Hi ${customerName}, your order ${subOrder.subOrderNumber} has been delivered. We hope you enjoy your purchase!`;
            break;

          case 'attempted_delivery':
            notificationType = 'delivery_attempted';
            notificationMessage = `Hi ${customerName}, delivery was attempted for your order ${subOrder.subOrderNumber}. The courier will try again soon.`;
            break;
        }

        if (notificationMessage) {
          // TODO: Implement actual notification sending
          // await sendEmail(customer.email, 'Order Update', notificationMessage);
          // await sendSMS(customer.phone, notificationMessage);

          console.log(`[Job] Would notify ${customer.email}: ${notificationType}`);
        }
      } catch (err) {
        console.error(`[Job] Error sending notification for shipment:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Job] Delivery notification job failed:', error);
  }
};

// Schedule: Run every 30 minutes
const scheduleDeliveryNotifications = () => {
  cron.schedule('*/30 * * * *', notifyDeliveryStatus);
  console.log('[Cron] Delivery notification job scheduled (every 30 minutes)');
};

module.exports = {
  notifyDeliveryStatus,
  scheduleDeliveryNotifications,
};
