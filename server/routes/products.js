const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getMyProducts,
} = require('../controllers/productController');

const {
  getProductReviews,
  addReview,
} = require('../controllers/reviewController');

const {
  submitForReview,
} = require('../controllers/moderationController');

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price.amount')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/vendor/:vendorId', getVendorProducts);
router.get('/:slug', optionalAuth, getProductBySlug);

// Review routes
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, addReview);

// Vendor protected routes
router.get('/my/products', protect, authorize('vendor'), getMyProducts);
router.post('/', protect, authorize('vendor'), productValidation, validate, createProduct);
router.put('/:id', protect, authorize('vendor'), updateProduct);
router.delete('/:id', protect, authorize('vendor'), deleteProduct);
router.post('/:id/submit-for-review', protect, authorize('vendor'), submitForReview);

module.exports = router;
