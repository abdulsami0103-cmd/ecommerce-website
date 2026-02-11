const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTicket,
  getMyTickets,
  getTicket,
  addMessage,
  assignTicket,
  escalateTicket,
  resolveTicket,
  closeTicket,
  rateTicket,
  getVendorTickets,
  getAllTickets,
  getTicketStats,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/ticketController');

// Customer routes
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicket);
router.post('/tickets/:id/messages', protect, addMessage);
router.post('/tickets/:id/rate', protect, rateTicket);

// Vendor routes
router.get('/vendor/tickets', protect, authorize('vendor'), getVendorTickets);
router.put('/vendor/tickets/:id/escalate', protect, authorize('vendor'), escalateTicket);
router.put('/vendor/tickets/:id/resolve', protect, authorize('vendor'), resolveTicket);

// Admin routes
router.get('/admin/tickets', protect, authorize('admin'), getAllTickets);
router.get('/admin/tickets/stats', protect, authorize('admin'), getTicketStats);
router.put('/admin/tickets/:id/assign', protect, authorize('admin'), assignTicket);
router.put('/admin/tickets/:id/escalate', protect, authorize('admin'), escalateTicket);
router.put('/admin/tickets/:id/resolve', protect, authorize('admin'), resolveTicket);
router.put('/admin/tickets/:id/close', protect, authorize('admin'), closeTicket);

// Template routes (admin)
router.get('/admin/tickets/templates', protect, authorize('admin'), getTemplates);
router.post('/admin/tickets/templates', protect, authorize('admin'), createTemplate);
router.put('/admin/tickets/templates/:id', protect, authorize('admin'), updateTemplate);
router.delete('/admin/tickets/templates/:id', protect, authorize('admin'), deleteTemplate);

module.exports = router;
