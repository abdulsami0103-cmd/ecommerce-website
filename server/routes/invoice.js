const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCustomerInvoices,
  getInvoiceDetails,
  downloadInvoicePDF,
  sendInvoiceEmail,
  generateOrderInvoice,
  getVendorInvoices,
  generateVendorStatement,
  adminGetAllInvoices,
  getInvoiceTemplates,
  updateInvoiceTemplate,
  previewTemplate,
  initDefaultTemplates,
} = require('../controllers/invoiceController');

// Customer routes
router.get('/invoices', protect, getCustomerInvoices);
router.get('/invoices/:id', protect, getInvoiceDetails);
router.get('/invoices/:id/pdf', protect, downloadInvoicePDF);

// Vendor routes
router.get('/vendor/invoices', protect, authorize('vendor'), getVendorInvoices);
router.post('/vendor/invoices/statement', protect, authorize('vendor'), generateVendorStatement);

// Admin routes
router.post('/invoices/:id/send', protect, authorize('admin', 'vendor'), sendInvoiceEmail);
router.post('/invoices/generate/order/:orderId', protect, authorize('admin', 'vendor'), generateOrderInvoice);
router.get('/admin/invoices', protect, authorize('admin'), adminGetAllInvoices);
router.get('/admin/invoice-templates', protect, authorize('admin'), getInvoiceTemplates);
router.put('/admin/invoice-templates/:id', protect, authorize('admin'), updateInvoiceTemplate);
router.post('/admin/invoice-templates/preview', protect, authorize('admin'), previewTemplate);
router.post('/admin/invoice-templates/init', protect, authorize('admin'), initDefaultTemplates);

module.exports = router;
