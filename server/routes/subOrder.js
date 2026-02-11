const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVendorSubOrders,
  getSubOrderDetails,
  updateSubOrderStatus,
  getOrderSubOrders,
  getSubOrderStats,
  adminCancelSubOrder,
  createSubOrderShipment,
  getSubOrderShipments,
  getSubOrderShippingRates,
} = require('../controllers/subOrderController');

// Customer routes
router.get('/orders/:orderId/suborders', protect, getOrderSubOrders);

// Vendor routes
router.get('/vendor/suborders', protect, authorize('vendor'), getVendorSubOrders);
router.get('/vendor/suborders/stats', protect, authorize('vendor'), getSubOrderStats);
router.get('/vendor/suborders/:id', protect, authorize('vendor'), getSubOrderDetails);
router.put('/vendor/suborders/:id/status', protect, authorize('vendor'), updateSubOrderStatus);
router.get('/vendor/suborders/:id/shipments', protect, authorize('vendor'), getSubOrderShipments);
router.post('/vendor/suborders/:id/shipments', protect, authorize('vendor'), createSubOrderShipment);
router.post('/vendor/suborders/:id/rates', protect, authorize('vendor'), getSubOrderShippingRates);

// Admin routes
router.put('/admin/suborders/:id/cancel', protect, authorize('admin'), adminCancelSubOrder);

module.exports = router;
