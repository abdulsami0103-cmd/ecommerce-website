const cron = require('node-cron');
const currencyService = require('../services/currencyService');

/**
 * Exchange Rate Update Job
 * Fetches latest exchange rates from Open Exchange Rates API
 */
class ExchangeRateJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;
  }

  /**
   * Initialize the job
   */
  async initialize() {
    // Check if rates are stale and update if needed
    const stale = await currencyService.areRatesStale();

    if (stale) {
      console.log('[ExchangeRateJob] Rates are stale, updating...');
      await this.run();
    }

    console.log('[ExchangeRateJob] Initialized');
  }

  /**
   * Run the job
   */
  async run() {
    if (this.isRunning) {
      console.log('[ExchangeRateJob] Already running, skipping...');
      return null;
    }

    this.isRunning = true;
    console.log('[ExchangeRateJob] Starting exchange rate update...');

    try {
      const result = await currencyService.fetchExchangeRates();

      this.lastRun = new Date();
      this.lastResult = result;

      if (result?.success) {
        console.log(`[ExchangeRateJob] Updated ${result.updated} currencies`);
      } else {
        console.error('[ExchangeRateJob] Failed to update rates:', result?.error);
      }

      return result;
    } catch (error) {
      console.error('[ExchangeRateJob] Error:', error);
      this.lastResult = { success: false, error: error.message };
      return null;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule the job
   * Runs daily at 6:00 AM UTC
   */
  schedule() {
    // Run at 6:00 AM UTC every day
    cron.schedule('0 6 * * *', async () => {
      console.log('[ExchangeRateJob] Running scheduled update...');
      await this.run();
    });

    // Also run at 6:00 PM UTC for redundancy
    cron.schedule('0 18 * * *', async () => {
      console.log('[ExchangeRateJob] Running backup update...');
      await this.run();
    });

    console.log('[ExchangeRateJob] Scheduled for 6:00 AM and 6:00 PM UTC');
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastResult: this.lastResult,
    };
  }
}

const exchangeRateJob = new ExchangeRateJob();

module.exports = exchangeRateJob;
