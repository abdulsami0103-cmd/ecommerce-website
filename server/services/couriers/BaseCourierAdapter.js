/**
 * Base Courier Adapter
 * Abstract class that defines the interface for all courier integrations
 */

class BaseCourierAdapter {
  constructor(config) {
    if (this.constructor === BaseCourierAdapter) {
      throw new Error('BaseCourierAdapter is abstract and cannot be instantiated directly');
    }

    this.config = config;
    this.courierCode = config?.code || 'unknown';
    this.courierName = config?.name || 'Unknown Courier';
    this.isProduction = config?.environment === 'production';
    this.baseUrl = this.isProduction
      ? config?.apiCredentials?.baseUrl
      : config?.apiCredentials?.testBaseUrl || config?.apiCredentials?.baseUrl;
  }

  /**
   * Create a new shipment/booking
   * @param {Object} shipmentData - Shipment details
   * @returns {Promise<Object>} - { trackingNumber, awbNumber, bookingId, labelUrl, estimatedDelivery }
   */
  async createShipment(shipmentData) {
    throw new Error('createShipment must be implemented by subclass');
  }

  /**
   * Get shipping label/AWB
   * @param {string} trackingNumber - The tracking number
   * @returns {Promise<Object>} - { labelUrl, labelData }
   */
  async getLabel(trackingNumber) {
    throw new Error('getLabel must be implemented by subclass');
  }

  /**
   * Get tracking information
   * @param {string} trackingNumber - The tracking number
   * @returns {Promise<Object>} - { status, events: [{status, description, location, timestamp}] }
   */
  async getTracking(trackingNumber) {
    throw new Error('getTracking must be implemented by subclass');
  }

  /**
   * Cancel a shipment
   * @param {string} trackingNumber - The tracking number
   * @returns {Promise<Object>} - { success, message }
   */
  async cancelShipment(trackingNumber) {
    throw new Error('cancelShipment must be implemented by subclass');
  }

  /**
   * Calculate shipping rate
   * @param {Object} origin - Origin address { city, postalCode }
   * @param {Object} destination - Destination address { city, postalCode }
   * @param {number} weight - Weight in kg
   * @param {Object} options - Additional options { serviceType, isCOD, codAmount }
   * @returns {Promise<Object>} - { rate, currency, estimatedDays, serviceType }
   */
  async calculateRate(origin, destination, weight, options = {}) {
    throw new Error('calculateRate must be implemented by subclass');
  }

  /**
   * Schedule pickup
   * @param {Object} pickupData - Pickup details
   * @returns {Promise<Object>} - { pickupId, pickupDate, pickupTime }
   */
  async schedulePickup(pickupData) {
    throw new Error('schedulePickup must be implemented by subclass');
  }

  /**
   * Validate address/serviceability
   * @param {Object} address - Address to validate
   * @returns {Promise<Object>} - { isServiceable, city, postalCode }
   */
  async validateAddress(address) {
    // Default implementation - override in subclass
    return { isServiceable: true, ...address };
  }

  /**
   * Normalize courier-specific status to standard status
   * @param {string} courierStatus - Courier-specific status
   * @returns {string} - Standard status
   */
  normalizeStatus(courierStatus) {
    // Default mapping - override in subclass for specific mappings
    const statusMap = {
      // Common status mappings
      booked: 'pending',
      picked: 'picked_up',
      'picked up': 'picked_up',
      'in transit': 'in_transit',
      intransit: 'in_transit',
      'out for delivery': 'out_for_delivery',
      ofd: 'out_for_delivery',
      delivered: 'delivered',
      returned: 'returned',
      'return to origin': 'returned',
      rto: 'returned',
      cancelled: 'cancelled',
      failed: 'failed',
    };

    const normalized = courierStatus?.toLowerCase()?.trim();
    return statusMap[normalized] || 'in_transit';
  }

  /**
   * Parse webhook payload
   * @param {Object} payload - Webhook payload from courier
   * @returns {Object} - { trackingNumber, status, events, rawData }
   */
  parseWebhook(payload) {
    throw new Error('parseWebhook must be implemented by subclass');
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Raw payload
   * @param {string} signature - Signature header
   * @returns {boolean}
   */
  verifyWebhookSignature(payload, signature) {
    // Default implementation - override in subclass
    return true;
  }

  /**
   * Helper: Make HTTP request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} headers - Additional headers
   */
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const axios = require('axios');

    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...headers,
    };

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: defaultHeaders,
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error) {
      console.error(`[${this.courierCode}] API Error:`, error.response?.data || error.message);
      throw new Error(
        `${this.courierName} API Error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get authentication headers
   * Override in subclass for specific auth methods
   */
  getAuthHeaders() {
    const creds = this.config?.apiCredentials;
    if (creds?.apiKey) {
      return { Authorization: `Bearer ${creds.apiKey}` };
    }
    return {};
  }

  /**
   * Helper: Format date for API
   */
  formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Helper: Format phone number for Pakistan
   */
  formatPhone(phone) {
    if (!phone) return '';
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    // Add Pakistan country code if missing
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    } else if (!cleaned.startsWith('92')) {
      cleaned = '92' + cleaned;
    }
    return cleaned;
  }
}

module.exports = BaseCourierAdapter;
