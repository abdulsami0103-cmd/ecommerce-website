const Shipment = require('../models/Shipment');
const ShipmentTrackingEvent = require('../models/ShipmentTrackingEvent');
const SubOrder = require('../models/SubOrder');
const CourierConfig = require('../models/CourierConfig');
const Vendor = require('../models/Vendor');
const { getCourierAdapter, compareRates, trackAcrossCouriers } = require('../services/couriers');

/**
 * @desc    Create shipment for sub-order
 * @route   POST /api/shipments
 * @access  Private (Vendor)
 */
exports.createShipment = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const {
      subOrderId,
      courierCode,
      package: packageData,
      serviceType,
      specialInstructions,
      isCOD,
      codAmount,
    } = req.body;

    // Get sub-order
    const subOrder = await SubOrder.findOne({
      _id: subOrderId,
      vendor: vendor._id,
    }).populate('parentOrder');

    if (!subOrder) {
      return res.status(404).json({ message: 'Sub-order not found' });
    }

    if (subOrder.shipment) {
      return res.status(400).json({ message: 'Shipment already exists for this sub-order' });
    }

    // Get courier adapter
    const courierAdapter = await getCourierAdapter(courierCode);
    const courierConfig = await CourierConfig.findOne({ code: courierCode });

    // Prepare shipment data
    const shipmentData = {
      referenceNumber: subOrder.subOrderNumber,
      origin: {
        name: vendor.storeName || vendor.businessName,
        address: vendor.businessAddress?.street || vendor.address,
        city: vendor.businessAddress?.city || 'Karachi',
        phone: vendor.phone,
        email: vendor.owner?.email,
      },
      destination: {
        name: `${subOrder.shippingAddress.firstName} ${subOrder.shippingAddress.lastName}`,
        address: subOrder.shippingAddress.street,
        city: subOrder.shippingAddress.city,
        phone: subOrder.shippingAddress.phone,
        email: subOrder.customer?.email,
      },
      package: packageData || {
        weight: 0.5,
        itemCount: subOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        description: subOrder.items.map(i => i.name).join(', '),
        declaredValue: subOrder.total,
      },
      isCOD: isCOD || false,
      codAmount: codAmount || 0,
      specialInstructions,
    };

    // Create booking with courier
    const bookingResult = await courierAdapter.createShipment(shipmentData);

    if (!bookingResult.success) {
      return res.status(400).json({
        message: 'Failed to create shipment with courier',
        error: bookingResult.error,
      });
    }

    // Create shipment record
    const shipment = await Shipment.create({
      subOrder: subOrder._id,
      order: subOrder.parentOrder._id,
      vendor: vendor._id,
      courier: {
        name: courierConfig.name,
        code: courierCode,
        trackingNumber: bookingResult.trackingNumber,
        awbNumber: bookingResult.awbNumber,
        labelUrl: bookingResult.labelUrl,
        bookingId: bookingResult.bookingId,
        labelData: bookingResult.rawResponse,
      },
      status: bookingResult.labelUrl ? 'label_created' : 'pending',
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      package: shipmentData.package,
      estimatedDelivery: bookingResult.estimatedDelivery,
      isCOD: shipmentData.isCOD,
      codAmount: shipmentData.codAmount,
      shippingCost: subOrder.shippingCost,
      serviceType: serviceType || 'standard',
      specialInstructions,
    });

    // Update sub-order
    subOrder.shipment = shipment._id;
    subOrder.estimatedDelivery = bookingResult.estimatedDelivery;
    await subOrder.save();

    // Create initial tracking event
    await ShipmentTrackingEvent.create({
      shipment: shipment._id,
      status: 'pending',
      description: 'Shipment created',
      timestamp: new Date(),
      source: 'system',
    });

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
      trackingNumber: bookingResult.trackingNumber,
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get shipment details
 * @route   GET /api/shipments/:id
 * @access  Private
 */
