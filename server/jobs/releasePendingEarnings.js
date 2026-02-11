/**
 * Release Pending Earnings Job
 *
 * Runs hourly to release vendor earnings from pending to available balance
 * after the holding period has elapsed.
 *
 * Schedule: Hourly at :05
 */

const WalletTransaction = require('../models/WalletTransaction');
const VendorWallet = require('../models/VendorWallet');

const HOLDING_PERIOD_DAYS = 7;

/**
 * Release pending earnings that have passed the holding period
 */
const releasePendingEarnings = async () => {
  console.log('[ReleasePendingEarnings] Starting release check...');

  try {
    const now = new Date();

    // Find transactions in 'hold' status where releaseDate has passed
    const pendingTransactions = await WalletTransaction.find({
      type: 'hold',
      releaseDate: { $lte: now },
      releasedAt: { $exists: false },
    }).populate('wallet');

    console.log(`[ReleasePendingEarnings] Found ${pendingTransactions.length} transactions to release`);

    let releasedCount = 0;
    let totalReleased = 0;

    for (const transaction of pendingTransactions) {
      try {
        const wallet = await VendorWallet.findById(transaction.wallet);
        if (!wallet) {
          console.error(`[ReleasePendingEarnings] Wallet not found for transaction ${transaction._id}`);
          continue;
        }

        // Release the funds
        await wallet.releasePendingEarnings(transaction.amount, {
          type: 'order_item',
          id: transaction.reference?.id,
        });

        // Mark original transaction as released
        transaction.releasedAt = now;
        await transaction.save();

        releasedCount++;
        totalReleased += transaction.amount;

        console.log(`[ReleasePendingEarnings] Released ${transaction.amount} for vendor ${wallet.vendor}`);
      } catch (error) {
        console.error(`[ReleasePendingEarnings] Error releasing transaction ${transaction._id}:`, error.message);
      }
    }

    console.log(`[ReleasePendingEarnings] Completed: ${releasedCount} transactions, ${totalReleased} total amount released`);

    return {
      success: true,
      releasedCount,
      totalReleased,
    };
  } catch (error) {
    console.error('[ReleasePendingEarnings] Error:', error);
    throw error;
  }
};

/**
 * Calculate release date based on holding period
 */
const calculateReleaseDate = (fromDate = new Date()) => {
  const releaseDate = new Date(fromDate);
  releaseDate.setDate(releaseDate.getDate() + HOLDING_PERIOD_DAYS);
  return releaseDate;
};

/**
 * Get statistics about pending releases
 */
const getPendingReleaseStats = async () => {
  const now = new Date();

  // Pending releases by time bucket
  const stats = await WalletTransaction.aggregate([
    {
      $match: {
        type: 'hold',
        releasedAt: { $exists: false },
      },
    },
    {
      $addFields: {
        daysUntilRelease: {
          $divide: [
            { $subtract: ['$releaseDate', now] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    {
      $bucket: {
        groupBy: '$daysUntilRelease',
        boundaries: [-Infinity, 0, 1, 3, 7, Infinity],
        default: 'other',
        output: {
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    },
  ]);

  // Total pending
  const totals = await WalletTransaction.aggregate([
    {
      $match: {
        type: 'hold',
        releasedAt: { $exists: false },
      },
    },
    {
      $group: {
        _id: null,
        totalPending: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    byTimeBucket: stats,
    totals: totals[0] || { totalPending: 0, count: 0 },
  };
};

module.exports = {
  releasePendingEarnings,
  calculateReleaseDate,
  getPendingReleaseStats,
  HOLDING_PERIOD_DAYS,
};
