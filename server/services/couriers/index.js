const BaseCourierAdapter = require('./BaseCourierAdapter');
const TCSAdapter = require('./TCSAdapter');
const LeopardsAdapter = require('./LeopardsAdapter');
const PostExAdapter = require('./PostExAdapter');
const CourierConfig = require('../../models/CourierConfig');

/**
 * Courier Service Factory
 * Returns the appropriate courier adapter based on courier code
 */

const adapters = {
  tcs: TCSAdapter,
  leopards: LeopardsAdapter,
  postex: PostExAdapter,
};

/**
 * Get courier adapter instance
 * @param {string} courierCode - The courier code (tcs, leopards, postex)
 * @returns {Promise<BaseCourierAdapter>}
 */
async function getCourierAdapter(courierCode) {
  const AdapterClass = adapters[courierCode?.toLowerCase()];

  if (!AdapterClass) {
    throw new Error(`Unsupported courier: ${courierCode}`);
  }

  // Get courier config from database
  const config = await CourierConfig.findOne({
    code: courierCode.toLowerCase(),
    isActive: true,
  });

  if (!config) {
    throw new Error(`Courier ${courierCode} is not configured or not active`);
  }

  return new AdapterClass(config);
}

/**
 * Get all active courier adapters
 * @returns {Promise<Array<{code: string, adapter: BaseCourierAdapter}>>}
 */
async function getAllActiveCouriers() {
  const configs = await CourierConfig.find({ isActive: true });

  return configs
    .filter((config) => adapters[config.code])
    .map((config) => ({
      code: config.code,
      name: config.name,
      adapter: new adapters[config.code](config),
    }));
}

/**
 * Compare rates across all active couriers
 * @param {Object} origin - Origin address
 * @param {Object} destination - Destination address
 * @param {number} weight - Package weight
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Sorted rates from all couriers
 */
async function compareRates(origin, destination, weight, options = {}) {
  const couriers = await getAllActiveCouriers();
  const rates = [];

  for (const { code, name, adapter } of couriers) {
    try {
      const rate = await adapter.calculateRate(origin, destination, weight, options);
      if (rate.success) {
        rates.push({
          courierCode: code,
          courierName: name,
          ...rate,
        });
      }
    } catch (error) {
      console.error(`Error getting rate from ${code}:`, error.message);
    }
  }

  // Sort by rate (cheapest first)
  return rates.sort((a, b) => a.rate - b.rate);
}

/**
 * Track shipment across all couriers (for unknown courier)
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<Object>} - Tracking result
 */
async function trackAcrossCouriers(trackingNumber) {
  const couriers = await getAllActiveCouriers();

  for (const { code, adapter } of couriers) {
    try {
      const result = await adapter.getTracking(trackingNumber);
      if (result.success && result.events.length > 0) {
        return {
          ...result,
          courierCode: code,
        };
      }
    } catch (error) {
      // Continue to next courier
    }
  }

  return {
    success: false,
    error: 'Tracking number not found in any courier system',
    events: [],
  };
}

module.exports = {
  getCourierAdapter,
  getAllActiveCouriers,
  compareRates,
  trackAcrossCouriers,
  BaseCourierAdapter,
  TCSAdapter,
  LeopardsAdapter,
  PostExAdapter,
};
