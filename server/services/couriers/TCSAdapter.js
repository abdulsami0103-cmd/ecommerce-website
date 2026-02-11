const BaseCourierAdapter = require('./BaseCourierAdapter');

/**
 * TCS Express Courier Adapter
 * Documentation: https://www.tcsexpress.com/api-docs
 */

class TCSAdapter extends BaseCourierAdapter {
  constructor(config) {
    super(config);
    this.courierCode = 'tcs';
    this.courierName = 'TCS';
  }

  getAuthHeaders() {
    const creds = this.config?.apiCredentials;
    return {
      'X-IBM-Client-Id': creds?.apiKey || '',
      'X-IBM-Client-Secret': creds?.apiSecret || '',
    };
  }

  async createShipment(shipmentData) {
    const creds = this.config?.apiCredentials;

    const payload = {
      userName: creds?.username,
      password: creds?.password,
      costCenterCode: creds?.costCenterId,
      consigneeName: shipmentData.destination.name,
      consigneeAddress: shipmentData.destination.address,
      consigneeMobNo: this.formatPhone(shipmentData.destination.phone),
      consigneeEmail: shipmentData.destination.email || '',
      destinationCityName: shipmentData.destination.city,
      weight: shipmentData.package.weight,
      pieces: shipmentData.package.itemCount || 1,
      codAmount: shipmentData.isCOD ? shipmentData.codAmount : 0,
      customerReferenceNo: shipmentData.referenceNumber || '',
      services: shipmentData.isCOD ? 'COD' : 'Non-COD',
      productDetails: shipmentData.package.description || 'Package',
      fragile: shipmentData.package.fragile ? 'Yes' : 'No',
      remarks: shipmentData.specialInstructions || '',
      insuranceValue: shipmentData.package.declaredValue || 0,
    };

    try {
      const response = await this.makeRequest('POST', '/booking/book-consignment', payload);

      if (response.returnStatus?.status === 'SUCCESS') {
        return {
          success: true,
          trackingNumber: response.bookingReply?.consignmentNo,
          awbNumber: response.bookingReply?.consignmentNo,
          bookingId: response.bookingReply?.bookingId,
          labelUrl: null, // TCS provides label via separate endpoint
          estimatedDelivery: this.calculateEstimatedDelivery(
            shipmentData.origin.city,
            shipmentData.destination.city
          ),
          rawResponse: response,
        };
      } else {
        throw new Error(response.returnStatus?.statusMessage || 'Booking failed');
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
      const response = await this.makeRequest('GET', `/booking/get-label/${trackingNumber}`);

      return {
        success: true,
        labelUrl: response.labelUrl,
        labelData: response.labelPdf, // Base64 encoded PDF
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
        `/track/track-consignment?consignmentNo=${trackingNumber}`
      );

      if (response.returnStatus?.status === 'SUCCESS') {
        const trackingData = response.trackingDetail;
        const events = (trackingData?.trackingEvents || []).map((event) => ({
          status: this.normalizeStatus(event.activityStatus),
          statusCode: event.activityCode,
          description: event.activityDescription || event.activityStatus,
          location: {
            city: event.location || event.activityLocation,
            facility: event.facility,
          },
          timestamp: new Date(event.activityDate + ' ' + event.activityTime),
          rawData: event,
        }));

        return {
          success: true,
          trackingNumber,
          currentStatus: this.normalizeStatus(trackingData?.currentStatus),
          events,
          deliveredAt: trackingData?.deliveryDate
            ? new Date(trackingData.deliveryDate)
            : null,
          signedBy: trackingData?.receiverName,
          rawResponse: response,
        };
      } else {
        throw new Error(response.returnStatus?.statusMessage || 'Tracking failed');
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
      const response = await this.makeRequest('POST', '/booking/cancel-consignment', {
        consignmentNo: trackingNumber,
      });

      return {
        success: response.returnStatus?.status === 'SUCCESS',
        message: response.returnStatus?.statusMessage || 'Cancellation processed',
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
      const response = await this.makeRequest('GET', '/tariff/get-tariff', {
        originCity: origin.city,
        destinationCity: destination.city,
        weight: weight,
        service: options.serviceType || 'Overnight',
        cod: options.isCOD ? 'Yes' : 'No',
        codAmount: options.codAmount || 0,
      });

      if (response.returnStatus?.status === 'SUCCESS') {
        return {
          success: true,
          rate: response.tariffDetail?.totalCharges || 0,
          currency: 'PKR',
          breakdown: {
            freightCharges: response.tariffDetail?.freightCharges || 0,
            fuelSurcharge: response.tariffDetail?.fuelSurcharge || 0,
            codCharges: response.tariffDetail?.codCharges || 0,
            otherCharges: response.tariffDetail?.otherCharges || 0,
          },
          estimatedDays: this.getEstimatedDays(origin.city, destination.city),
          serviceType: options.serviceType || 'Overnight',
        };
      }

      // Fallback to config rate card
      const configRate = this.config?.calculateRate?.(origin.city, destination.city, weight);
      return {
        success: true,
        rate: configRate || this.config?.defaultRate || 250,
        currency: 'PKR',
        estimatedDays: this.getEstimatedDays(origin.city, destination.city),
        serviceType: 'Standard',
      };
    } catch (error) {
      // Fallback to default rate
      return {
        success: true,
        rate: this.config?.defaultRate || 250,
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
      const response = await this.makeRequest('POST', '/pickup/schedule-pickup', {
        userName: creds?.username,
        password: creds?.password,
        costCenterCode: creds?.costCenterId,
        pickupDate: this.formatDate(pickupData.date),
        pickupTime: pickupData.timeSlot || '10:00-14:00',
        pickupAddress: pickupData.address,
        pickupCity: pickupData.city,
        contactPerson: pickupData.contactName,
        contactNumber: this.formatPhone(pickupData.phone),
        noOfShipments: pickupData.shipmentCount || 1,
        remarks: pickupData.instructions || '',
      });

      if (response.returnStatus?.status === 'SUCCESS') {
        return {
          success: true,
          pickupId: response.pickupReply?.pickupId,
          pickupDate: pickupData.date,
          pickupTime: pickupData.timeSlot || '10:00-14:00',
        };
      } else {
        throw new Error(response.returnStatus?.statusMessage || 'Pickup scheduling failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  normalizeStatus(tcsStatus) {
    const statusMap = {
      booked: 'pending',
      'shipment booked': 'pending',
      'label printed': 'label_created',
      'picked up': 'picked_up',
      'in transit': 'in_transit',
      'arrived at hub': 'in_transit',
      'departed from hub': 'in_transit',
      'out for delivery': 'out_for_delivery',
      delivered: 'delivered',
      'delivery attempted': 'attempted_delivery',
      'returned to shipper': 'returned',
      rto: 'returned',
      cancelled: 'cancelled',
    };

    const normalized = tcsStatus?.toLowerCase()?.trim();
    return statusMap[normalized] || 'in_transit';
  }

  parseWebhook(payload) {
    return {
      trackingNumber: payload.consignmentNo,
      status: this.normalizeStatus(payload.status),
      events: [
        {
          status: this.normalizeStatus(payload.status),
          description: payload.statusDescription || payload.status,
          location: { city: payload.location },
          timestamp: new Date(payload.timestamp || Date.now()),
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
    // Same city - next day
    if (originCity?.toLowerCase() === destinationCity?.toLowerCase()) {
      return 1;
    }

    // Major cities - 1-2 days
    const majorCities = ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad', 'multan'];
    const isOriginMajor = majorCities.includes(originCity?.toLowerCase());
    const isDestMajor = majorCities.includes(destinationCity?.toLowerCase());

    if (isOriginMajor && isDestMajor) {
      return 2;
    }

    // Default - 3-5 days
    return 3;
  }
}

module.exports = TCSAdapter;
