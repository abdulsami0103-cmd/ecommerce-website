const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVerificationStatus,
  updateBusinessProfile,
  uploadDocument,
  completeDocumentsStep,
  updateBankDetails,
  getPendingVerifications,
  verifyVendor,
  reviewDocument,
} = require('../controllers/vendorVerificationController');

// Vendor routes
router.get('/status', protect, authorize('vendor'), getVerificationStatus);
router.put('/business-profile', protect, authorize('vendor'), updateBusinessProfile);
router.post('/documents', protect, authorize('vendor'), uploadDocument);
router.post('/documents/complete', protect, authorize('vendor'), completeDocumentsStep);
router.put('/bank-details', protect, authorize('vendor'), updateBankDetails);

// Admin routes
router.get('/admin/pending', protect, authorize('admin'), getPendingVerifications);
router.patch('/admin/:id/verify', protect, authorize('admin'), verifyVendor);
router.patch('/admin/document/:id/review', protect, authorize('admin'), reviewDocument);

module.exports = router;
