const cron = require('node-cron');
const Promotion = require('../models/Promotion');
const PromotionSlot = require('../models/PromotionSlot');
const Vendor = require('../models/Vendor');

/**
 * Promotion Billing Job
 * Runs daily at midnight to:
 * - Calculate spend for CPC/CPM promotions
 * - Deduct from vendor wallets
 * - Pause promotions when budget exhausted
 */

const processPromotionBilling = async () => {
  console.log('[PromotionBilling] Starting daily billing job...');

  try {
    // Get active promotions with CPC or CPM pricing
    const activePromotions = await Promotion.find({
      status: 'active',
    }).populate('slot vendor');

    let processed = 0;
    let paused = 0;
    let totalBilled = 0;

    for (const promotion of activePromotions) {
      try {
        const slot = promotion.slot;
        if (!slot) continue;

        let dailyCharge = 0;

        if (slot.pricingModel === 'cpc') {
          // Charge based on clicks in the last 24 hours
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          // Count clicks from last 24 hours (simplified - in production would track individual click times)
          const recentClicks = promotion.stats.clicks - (promotion.lastBilledClicks || 0);
          dailyCharge = recentClicks * (slot.pricing.perClick || 0);

          // Update last billed clicks
          promotion.lastBilledClicks = promotion.stats.clicks;
        } else if (slot.pricingModel === 'cpm') {
          // Charge based on impressions (per 1000)
          const recentImpressions = promotion.stats.impressions - (promotion.lastBilledImpressions || 0);
          dailyCharge = (recentImpressions / 1000) * (slot.pricing.perImpression || 0);

          // Update last billed impressions
          promotion.lastBilledImpressions = promotion.stats.impressions;
        } else if (slot.pricingModel === 'fixed') {
          // Fixed daily charge
          dailyCharge = slot.pricing.daily || 0;
        }

        if (dailyCharge > 0) {
          // Update spent amount
          promotion.budget.spent = (promotion.budget.spent || 0) + dailyCharge;
          totalBilled += dailyCharge;

          // Check if budget exceeded
          if (promotion.budget.type !== 'unlimited') {
            const budgetAmount = promotion.budget.amount || 0;

            if (promotion.budget.spent >= budgetAmount) {
              promotion.status = 'paused';
              promotion.budgetExhaustedAt = new Date();
              paused++;

              // TODO: Send notification to vendor about budget exhaustion
              console.log(`[PromotionBilling] Paused promotion ${promotion._id} - budget exhausted`);
            }

            // Check daily budget limit
            if (promotion.budget.type === 'daily' && dailyCharge >= budgetAmount) {
              promotion.status = 'paused';
              promotion.dailyBudgetReachedAt = new Date();
              paused++;
            }
          }

          await promotion.save();
          processed++;
        }
      } catch (promoError) {
        console.error(`[PromotionBilling] Error processing promotion ${promotion._id}:`, promoError);
      }
    }

    console.log(`[PromotionBilling] Completed: ${processed} promotions processed, ${paused} paused, Rs. ${totalBilled.toFixed(2)} billed`);

    // Also reset daily budget promotions that were paused
    const pausedDailyBudget = await Promotion.find({
      status: 'paused',
      'budget.type': 'daily',
      dailyBudgetReachedAt: { $exists: true },
    });

    for (const promo of pausedDailyBudget) {
      const now = new Date();
      const pausedAt = new Date(promo.dailyBudgetReachedAt);

      // If it's a new day, resume the promotion
      if (now.toDateString() !== pausedAt.toDateString()) {
        promo.status = 'active';
        promo.dailyBudgetReachedAt = undefined;
        promo.budget.spent = 0; // Reset daily spent
        await promo.save();
        console.log(`[PromotionBilling] Resumed daily budget promotion ${promo._id}`);
      }
    }
  } catch (error) {
    console.error('[PromotionBilling] Job failed:', error);
  }
};

/**
 * Check for expired promotions and mark as completed
 */
const checkExpiredPromotions = async () => {
  console.log('[PromotionBilling] Checking for expired promotions...');

  try {
    const now = new Date();

    const result = await Promotion.updateMany(
      {
        status: 'active',
        'scheduling.expiresAt': { $lte: now },
      },
      {
        $set: { status: 'completed' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[PromotionBilling] Marked ${result.modifiedCount} promotions as completed`);
    }

    // Also check for approved promotions that should become active
    const activatedResult = await Promotion.updateMany(
      {
        status: 'approved',
        'scheduling.startsAt': { $lte: now },
        'scheduling.expiresAt': { $gt: now },
        'payment.status': 'paid',
      },
      {
        $set: { status: 'active' },
      }
    );

    if (activatedResult.modifiedCount > 0) {
      console.log(`[PromotionBilling] Activated ${activatedResult.modifiedCount} approved promotions`);
    }
  } catch (error) {
    console.error('[PromotionBilling] Error checking expired promotions:', error);
  }
};

// Schedule jobs
const startPromotionBillingJobs = () => {
  // Run billing job daily at midnight
  cron.schedule('0 0 * * *', async () => {
    await processPromotionBilling();
    await checkExpiredPromotions();
  });

  // Check for expired/activating promotions every hour
  cron.schedule('0 * * * *', async () => {
    await checkExpiredPromotions();
  });

  console.log('[PromotionBilling] Jobs scheduled');
};

module.exports = {
  startPromotionBillingJobs,
  processPromotionBilling,
  checkExpiredPromotions,
};
