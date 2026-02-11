const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRMARequest,
  getCustomerRMAs,
  getRMADetails,
  addMessage,
  markReturnShipped,
  getVendorRMAs,
  vendorRespond,
  markReturnReceived,
  adminGetAllRMAs,
  escalateRMA,
  adminResolve,
} = require('../controllers/rmaController');

// Customer routes
router.post('/rma', protect, createRMARequest);
router.get('/rma', protect, getCustomerRMAs);
router.get('/rma/:id', protect, getRMADetails);
router.post('/rma/:id/messages', protect, addMessage);
router.put('/rma/:id/return-shipped', protect, markReturnShipped);
router.put('/rma/:id/escalate', protect, escalateRMA);

// Vendor routes
router.get('/vendor/rma', protect, authorize('vendor'), getVendorRMAs);
router.put('/vendor/rma/:id/respond', protect, authorize('vendor'), vendorRespond);
router.put('/vendor/rma/:id/received', protect, authorize('vendor'), markReturnReceived);

// Admin routes
router.get('/admin/rma', protect, authorize('admin'), adminGetAllRMAs);
router.put('/admin/rma/:id/resolve', protect, authorize('admin'), adminResolve);

module.exports = router;
