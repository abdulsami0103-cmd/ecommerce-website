const cron = require('node-cron');
const Badge = require('../models/Badge');
const EntityBadge = require('../models/EntityBadge');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * Badge Calculation Job
 * Runs daily to:
 * - Evaluate automatic badge criteria
 * - Award badges to qualifying products/vendors
 * - Revoke badges that no longer qualify
 * - Check for expired badges
 */

/**
 * Get metric value for an entity
 */
const getMetricValue = async (entityType, entityId, metric) => {
  if (entityType === 'product') {
    const product = await Product.findById(entityId);
    if (!product) return null;

    switch (metric) {
      case 'rating':
        return product.rating?.average || 0;
      case 'review_count':
        return product.rating?.count || 0;
      case 'sales_count':
        return product.salesCount || 0;
      case 'view_count':
        return product.views || 0;
      case 'stock':
        return product.inventory?.quantity || 0;
      default:
        return null;
    }
  } else if (entityType === 'vendor') {
    const vendor = await Vendor.findById(entityId);
    if (!vendor) return null;

    switch (metric) {
      case 'rating':
        return vendor.rating?.average || 0;
      case 'review_count':
        return vendor.rating?.count || 0;
      case 'product_count':
        const productCount = await Product.countDocuments({ vendor: entityId, isActive: true });
        return productCount;
      case 'order_count':
        const orderCount = await Order.countDocuments({ 'subOrders.vendor': entityId });
        return orderCount;
      case 'total_sales':
        // Calculate total sales from orders
        const orders = await Order.aggregate([
          { $unwind: '$subOrders' },
          { $match: { 'subOrders.vendor': vendor._id } },
          { $group: { _id: null, total: { $sum: '$subOrders.totals.subtotal' } } },
        ]);
        return orders[0]?.total || 0;
      case 'response_time':
        return vendor.metrics?.avgResponseTime || 0;
      case 'fulfillment_rate':
        return vendor.metrics?.fulfillmentRate || 0;
      default:
        return null;
    }
  }

  return null;
};

/**
 * Evaluate if an entity meets badge criteria
 */
const evaluateCriteria = async (badge, entityType, entityId) => {
  if (!badge.criteria.rules || badge.criteria.rules.length === 0) {
    return false;
  }

  const results = [];

  for (const rule of badge.criteria.rules) {
    const metricValue = await getMetricValue(entityType, entityId, rule.metric);

    if (metricValue === null) {
      results.push(false);
      continue;
    }

    let passes = false;

    switch (rule.operator) {
      case '>=':
        passes = metricValue >= rule.value;
        break;
      case '<=':
        passes = metricValue <= rule.value;
        break;
      case '>':
        passes = metricValue > rule.value;
        break;
      case '<':
        passes = metricValue < rule.value;
        break;
      case '==':
        passes = metricValue === rule.value;
        break;
      case '!=':
        passes = metricValue !== rule.value;
        break;
      default:
        passes = false;
    }

    results.push(passes);
  }

  // Check if all rules pass (AND logic)
  return results.every(r => r);
};

/**
 * Process automatic badges for products
 */
const processProductBadges = async () => {
  console.log('[BadgeCalculation] Processing product badges...');

  try {
    // Get all automatic badges for products
    const badges = await Badge.find({
      entityType: 'product',
      'criteria.type': 'automatic',
      isActive: true,
    });

    // Get all active products
    const products = await Product.find({ isActive: true }).select('_id');

    let awarded = 0;
    let revoked = 0;

    for (const badge of badges) {
      for (const product of products) {
        const qualifies = await evaluateCriteria(badge, 'product', product._id);
        const existingBadge = await EntityBadge.findOne({
          badge: badge._id,
          entity: product._id,
        });

        if (qualifies && !existingBadge) {
          // Award badge
          await EntityBadge.create({
            badge: badge._id,
            entityType: 'product',
            entity: product._id,
            awardedAt: new Date(),
            reason: 'Automatic - met criteria',
          });
          awarded++;
          console.log(`[BadgeCalculation] Awarded "${badge.name}" to product ${product._id}`);
        } else if (!qualifies && existingBadge && !existingBadge.awardedBy) {
          // Revoke automatic badge (only if not manually awarded)
          await EntityBadge.findByIdAndDelete(existingBadge._id);
          revoked++;
          console.log(`[BadgeCalculation] Revoked "${badge.name}" from product ${product._id}`);
        }
      }
    }

    console.log(`[BadgeCalculation] Products - Awarded: ${awarded}, Revoked: ${revoked}`);
  } catch (error) {
    console.error('[BadgeCalculation] Product badges processing failed:', error);
  }
};

/**
 * Process automatic badges for vendors
 */
