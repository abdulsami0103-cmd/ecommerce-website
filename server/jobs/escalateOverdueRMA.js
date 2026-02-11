const cron = require('node-cron');
const RMARequest = require('../models/RMARequest');
const RMAMessage = require('../models/RMAMessage');
const RMAStatusLog = require('../models/RMAStatusLog');

/**
 * Auto-escalate RMA requests where vendor hasn't responded within 48 hours
 * Runs every 2 hours
 */

const escalateOverdueRMA = async () => {
  console.log('[Job] Checking for overdue RMA requests...');

  try {
    // Find RMAs past their vendor response deadline
    const overdueRMAs = await RMARequest.getOverdueForEscalation();

    console.log(`[Job] Found ${overdueRMAs.length} overdue RMA requests`);

    let escalated = 0;

    for (const rma of overdueRMAs) {
      try {
        // Update status to escalated
        rma.status = 'escalated';
        rma.isEscalated = true;
        rma.escalatedAt = new Date();
        rma.escalatedReason = 'Vendor did not respond within 48 hours';

        await rma.save();

        // Create status log
        await RMAStatusLog.create({
          rmaRequest: rma._id,
          fromStatus: rma.status,
          toStatus: 'escalated',
          changedByType: 'system',
          reason: 'Auto-escalated: Vendor response deadline exceeded',
        });

        // Create system message
        await RMAMessage.createSystemMessage(
          rma._id,
          `This RMA request has been automatically escalated to admin because the vendor (${rma.vendor?.storeName || 'Unknown'}) did not respond within 48 hours.`
        );

        escalated++;

        // TODO: Send notification to admin
        // await sendAdminNotification(rma);

        // TODO: Send notification to customer
        // await sendCustomerNotification(rma, 'Your RMA request has been escalated to our support team.');
      } catch (err) {
        console.error(`[Job] Error escalating RMA ${rma.rmaNumber}:`, err.message);
      }
    }

    console.log(`[Job] Escalated ${escalated} RMA requests`);
  } catch (error) {
    console.error('[Job] RMA escalation job failed:', error);
  }
};

// Schedule: Run every 2 hours
const scheduleRMAEscalation = () => {
  cron.schedule('0 */2 * * *', escalateOverdueRMA);
  console.log('[Cron] RMA escalation job scheduled (every 2 hours)');
};

module.exports = {
  escalateOverdueRMA,
  scheduleRMAEscalation,
};
