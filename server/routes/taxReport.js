const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVendorTaxReports,
  getTaxReportDetails,
  generateTaxReport,
  downloadTaxReport,
  getTaxReportSummary,
  adminGetAllTaxReports,
  batchGenerateTaxReports,
} = require('../controllers/taxReportController');

// Vendor routes
router.get('/vendor/tax-reports', protect, authorize('vendor'), getVendorTaxReports);
router.get('/vendor/tax-reports/summary', protect, authorize('vendor'), getTaxReportSummary);
router.post('/vendor/tax-reports/generate', protect, authorize('vendor'), generateTaxReport);
router.get('/vendor/tax-reports/:id', protect, authorize('vendor'), getTaxReportDetails);
router.get('/vendor/tax-reports/:id/download', protect, authorize('vendor'), downloadTaxReport);

// Admin routes
router.get('/admin/tax-reports', protect, authorize('admin'), adminGetAllTaxReports);
router.post('/admin/tax-reports/batch-generate', protect, authorize('admin'), batchGenerateTaxReports);

module.exports = router;
