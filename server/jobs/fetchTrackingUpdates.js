const cron = require('node-cron');
const Shipment = require('../models/Shipment');
const ShipmentTrackingEvent = require('../models/ShipmentTrackingEvent');
const SubOrder = require('../models/SubOrder');
const { getCourierAdapter } = require('../services/couriers');

/**
 * Fetch tracking updates from courier APIs
 * Runs every hour
 */

const fetchTrackingUpdates = async () => {
  console.log('[Job] Starting tracking updates fetch...');

  try {
    // Get shipments that need tracking updates
    const shipments = await Shipment.getShipmentsForTrackingUpdate();

    console.log(`[Job] Found ${shipments.length} shipments to update`);

    let updated = 0;
    let errors = 0;

    for (const shipment of shipments) {
      try {
        const adapter = await getCourierAdapter(shipment.courier.code);
        const trackingResult = await adapter.getTracking(shipment.courier.trackingNumber);

        if (trackingResult.success) {
          // Update shipment status if changed
          if (trackingResult.currentStatus !== shipment.status) {
            const oldStatus = shipment.status;
            shipment.status = trackingResult.currentStatus;

            // Update timestamps
            if (trackingResult.currentStatus === 'delivered') {
              shipment.actualDelivery = trackingResult.deliveredAt || new Date();

              // Update sub-order status
              await SubOrder.findByIdAndUpdate(shipment.subOrder, {
                status: 'delivered',
                deliveredAt: shipment.actualDelivery,
                $push: {
                  statusHistory: {
                    status: 'delivered',
                    timestamp: new Date(),
                    note: 'Auto-updated from courier tracking',
                  },
                },
              });
            }

            console.log(
              `[Job] Shipment ${shipment.courier.trackingNumber}: ${oldStatus} -> ${trackingResult.currentStatus}`
            );
          }

          // Add new tracking events
          const existingEvents = await ShipmentTrackingEvent.find({
            shipment: shipment._id,
          }).distinct('timestamp');

          const existingTimestamps = new Set(
            existingEvents.map((t) => new Date(t).getTime())
          );

          const newEvents = trackingResult.events.filter(
            (e) => !existingTimestamps.has(new Date(e.timestamp).getTime())
          );

          if (newEvents.length > 0) {
            await ShipmentTrackingEvent.createFromCourierResponse(
              shipment._id,
              newEvents,
              shipment.courier.code
            );
          }

          shipment.lastTrackingUpdate = new Date();
          await shipment.save();
          updated++;
        }
      } catch (err) {
        console.error(
          `[Job] Error updating shipment ${shipment.courier.trackingNumber}:`,
          err.message
        );
        errors++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[Job] Tracking updates complete. Updated: ${updated}, Errors: ${errors}`);
  } catch (error) {
    console.error('[Job] Tracking updates job failed:', error);
  }
};

// Schedule: Run every hour
const scheduleTrackingUpdates = () => {
  cron.schedule('0 * * * *', fetchTrackingUpdates);
  console.log('[Cron] Tracking updates job scheduled (hourly)');
};

module.exports = {
  fetchTrackingUpdates,
  scheduleTrackingUpdates,
};
