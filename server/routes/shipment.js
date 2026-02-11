const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createShipment,
  getShipmentDetails,
  getShipmentTracking,
  trackByNumber,
  getShippingLabel,
  compareShippingRates,
  updateShipmentStatus,
  handleCourierWebhook,
  getCourierConfigs,
  updateCourierConfig,
  createCourierConfig,
  getVendorShipments,
  getAllShipments,
  getShipmentStats,
} = require('../controllers/shipmentController');

// Public tracking route
router.get('/track/:trackingNumber', trackByNumber);

// Courier webhook (public but verified by signature)
router.post('/webhooks/courier/:code', handleCourierWebhook);

// Protected routes
router.get('/shipments/:id', protect, getShipmentDetails);
router.get('/shipments/:id/tracking', protect, getShipmentTracking);

// Vendor routes
router.post('/shipments', protect, authorize('vendor'), createShipment);
router.get('/shipments/:id/label', protect, authorize('vendor'), getShippingLabel);
router.put('/shipments/:id/status', protect, authorize('vendor'), updateShipmentStatus);
router.post('/shipments/rates', protect, authorize('vendor'), compareShippingRates);
router.get('/vendor/shipments', protect, authorize('vendor'), getVendorShipments);

// Admin routes
router.get('/admin/shipments', protect, authorize('admin'), getAllShipments);
router.get('/admin/shipments/stats', protect, authorize('admin'), getShipmentStats);
router.get('/admin/shipments/:id', protect, authorize('admin'), getShipmentDetails);
router.get('/admin/couriers', protect, authorize('admin'), getCourierConfigs);
router.post('/admin/couriers', protect, authorize('admin'), createCourierConfig);
router.put('/admin/couriers/:id', protect, authorize('admin'), updateCourierConfig);

module.exports = router;
