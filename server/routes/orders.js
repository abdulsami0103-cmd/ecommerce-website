const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const {
  createOrder,
  getMyOrders,
  getOrder,
  updateItemStatus,
  updatePaymentStatus,
} = require('../controllers/orderController');

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
];

router.use(protect); // All routes require authentication

router.route('/').post(orderValidation, validate, createOrder).get(getMyOrders);

router.get('/:id', getOrder);

// Payment update route
router.put('/:id/payment', updatePaymentStatus);

// Vendor routes
router.put(
  '/:orderId/items/:itemId/status',
  authorize('vendor'),
  updateItemStatus
);

module.exports = router;
