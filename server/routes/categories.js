const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const {
  getCategoryAttributes,
  assignAttributeToCategory,
  updateCategoryAttribute,
  removeAttributeFromCategory,
  reorderCategoryAttributes,
} = require('../controllers/attributeController');

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
];

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin routes
router.post('/', protect, authorize('admin'), categoryValidation, validate, createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

// Category attributes routes (public for product form, write requires admin)
router.get('/:id/attributes', getCategoryAttributes);
router.post('/:id/attributes', protect, authorize('admin'), assignAttributeToCategory);
router.put('/:id/attributes/reorder', protect, authorize('admin'), reorderCategoryAttributes);
router.put('/:catId/attributes/:attrId', protect, authorize('admin'), updateCategoryAttribute);
router.delete('/:catId/attributes/:attrId', protect, authorize('admin'), removeAttributeFromCategory);

module.exports = router;
