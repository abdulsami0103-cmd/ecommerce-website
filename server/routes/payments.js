const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
} = require('../controllers/paymentController');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Webhook route (no auth, raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
