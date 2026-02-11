const { scheduleTrackingUpdates } = require('./fetchTrackingUpdates');
const { scheduleRMAEscalation } = require('./escalateOverdueRMA');
const { scheduleMonthlyStatements } = require('./generateMonthlyStatements');
const { scheduleDeliveryNotifications } = require('./notifyDeliveryStatus');
const { startPromotionBillingJobs } = require('./promotionBilling');
const { startPromotionStatsJobs } = require('./promotionStats');
const { startBadgeCalculationJobs } = require('./badgeCalculation');
const { startCampaignSenderJobs } = require('./campaignSender');
const exchangeRateJob = require('./updateExchangeRates');
const sitemapGenerator = require('./sitemapGenerator');

/**
 * Initialize all cron jobs
 */
const initializeJobs = () => {
  console.log('[Jobs] Initializing background jobs...');

  // Shipment tracking updates (hourly)
  scheduleTrackingUpdates();

  // RMA escalation (every 2 hours)
  scheduleRMAEscalation();

  // Monthly vendor statements (1st of month)
  scheduleMonthlyStatements();

  // Delivery notifications (every 30 minutes)
  scheduleDeliveryNotifications();

  // Promotion billing (daily)
  startPromotionBillingJobs();

  // Promotion stats aggregation (daily)
  startPromotionStatsJobs();

  // Badge calculation (daily)
  startBadgeCalculationJobs();

  // Campaign sender (every 5 minutes)
  startCampaignSenderJobs();

  // Exchange rate updates (daily at 6 AM UTC)
  exchangeRateJob.schedule();

  // Sitemap generation (daily at 2 AM)
  sitemapGenerator.schedule();

  console.log('[Jobs] All background jobs initialized');
};

module.exports = {
  initializeJobs,
};
