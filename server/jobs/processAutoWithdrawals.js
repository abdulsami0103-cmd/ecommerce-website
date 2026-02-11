/**
 * Process Auto Withdrawals Job
 *
 * Runs daily to process automatic withdrawals for vendors
 * who have enabled auto-withdrawal in their payout settings.
 *
 * Schedule: Daily at 02:00 AM
 */

const PayoutSettings = require('../models/PayoutSettings');
const PayoutRequest = require('../models/PayoutRequest');
const VendorWallet = require('../models/VendorWallet');

// Default minimum balance for auto-withdrawal
const DEFAULT_AUTO_WITHDRAW_THRESHOLD = 10000; // 10,000 PKR

/**
 * Process automatic withdrawals for eligible vendors
 */
const processAutoWithdrawals = async () => {
  console.log('[AutoWithdrawals] Starting auto-withdrawal processing...');

  try {
    // Find vendors with auto-withdraw enabled
    const eligibleSettings = await PayoutSettings.find({
      autoWithdraw: true,
      isActive: { $ne: false },
    }).populate('vendor');

    console.log(`[AutoWithdrawals] Found ${eligibleSettings.length} vendors with auto-withdraw enabled`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const settings of eligibleSettings) {
      try {
        const result = await processVendorAutoWithdrawal(settings);
        results.push(result);

        if (result.status === 'processed') {
          processedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`[AutoWithdrawals] Error processing vendor ${settings.vendor?._id}:`, error.message);
        errorCount++;
        results.push({
          vendorId: settings.vendor?._id,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log(`[AutoWithdrawals] Completed: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`);

    return {
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      results,
    };
  } catch (error) {
    console.error('[AutoWithdrawals] Error:', error);
    throw error;
  }
};

/**
 * Process auto-withdrawal for a single vendor
 */
async function processVendorAutoWithdrawal(settings) {
  const vendorId = settings.vendor?._id;
  const threshold = settings.autoWithdrawThreshold || DEFAULT_AUTO_WITHDRAW_THRESHOLD;
  const minimumWithdrawal = settings.minimumWithdrawal || 1000;

  // Get vendor wallet
  const wallet = await VendorWallet.findOne({ vendor: vendorId });

  if (!wallet) {
    return {
      vendorId,
      status: 'skipped',
      reason: 'no_wallet',
    };
  }

  // Check if available balance meets threshold
  if (wallet.availableBalance < threshold) {
    return {
      vendorId,
      status: 'skipped',
      reason: 'below_threshold',
      availableBalance: wallet.availableBalance,
      threshold,
    };
  }

  // Check for pending payout requests
  const pendingRequest = await PayoutRequest.findOne({
    vendor: vendorId,
    status: { $in: ['requested', 'under_review', 'approved', 'processing'] },
  });

  if (pendingRequest) {
    return {
      vendorId,
      status: 'skipped',
      reason: 'pending_request_exists',
      pendingRequestId: pendingRequest._id,
    };
  }

  // Check rate limit (1 request per 24 hours)
  if (settings.lastPayoutRequestAt) {
    const hoursSinceLastRequest = (Date.now() - settings.lastPayoutRequestAt) / (1000 * 60 * 60);
    if (hoursSinceLastRequest < 24) {
      return {
        vendorId,
        status: 'skipped',
        reason: 'rate_limited',
        hoursSinceLastRequest: Math.round(hoursSinceLastRequest),
      };
    }
  }

  // Get default payment method
  const defaultMethod = settings.paymentMethods.find((m) => m.isDefault && m.isVerified);

  if (!defaultMethod) {
    return {
      vendorId,
      status: 'skipped',
      reason: 'no_verified_payment_method',
    };
  }

  // Calculate withdrawal amount (entire available balance)
  const withdrawAmount = wallet.availableBalance;

  if (withdrawAmount < minimumWithdrawal) {
    return {
      vendorId,
      status: 'skipped',
      reason: 'below_minimum',
      amount: withdrawAmount,
      minimum: minimumWithdrawal,
    };
  }

  // Calculate fees
  const fees = calculateFees(withdrawAmount, defaultMethod.type);

  // Create payout request
  const payoutRequest = new PayoutRequest({
    vendor: vendorId,
    wallet: wallet._id,
    requestedAmount: withdrawAmount,
    fees,
    netAmount: withdrawAmount - fees.totalFees,
    paymentMethod: {
      type: defaultMethod.type,
      details: defaultMethod.details,
    },
    isAutoWithdrawal: true,
    notes: 'Automatic withdrawal',
    statusHistory: [
      {
        status: 'requested',
        changedAt: new Date(),
        notes: 'Auto-withdrawal triggered by system',
      },
    ],
  });

  await payoutRequest.save();

  // Reserve funds in wallet
  await wallet.reserveForPayout(withdrawAmount);

  // Update last payout request time
  settings.lastPayoutRequestAt = new Date();
  await settings.save();

  console.log(`[AutoWithdrawals] Created payout request ${payoutRequest._id} for vendor ${vendorId}: ${withdrawAmount}`);

  return {
    vendorId,
    status: 'processed',
    payoutRequestId: payoutRequest._id,
    amount: withdrawAmount,
    netAmount: payoutRequest.netAmount,
    paymentMethod: defaultMethod.type,
  };
}

/**
 * Calculate withdrawal fees
 */
function calculateFees(amount, paymentMethodType) {
  let platformFeeRate = 0.02; // 2% platform fee
  let processingFee = 0;

  switch (paymentMethodType) {
    case 'bank_transfer':
      processingFee = 50; // PKR 50 flat fee
      break;
    case 'easypaisa':
    case 'jazzcash':
      processingFee = Math.min(amount * 0.01, 200); // 1% max PKR 200
      break;
    case 'paypal':
      processingFee = amount * 0.025; // 2.5%
      break;
    case 'stripe':
      processingFee = amount * 0.029 + 30; // 2.9% + PKR 30
      break;
    default:
      processingFee = 0;
  }

  const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
  const totalFees = Math.round((platformFee + processingFee) * 100) / 100;

  return {
    platformFee,
    processingFee: Math.round(processingFee * 100) / 100,
    totalFees,
  };
}

/**
 * Get auto-withdrawal statistics
 */
const getAutoWithdrawalStats = async () => {
  // Vendors with auto-withdraw enabled
  const enabledCount = await PayoutSettings.countDocuments({ autoWithdraw: true });

  // Total auto-withdrawals processed
  const autoWithdrawalStats = await PayoutRequest.aggregate([
    { $match: { isAutoWithdrawal: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$requestedAmount' },
      },
    },
  ]);

  // Vendors eligible for auto-withdrawal (above threshold)
  const eligibleVendors = await PayoutSettings.aggregate([
    { $match: { autoWithdraw: true } },
    {
      $lookup: {
        from: 'vendorwallets',
        localField: 'vendor',
        foreignField: 'vendor',
        as: 'wallet',
      },
    },
    { $unwind: '$wallet' },
    {
      $match: {
        $expr: {
          $gte: ['$wallet.availableBalance', { $ifNull: ['$autoWithdrawThreshold', DEFAULT_AUTO_WITHDRAW_THRESHOLD] }],
        },
      },
    },
    { $count: 'eligible' },
  ]);

  return {
    vendorsWithAutoWithdraw: enabledCount,
    eligibleForWithdrawal: eligibleVendors[0]?.eligible || 0,
    autoWithdrawalsByStatus: autoWithdrawalStats.reduce((acc, s) => {
      acc[s._id] = { count: s.count, totalAmount: s.totalAmount };
      return acc;
    }, {}),
  };
};

module.exports = {
  processAutoWithdrawals,
  getAutoWithdrawalStats,
  DEFAULT_AUTO_WITHDRAW_THRESHOLD,
};