const processVendorBadges = async () => {
  console.log('[BadgeCalculation] Processing vendor badges...');

  try {
    // Get all automatic badges for vendors
    const badges = await Badge.find({
      entityType: 'vendor',
      'criteria.type': 'automatic',
      isActive: true,
    });

    // Get all active/approved vendors
    const vendors = await Vendor.find({ isApproved: true }).select('_id');

    let awarded = 0;
    let revoked = 0;

    for (const badge of badges) {
      for (const vendor of vendors) {
        const qualifies = await evaluateCriteria(badge, 'vendor', vendor._id);
        const existingBadge = await EntityBadge.findOne({
          badge: badge._id,
          entity: vendor._id,
        });

        if (qualifies && !existingBadge) {
          // Award badge
          await EntityBadge.create({
            badge: badge._id,
            entityType: 'vendor',
            entity: vendor._id,
            awardedAt: new Date(),
            reason: 'Automatic - met criteria',
          });
          awarded++;
          console.log(`[BadgeCalculation] Awarded "${badge.name}" to vendor ${vendor._id}`);
        } else if (!qualifies && existingBadge && !existingBadge.awardedBy) {
          // Revoke automatic badge
          await EntityBadge.findByIdAndDelete(existingBadge._id);
          revoked++;
          console.log(`[BadgeCalculation] Revoked "${badge.name}" from vendor ${vendor._id}`);
        }
      }
    }

    console.log(`[BadgeCalculation] Vendors - Awarded: ${awarded}, Revoked: ${revoked}`);
  } catch (error) {
    console.error('[BadgeCalculation] Vendor badges processing failed:', error);
  }
};

/**
 * Check and remove expired badges
 */
const checkExpiredBadges = async () => {
  console.log('[BadgeCalculation] Checking for expired badges...');

  try {
    const now = new Date();

    const result = await EntityBadge.deleteMany({
      expiresAt: { $lte: now },
    });

    if (result.deletedCount > 0) {
      console.log(`[BadgeCalculation] Removed ${result.deletedCount} expired badges`);
    }
  } catch (error) {
    console.error('[BadgeCalculation] Expired badges check failed:', error);
  }
};

/**
 * Create default badges if they don't exist
 */
const ensureDefaultBadges = async () => {
  console.log('[BadgeCalculation] Ensuring default badges exist...');

  const defaultBadges = [
    {
      name: 'Top Rated',
      slug: 'top-rated',
      description: 'Products/vendors with rating of 4.5 or higher',
      icon: 'star',
      color: '#FFD700',
      entityType: 'product',
      criteria: {
        type: 'automatic',
        rules: [
          { metric: 'rating', operator: '>=', value: 4.5 },
          { metric: 'review_count', operator: '>=', value: 10 },
        ],
      },
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Best Seller',
      slug: 'best-seller',
      description: 'Products with high sales volume',
      icon: 'trending_up',
      color: '#FF6B6B',
      entityType: 'product',
      criteria: {
        type: 'automatic',
        rules: [
          { metric: 'sales_count', operator: '>=', value: 100 },
        ],
      },
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Verified Seller',
      slug: 'verified-seller',
      description: 'Vendors who have completed verification',
      icon: 'verified',
      color: '#4CAF50',
      entityType: 'vendor',
      criteria: {
        type: 'manual',
        rules: [],
      },
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Top Seller',
      slug: 'top-seller',
      description: 'Vendors with excellent performance',
      icon: 'emoji_events',
      color: '#9C27B0',
      entityType: 'vendor',
      criteria: {
        type: 'automatic',
        rules: [
          { metric: 'rating', operator: '>=', value: 4.5 },
          { metric: 'order_count', operator: '>=', value: 50 },
        ],
      },
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Fast Shipper',
      slug: 'fast-shipper',
      description: 'Vendors with quick fulfillment',
      icon: 'local_shipping',
      color: '#2196F3',
      entityType: 'vendor',
      criteria: {
        type: 'automatic',
        rules: [
          { metric: 'fulfillment_rate', operator: '>=', value: 95 },
        ],
      },
      isActive: true,
      displayOrder: 3,
    },
  ];

  for (const badgeData of defaultBadges) {
    const exists = await Badge.findOne({ slug: badgeData.slug });
    if (!exists) {
      await Badge.create(badgeData);
      console.log(`[BadgeCalculation] Created default badge: ${badgeData.name}`);
    }
  }
};

// Main job function
const runBadgeCalculation = async () => {
  console.log('[BadgeCalculation] Starting badge calculation job...');

  await ensureDefaultBadges();
  await processProductBadges();
  await processVendorBadges();
  await checkExpiredBadges();

  console.log('[BadgeCalculation] Badge calculation completed');
};

// Schedule jobs
const startBadgeCalculationJobs = () => {
  // Run badge calculation daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await runBadgeCalculation();
  });

  console.log('[BadgeCalculation] Jobs scheduled');
};

module.exports = {
  startBadgeCalculationJobs,
  runBadgeCalculation,
  processProductBadges,
  processVendorBadges,
  checkExpiredBadges,
  ensureDefaultBadges,
};
