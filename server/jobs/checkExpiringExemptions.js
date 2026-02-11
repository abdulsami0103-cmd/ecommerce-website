/**
 * Check Expiring Tax Exemptions Job
 *
 * Runs daily to check for tax exemptions that are about to expire
 * or have already expired, and updates their status accordingly.
 *
 * Schedule: Daily at 01:00 AM
 */

const TaxExemption = require('../models/TaxExemption');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// Days before expiry to send warning
const WARNING_DAYS = 30;
const FINAL_WARNING_DAYS = 7;

/**
 * Check and update expiring exemptions
 */
const checkExpiringExemptions = async () => {
  console.log('[CheckExpiringExemptions] Starting check...');

  try {
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + WARNING_DAYS);
    const finalWarningDate = new Date(now);
    finalWarningDate.setDate(finalWarningDate.getDate() + FINAL_WARNING_DAYS);

    // 1. Mark expired exemptions
    const expiredResult = await TaxExemption.updateMany(
      {
        status: 'verified',
        validUntil: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );

    console.log(`[CheckExpiringExemptions] Marked ${expiredResult.modifiedCount} exemptions as expired`);

    // 2. Find exemptions expiring within warning period
    const expiringExemptions = await TaxExemption.find({
      status: 'verified',
      validUntil: { $gte: now, $lte: warningDate },
    }).populate('entityRef');

    console.log(`[CheckExpiringExemptions] Found ${expiringExemptions.length} exemptions expiring within ${WARNING_DAYS} days`);

    // Group by urgency
    const expiringWithinWeek = [];
    const expiringWithinMonth = [];

    for (const exemption of expiringExemptions) {
      const daysUntilExpiry = Math.ceil((exemption.validUntil - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= FINAL_WARNING_DAYS) {
        expiringWithinWeek.push({
          exemption,
          daysUntilExpiry,
        });
      } else {
        expiringWithinMonth.push({
          exemption,
          daysUntilExpiry,
        });
      }
    }

    // Log notifications (in production, send emails)
    for (const { exemption, daysUntilExpiry } of expiringWithinWeek) {
      console.log(
        `[CheckExpiringExemptions] URGENT: Exemption ${exemption._id} for ${exemption.entityType} expires in ${daysUntilExpiry} days`
      );

      // TODO: Send urgent email notification
      await logExemptionNotification(exemption, 'urgent', daysUntilExpiry);
    }

    for (const { exemption, daysUntilExpiry } of expiringWithinMonth) {
      console.log(
        `[CheckExpiringExemptions] Warning: Exemption ${exemption._id} for ${exemption.entityType} expires in ${daysUntilExpiry} days`
      );

      // TODO: Send warning email notification
      await logExemptionNotification(exemption, 'warning', daysUntilExpiry);
    }

    // 3. Generate summary
    const summary = await TaxExemption.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('[CheckExpiringExemptions] Summary:', summary);

    return {
      success: true,
      expired: expiredResult.modifiedCount,
      expiringWithinWeek: expiringWithinWeek.length,
      expiringWithinMonth: expiringWithinMonth.length,
      summary,
    };
  } catch (error) {
    console.error('[CheckExpiringExemptions] Error:', error);
    throw error;
  }
};

/**
 * Log exemption notification (placeholder for email system)
 */
async function logExemptionNotification(exemption, urgency, daysUntilExpiry) {
  // In production, integrate with email service
  // For now, just log the notification

  let entityEmail;
  let entityName;

  if (exemption.entityType === 'vendor') {
    const vendor = await Vendor.findById(exemption.entityRef);
    if (vendor) {
      entityEmail = vendor.email;
      entityName = vendor.businessName;
    }
  } else if (exemption.entityType === 'customer') {
    const user = await User.findById(exemption.entityRef);
    if (user) {
      entityEmail = user.email;
      entityName = user.name;
    }
  }

  console.log(`[ExemptionNotification] ${urgency.toUpperCase()}: Would send email to ${entityEmail} (${entityName})`);
  console.log(`  - Exemption: ${exemption.exemptionType}`);
  console.log(`  - Certificate: ${exemption.certificateNumber}`);
  console.log(`  - Expires: ${exemption.validUntil.toISOString().split('T')[0]} (${daysUntilExpiry} days)`);
}

/**
 * Get exemption expiry statistics
 */
const getExemptionExpiryStats = async () => {
  const now = new Date();

  const stats = await TaxExemption.aggregate([
    {
      $match: {
        status: 'verified',
      },
    },
    {
      $addFields: {
        daysUntilExpiry: {
          $divide: [
            { $subtract: ['$validUntil', now] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    {
      $bucket: {
        groupBy: '$daysUntilExpiry',
        boundaries: [-Infinity, 0, 7, 30, 90, 365, Infinity],
        default: 'other',
        output: {
          count: { $sum: 1 },
          exemptions: {
            $push: {
              id: '$_id',
              entityType: '$entityType',
              exemptionType: '$exemptionType',
              validUntil: '$validUntil',
            },
          },
        },
      },
    },
  ]);

  // Map bucket boundaries to labels
  const labels = {
    '-Infinity': 'expired',
    '0': 'within_week',
    '7': 'within_month',
    '30': 'within_quarter',
    '90': 'within_year',
    '365': 'over_year',
  };

  return stats.map((bucket) => ({
    period: labels[bucket._id.toString()] || 'other',
    count: bucket.count,
    exemptions: bucket.exemptions,
  }));
};

module.exports = {
  checkExpiringExemptions,
  getExemptionExpiryStats,
  WARNING_DAYS,
  FINAL_WARNING_DAYS,
};
