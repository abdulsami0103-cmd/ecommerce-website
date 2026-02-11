const BaseCourierAdapter = require('./BaseCourierAdapter');

/**
 * PostEx Courier Adapter
 * Documentation: https://postex.pk/api-docs
 */

class PostExAdapter extends BaseCourierAdapter {
  constructor(config) {
    super(config);
    this.courierCode = 'postex';
    this.courierName = 'PostEx';
  }

  getAuthHeaders() {
    const creds = this.config?.apiCredentials;
    return {
      'token': creds?.apiKey || '',
      'Content-Type': 'application/json',
    };
  }

  async createShipment(shipmentData) {
    const creds = this.config?.apiCredentials;

    const payload = {
      cityName: shipmentData.destination.city,
      customerName: shipmentData.destination.name,
      customerPhone: this.formatPhone(shipmentData.destination.phone),
      deliveryAddress: shipmentData.destination.address,
      invoiceDivision: creds?.accountNumber || '',
      invoicePayment: shipmentData.isCOD ? shipmentData.codAmount : 0,
      items: shipmentData.package.itemCount || 1,
      orderDetail: shipmentData.package.description || 'Package',
      orderRefNumber: shipmentData.referenceNumber || `ORD-${Date.now()}`,
      transactionNotes: shipmentData.specialInstructions || '',

      // Additional fields
      orderType: shipmentData.isCOD ? 'COD' : 'Prepaid',
      weight: shipmentData.package.weight,
      pickupAddressCode: creds?.pickupAddress,
    };

    try {
      const response = await this.makeRequest('POST', '/api/v1/create-order', payload);

      if (response.statusCode === 200 || response.success) {
        return {
          success: true,
          trackingNumber: response.trackingNumber || response.dist?.trackingNumber,
          awbNumber: response.trackingNumber,
          bookingId: response.orderId || response.dist?.orderId,
          labelUrl: response.labelUrl,
          estimatedDelivery: this.calculateEstimatedDelivery(
            shipmentData.origin.city,
            shipmentData.destination.city
          ),
          rawResponse: response,
        };
      } else {
        throw new Error(response.message || response.error || 'Booking failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getLabel(trackingNumber) {
    try {
      const response = await this.makeRequest(
        'GET',
        `/api/v1/get-label/${trackingNumber}`
      );

      return {
        success: true,
        labelUrl: response.labelUrl || response.dist?.labelUrl,
        labelData: response.labelPdf,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTracking(trackingNumber) {
    try {
      const response = await this.makeRequest(
        'GET',
        `/api/v1/track-order/${trackingNumber}`
      );

      if (response.statusCode === 200 || response.success) {
        const trackingData = response.dist || response.data || response;
        const activities = trackingData.transactionStatusHistory || trackingData.history || [];

        const events = activities.map((activity) => ({
          status: this.normalizeStatus(activity.transactionStatus || activity.status),
          statusCode: activity.statusCode,
          description: activity.transactionStatusMessage || activity.message || activity.status,
          location: {
            city: activity.city || activity.location,
            facility: activity.station,
          },
          timestamp: new Date(activity.createdAt || activity.datetime),
          rawData: activity,
        }));

        return {
          success: true,
          trackingNumber,
          currentStatus: this.normalizeStatus(
            trackingData.transactionStatus || trackingData.currentStatus
          ),
          events,
          deliveredAt: trackingData.deliveredAt
            ? new Date(trackingData.deliveredAt)
            : null,
          signedBy: trackingData.receiverName,
          rawResponse: response,
        };
      } else {
        throw new Error(response.message || 'Tracking failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        events: [],
      };
    }
  }

  async cancelShipment(trackingNumber) {
    try {
      const response = await this.makeRequest('POST', '/api/v1/cancel-order', {
        trackingNumber: trackingNumber,
      });

      return {
        success: response.statusCode === 200 || response.success,
        message: response.message || 'Cancellation processed',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async calculateRate(origin, destination, weight, options = {}) {
    try {
      const response = await this.makeRequest('POST', '/api/v1/get-rates', {
        originCity: origin.city,
        destinationCity: destination.city,
        weight: weight,
        orderType: options.isCOD ? 'COD' : 'Prepaid',
        codAmount: options.codAmount || 0,
      });

      if (response.statusCode === 200 || response.success) {
        const rates = response.dist || response.data || response;
        return {
          success: true,
          rate: parseFloat(rates.totalCharges || rates.shippingCost || 0),
          currency: 'PKR',
          breakdown: {
            freightCharges: parseFloat(rates.freightCharges || 0),
            codCharges: parseFloat(rates.codCharges || 0),
            fuelSurcharge: parseFloat(rates.fuelSurcharge || 0),
            gst: parseFloat(rates.gst || 0),
          },
          estimatedDays: this.getEstimatedDays(origin.city, destination.city),
          serviceType: 'Standard',
        };
      }

      return {
        success: true,
        rate: this.config?.defaultRate || 180,
        currency: 'PKR',
        estimatedDays: 3,
        serviceType: 'Standard',
      };
    } catch (error) {
      return {
        success: true,
        rate: this.config?.defaultRate || 180,
        currency: 'PKR',
        estimatedDays: 3,
        serviceType: 'Standard',
        error: error.message,
      };
    }
  }

  async schedulePickup(pickupData) {
    try {
      const response = await this.makeRequest('POST', '/api/v1/schedule-pickup', {
        pickupDate: this.formatDate(pickupData.date),
        pickupTime: pickupData.timeSlot || '10:00-14:00',
        pickupAddress: pickupData.address,
        cityName: pickupData.city,
        contactName: pickupData.contactName,
        contactPhone: this.formatPhone(pickupData.phone),
        orderCount: pickupData.shipmentCount || 1,
        notes: pickupData.instructions || '',
      });

      if (response.statusCode === 200 || response.success) {
        return {
          success: true,
          pickupId: response.dist?.pickupId || response.pickupId,
          pickupDate: pickupData.date,
          pickupTime: pickupData.timeSlot,
        };
      } else {
        throw new Error(response.message || 'Pickup scheduling failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  normalizeStatus(postexStatus) {
    const statusMap = {
      pending: 'pending',
      'order created': 'pending',
      'picked up': 'picked_up',
      'in transit': 'in_transit',
      'at sorting facility': 'in_transit',
      'dispatched': 'in_transit',
      'out for delivery': 'out_for_delivery',
      ofd: 'out_for_delivery',
      delivered: 'delivered',
      'delivery attempt': 'attempted_delivery',
      'delivery failed': 'attempted_delivery',
      returned: 'returned',
      'return to origin': 'returned',
      rto: 'returned',
      cancelled: 'cancelled',
    };

    const normalized = postexStatus?.toLowerCase()?.trim();
    return statusMap[normalized] || 'in_transit';
  }

  parseWebhook(payload) {
    return {
      trackingNumber: payload.trackingNumber || payload.tracking_number,
      status: this.normalizeStatus(payload.transactionStatus || payload.status),
      events: [
        {
          status: this.normalizeStatus(payload.transactionStatus || payload.status),
          description: payload.transactionStatusMessage || payload.message || payload.status,
          location: { city: payload.city || payload.location },
          timestamp: new Date(payload.createdAt || payload.timestamp || Date.now()),
        },
      ],
      rawData: payload,
    };
  }

  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const webhookSecret = this.config?.webhookSecret;

    if (!webhookSecret) return true; // No verification if no secret

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedSignature === signature;
  }

  calculateEstimatedDelivery(originCity, destinationCity) {
    const days = this.getEstimatedDays(originCity, destinationCity);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  getEstimatedDays(originCity, destinationCity) {
    if (originCity?.toLowerCase() === destinationCity?.toLowerCase()) {
      return 1;
    }

    const majorCities = ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad'];
    const isOriginMajor = majorCities.includes(originCity?.toLowerCase());
    const isDestMajor = majorCities.includes(destinationCity?.toLowerCase());

    if (isOriginMajor && isDestMajor) {
      return 2;
    }

    return 3;
  }
}

module.exports = PostExAdapter;
