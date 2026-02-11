const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const {
  registerVendor,
  getVendors,
  getVendorBySlug,
  updateVendorProfile,
  getDashboard,
  getMyVendorProfile,
} = require('../controllers/vendorController');

const { getVendorOrders } = require('../controllers/orderController');

const {
  createStripeAccount,
  requestPayout,
  getPayoutHistory,
} = require('../controllers/paymentController');

const {
  getVendorAlerts,
  getUnreadAlertCount,
  acknowledgeAlert,
  getLowStockProducts,
  adjustInventory,
  getProductInventoryLogs,
  updateInventorySettings,
} = require('../controllers/inventoryController');

const {
  downloadTemplate,
  uploadImportFile,
  getImportJobStatus,
  confirmImport,
  cancelImport,
  getImportHistory,
  requestExport,
  getExportJobStatus,
  getExportHistory,
} = require('../controllers/importExportController');

// Validation rules
const registerValidation = [
  body('storeName')
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 100 })
    .withMessage('Store name cannot exceed 100 characters'),
];

// Public routes
router.get('/', getVendors);
router.get('/:slug', getVendorBySlug);

// Protected routes
router.post('/register', protect, registerValidation, validate, registerVendor);
router.get('/me/profile', protect, authorize('vendor'), getMyVendorProfile);
router.put('/profile', protect, authorize('vendor'), updateVendorProfile);
router.get('/me/dashboard', protect, authorize('vendor'), getDashboard);
router.get('/me/orders', protect, authorize('vendor'), getVendorOrders);

// Payment routes
router.post('/stripe-connect', protect, authorize('vendor'), createStripeAccount);
router.post('/payout', protect, authorize('vendor'), requestPayout);
router.get('/me/payouts', protect, authorize('vendor'), getPayoutHistory);

// Inventory alerts routes
router.get('/inventory/alerts', protect, authorize('vendor'), getVendorAlerts);
router.get('/inventory/alerts/count', protect, authorize('vendor'), getUnreadAlertCount);
router.patch('/inventory/alerts/:id/acknowledge', protect, authorize('vendor'), acknowledgeAlert);
router.get('/inventory/low-stock', protect, authorize('vendor'), getLowStockProducts);

// Product inventory routes
router.post('/products/:id/inventory/adjust', protect, authorize('vendor'), adjustInventory);
router.get('/products/:id/inventory/logs', protect, authorize('vendor'), getProductInventoryLogs);
router.put('/products/:id/inventory', protect, authorize('vendor'), updateInventorySettings);

// Import routes
router.get('/import/template', protect, authorize('vendor'), downloadTemplate);
router.post('/import/upload', protect, authorize('vendor'), uploadImportFile);
router.get('/import/history', protect, authorize('vendor'), getImportHistory);
router.get('/import/:jobId', protect, authorize('vendor'), getImportJobStatus);
router.post('/import/:jobId/confirm', protect, authorize('vendor'), confirmImport);
router.delete('/import/:jobId', protect, authorize('vendor'), cancelImport);

// Export routes
router.post('/export', protect, authorize('vendor'), requestExport);
router.get('/export/history', protect, authorize('vendor'), getExportHistory);
router.get('/export/:jobId', protect, authorize('vendor'), getExportJobStatus);

module.exports = router;
