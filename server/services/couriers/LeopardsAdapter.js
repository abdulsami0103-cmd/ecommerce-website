const BaseCourierAdapter = require('./BaseCourierAdapter');

/**
 * Leopards Courier Adapter
 * Documentation: https://leopardscourier.com/api
 */

class LeopardsAdapter extends BaseCourierAdapter {
  constructor(config) {
    super(config);
    this.courierCode = 'leopards';
    this.courierName = 'Leopards Courier';
  }

  getAuthHeaders() {
    const creds = this.config?.apiCredentials;
    return {
      'api-key': creds?.apiKey || '',
    };
  }

  async createShipment(shipmentData) {
    const creds = this.config?.apiCredentials;

    const payload = {
      api_key: creds?.apiKey,
      api_password: creds?.apiSecret,
      shipment_type_id: shipmentData.isCOD ? 1 : 2, // 1 = COD, 2 = Non-COD
      order_id: shipmentData.referenceNumber || `ORD-${Date.now()}`,
      pickup_address_id: creds?.pickupAddress,

      consignee_name: shipmentData.destination.name,
      consignee_phone: this.formatPhone(shipmentData.destination.phone),
      consignee_email: shipmentData.destination.email || '',
      consignee_address: shipmentData.destination.address,
      consignee_city: this.getCityId(shipmentData.destination.city),

      product_type_id: 1, // Standard
      weight: shipmentData.package.weight,
      pieces: shipmentData.package.itemCount || 1,
      collect_amount: shipmentData.isCOD ? shipmentData.codAmount : 0,
      order_amount: shipmentData.package.declaredValue || 0,
      special_instructions: shipmentData.specialInstructions || '',
      product_description: shipmentData.package.description || 'Package',

      // Service options
      is_fragile: shipmentData.package.fragile ? 1 : 0,
      is_insurance: shipmentData.package.declaredValue > 0 ? 1 : 0,
    };

    try {
      const response = await this.makeRequest('POST', '/webservice/book-packet', payload);

      if (response.status === 1 || response.status === '1') {
        return {
          success: true,
          trackingNumber: response.track_number,
          awbNumber: response.cn_number || response.track_number,
          bookingId: response.booking_id,
          labelUrl: response.slip_link,
          estimatedDelivery: this.calculateEstimatedDelivery(
            shipmentData.origin.city,
            shipmentData.destination.city
          ),
          rawResponse: response,
        };
      } else {
        throw new Error(response.error || response.message || 'Booking failed');
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
        `/webservice/get-slip?track_number=${trackingNumber}`
      );

      return {
        success: true,
        labelUrl: response.slip_link,
        labelData: response.slip_pdf,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTracking(trackingNumber) {
    const creds = this.config?.apiCredentials;

    try {
      const response = await this.makeRequest('GET', '/webservice/track-packet', {
        api_key: creds?.apiKey,
        api_password: creds?.apiSecret,
        track_number: trackingNumber,
      });

      if (response.status === 1 || response.status === '1') {
        const packet = response.packet_details || response;
        const activities = response.tracking_details || response.activities || [];

        const events = activities.map((activity) => ({
          status: this.normalizeStatus(activity.status || activity.activity),
          statusCode: activity.status_code,
          description: activity.activity || activity.status,
          location: {
            city: activity.location || activity.city,
            facility: activity.station,
          },
          timestamp: new Date(activity.date_time || activity.activity_date),
          rawData: activity,
        }));

        return {
          success: true,
          trackingNumber,
          currentStatus: this.normalizeStatus(packet.packet_status || packet.status),
          events,
          deliveredAt: packet.delivery_date ? new Date(packet.delivery_date) : null,
          signedBy: packet.received_by,
          rawResponse: response,
        };
      } else {
        throw new Error(response.error || 'Tracking failed');
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
    const creds = this.config?.apiCredentials;

    try {
      const response = await this.makeRequest('POST', '/webservice/cancel-packet', {
        api_key: creds?.apiKey,
        api_password: creds?.apiSecret,
        track_number: trackingNumber,
      });

      return {
        success: response.status === 1 || response.status === '1',
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
    const creds = this.config?.apiCredentials;

    try {
      const response = await this.makeRequest('GET', '/webservice/get-tariff', {
        api_key: creds?.apiKey,
        origin_city: this.getCityId(origin.city),
        destination_city: this.getCityId(destination.city),
        weight: weight,
        shipment_type: options.isCOD ? 'COD' : 'Non-COD',
        collect_amount: options.codAmount || 0,
      });

      if (response.status === 1 || response.status === '1') {
        return {
          success: true,
          rate: parseFloat(response.charges || response.total_charges || 0),
          currency: 'PKR',
          breakdown: {
            freightCharges: parseFloat(response.freight_charges || 0),
            fuelSurcharge: parseFloat(response.fuel_surcharge || 0),
            codCharges: parseFloat(response.cod_charges || 0),
            gst: parseFloat(response.gst || 0),
          },
          estimatedDays: this.getEstimatedDays(origin.city, destination.city),
          serviceType: 'Standard',
        };
      }

      // Fallback
      return {
        success: true,
        rate: this.config?.defaultRate || 200,
        currency: 'PKR',
        estimatedDays: 3,
        serviceType: 'Standard',
      };
    } catch (error) {
      return {
        success: true,
        rate: this.config?.defaultRate || 200,
        currency: 'PKR',
        estimatedDays: 3,
        serviceType: 'Standard',
        error: error.message,
      };
    }
  }

  async schedulePickup(pickupData) {
    const creds = this.config?.apiCredentials;

    try {
      const response = await this.makeRequest('POST', '/webservice/request-pickup', {
        api_key: creds?.apiKey,
        api_password: creds?.apiSecret,
        pickup_date: this.formatDate(pickupData.date),
        pickup_time: pickupData.timeSlot || '10:00-14:00',
        pickup_address: pickupData.address,
        city_id: this.getCityId(pickupData.city),
        contact_name: pickupData.contactName,
        contact_phone: this.formatPhone(pickupData.phone),
        shipment_count: pickupData.shipmentCount || 1,
        instructions: pickupData.instructions || '',
      });

      if (response.status === 1 || response.status === '1') {
        return {
          success: true,
          pickupId: response.pickup_id,
          pickupDate: pickupData.date,
          pickupTime: pickupData.timeSlot,
        };
      } else {
        throw new Error(response.error || 'Pickup scheduling failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  normalizeStatus(leopardsStatus) {
    const statusMap = {
      booked: 'pending',
      'packet booked': 'pending',
      'arrived at station': 'picked_up',
      'dispatched from station': 'in_transit',
      'in transit': 'in_transit',
      'arrived at destination': 'in_transit',
      'out for delivery': 'out_for_delivery',
      ofd: 'out_for_delivery',
      delivered: 'delivered',
      'delivery failed': 'attempted_delivery',
      'returned to shipper': 'returned',
      rts: 'returned',
      cancelled: 'cancelled',
    };

    const normalized = leopardsStatus?.toLowerCase()?.trim();
    return statusMap[normalized] || 'in_transit';
  }

  parseWebhook(payload) {
    return {
      trackingNumber: payload.track_number || payload.cn_number,
      status: this.normalizeStatus(payload.status),
      events: [
        {
          status: this.normalizeStatus(payload.status),
          description: payload.activity || payload.status,
          location: { city: payload.location || payload.city },
          timestamp: new Date(payload.date_time || Date.now()),
        },
      ],
      rawData: payload,
    };
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

  // Leopards uses city IDs - this is a helper mapping
  getCityId(cityName) {
    const cityMap = {
      karachi: '1',
      lahore: '2',
      islamabad: '3',
      rawalpindi: '4',
      faisalabad: '5',
      multan: '6',
      peshawar: '7',
      quetta: '8',
      sialkot: '9',
      gujranwala: '10',
      hyderabad: '11',
    };

    return cityMap[cityName?.toLowerCase()] || cityName;
  }
}

module.exports = LeopardsAdapter;