exports.getShipmentDetails = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('subOrder', 'subOrderNumber status items total')
      .populate('vendor', 'storeName');

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get shipment tracking events
 * @route   GET /api/shipments/:id/tracking
 * @access  Public
 */
exports.getShipmentTracking = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const events = await ShipmentTrackingEvent.getTimeline(shipment._id);

    res.json({
      shipment: {
        trackingNumber: shipment.courier.trackingNumber,
        courier: shipment.courier.name,
        status: shipment.status,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
      },
      events,
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Track by tracking number (Public)
 * @route   GET /api/track/:trackingNumber
 * @access  Public
 */
exports.trackByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    // First check our database
    let shipment = await Shipment.findOne({
      'courier.trackingNumber': trackingNumber,
    })
      .populate('subOrder', 'subOrderNumber')
      .populate('vendor', 'storeName');

    if (shipment) {
      // Get tracking from our database
      const events = await ShipmentTrackingEvent.getTimeline(shipment._id);

      // Also fetch latest from courier API
      try {
        const adapter = await getCourierAdapter(shipment.courier.code);
        const liveTracking = await adapter.getTracking(trackingNumber);

        if (liveTracking.success && liveTracking.events.length > 0) {
          // Update shipment status
          if (liveTracking.currentStatus !== shipment.status) {
            await shipment.updateStatus(liveTracking.currentStatus);
          }

          // Add new events
          await ShipmentTrackingEvent.createFromCourierResponse(
            shipment._id,
            liveTracking.events,
            shipment.courier.code
          );
        }
      } catch (err) {
        // Continue with cached data
      }

      return res.json({
        found: true,
        shipment: {
          trackingNumber: shipment.courier.trackingNumber,
          courier: shipment.courier.name,
          status: shipment.status,
          origin: shipment.origin,
          destination: {
            city: shipment.destination.city,
            // Hide full address for privacy
          },
          estimatedDelivery: shipment.estimatedDelivery,
          actualDelivery: shipment.actualDelivery,
          orderNumber: shipment.subOrder?.subOrderNumber,
        },
        events,
      });
    }

    // Not in our database, try tracking across couriers
    const result = await trackAcrossCouriers(trackingNumber);

    if (result.success) {
      return res.json({
        found: true,
        shipment: {
          trackingNumber,
          courier: result.courierCode,
          status: result.currentStatus,
        },
        events: result.events,
      });
    }

    res.status(404).json({
      found: false,
      message: 'Tracking number not found',
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate/Download shipping label
 * @route   GET /api/shipments/:id/label
 * @access  Private (Vendor)
 */
exports.getShippingLabel = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      vendor: vendor?._id,
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // If label URL exists, return it
    if (shipment.courier.labelUrl) {
      return res.json({ labelUrl: shipment.courier.labelUrl });
    }

    // Generate label from courier
    const adapter = await getCourierAdapter(shipment.courier.code);
    const labelResult = await adapter.getLabel(shipment.courier.trackingNumber);

    if (labelResult.success) {
      shipment.courier.labelUrl = labelResult.labelUrl;
      await shipment.save();

      res.json({ labelUrl: labelResult.labelUrl, labelData: labelResult.labelData });
    } else {
      res.status(400).json({ message: 'Failed to generate label', error: labelResult.error });
    }
  } catch (error) {
    console.error('Error getting label:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Compare shipping rates
 * @route   POST /api/shipments/rates
 * @access  Private (Vendor)
 */
exports.compareShippingRates = async (req, res) => {
  try {
    const { origin, destination, weight, isCOD, codAmount } = req.body;

    const rates = await compareRates(origin, destination, weight, { isCOD, codAmount });

    res.json(rates);
  } catch (error) {
    console.error('Error comparing rates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update shipment status manually
 * @route   PUT /api/shipments/:id/status
 * @access  Private (Vendor)
 */
exports.updateShipmentStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    const { status, note, location } = req.body;

    const shipment = await Shipment.findOne({
      _id: req.params.id,
      vendor: vendor?._id,
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    await shipment.updateStatus(status, note);

    // Also update sub-order if needed
    if (['delivered', 'returned', 'failed'].includes(status)) {
      const subOrder = await SubOrder.findById(shipment.subOrder);
      if (subOrder) {
        if (status === 'delivered') {
          await subOrder.updateStatus('delivered', 'Shipment delivered', req.user._id);
        } else if (status === 'returned') {
          await subOrder.updateStatus('returned', 'Shipment returned', req.user._id);
        }
      }
    }

    res.json({ message: 'Status updated', shipment });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Handle courier webhook
 * @route   POST /api/webhooks/courier/:code
 * @access  Public (with signature verification)
 */
exports.handleCourierWebhook = async (req, res) => {
  try {
    const { code } = req.params;
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];

    const adapter = await getCourierAdapter(code);

    // Verify signature
    if (!adapter.verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Parse webhook
    const parsed = adapter.parseWebhook(req.body);

    // Find shipment
    const shipment = await Shipment.findOne({
      'courier.trackingNumber': parsed.trackingNumber,
    });

    if (shipment) {
      // Update status
      await shipment.updateStatus(parsed.status);

      // Add tracking events
      for (const event of parsed.events) {
        await ShipmentTrackingEvent.create({
          shipment: shipment._id,
          status: event.status,
          description: event.description,
          location: event.location,
          timestamp: event.timestamp,
          rawData: event.rawData || parsed.rawData,
          source: 'webhook',
        });
      }

      // Update sub-order if delivered
      if (parsed.status === 'delivered') {
        const subOrder = await SubOrder.findById(shipment.subOrder);
        if (subOrder) {
          await subOrder.updateStatus('delivered', 'Shipment delivered via webhook');
        }
      }
    }

    res.json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

/**
 * @desc    Get courier configurations (Admin)
 * @route   GET /api/admin/couriers
 * @access  Private (Admin)
 */
exports.getCourierConfigs = async (req, res) => {
  try {
    const couriers = await CourierConfig.find()
      .select('-apiCredentials.apiSecret -apiCredentials.password')
      .sort({ priority: -1 });

    res.json(couriers);
  } catch (error) {
    console.error('Error fetching courier configs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update courier configuration (Admin)
 * @route   PUT /api/admin/couriers/:id
 * @access  Private (Admin)
 */
exports.updateCourierConfig = async (req, res) => {
  try {
    const courier = await CourierConfig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-apiCredentials.apiSecret -apiCredentials.password');

    if (!courier) {
      return res.status(404).json({ message: 'Courier config not found' });
    }

    res.json(courier);
  } catch (error) {
    console.error('Error updating courier config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get vendor's shipments
 * @route   GET /api/vendor/shipments
 * @access  Private (Vendor)
 */
exports.getVendorShipments = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (status) {
      query.status = status;
    }

    const shipments = await Shipment.find(query)
      .populate('subOrder', 'subOrderNumber status total')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all shipments (Admin)
 * @route   GET /api/admin/shipments
 * @access  Private (Admin)
 */
exports.getAllShipments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, vendor } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (vendor) {
      query.vendor = vendor;
    }

    const shipments = await Shipment.find(query)
      .populate('subOrder', 'subOrderNumber status total parentOrder')
      .populate('vendor', 'storeName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching all shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get shipment statistics (Admin)
 * @route   GET /api/admin/shipments/stats
 * @access  Private (Admin)
 */
exports.getShipmentStats = async (req, res) => {
  try {
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsObj = {};
    stats.forEach((s) => {
      statsObj[s._id] = s.count;
    });

    res.json(statsObj);
  } catch (error) {
    console.error('Error fetching shipment stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create courier configuration (Admin)
 * @route   POST /api/admin/couriers
 * @access  Private (Admin)
 */
exports.createCourierConfig = async (req, res) => {
  try {
    const courier = await CourierConfig.create(req.body);
    res.status(201).json(courier);
  } catch (error) {
    console.error('Error creating courier config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
