const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers,
  updateUser,
  deleteUser,
  getVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getAllOrders,
  getAnalytics,
} = require('../controllers/adminController');

const {
  getModerationQueue,
  getModerationStats,
  moderateProduct,
  getProductModerationHistory,
  toggleTrustedStatus,
} = require('../controllers/moderationController');

const {
  getGlobalLowStockReport,
} = require('../controllers/inventoryController');

const {
  adminRequestExport,
  adminGetExportStatus,
} = require('../controllers/importExportController');

router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Vendor management
router.get('/vendors', getVendors);
router.put('/vendors/:id/approve', approveVendor);
router.put('/vendors/:id/reject', rejectVendor);
router.put('/vendors/:id/suspend', suspendVendor);
router.put('/vendors/:id/trusted-status', toggleTrustedStatus);

// Orders & Analytics
router.get('/orders', getAllOrders);
router.get('/analytics', getAnalytics);

// Product Moderation
router.get('/products/moderation-queue', getModerationQueue);
router.get('/products/moderation-queue/stats', getModerationStats);
router.patch('/products/:id/moderate', moderateProduct);
router.get('/products/:id/moderation-history', getProductModerationHistory);

// Inventory
router.get('/inventory/low-stock-report', getGlobalLowStockReport);

// Export
router.post('/products/export', adminRequestExport);
router.get('/products/export/:jobId', adminGetExportStatus);

module.exports = router;
