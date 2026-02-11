const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const productVariantController = require('../controllers/productVariantController');

// Middleware to get vendor from user
const getVendor = async (req, res, next) => {
  try {
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id/variants
 * @desc    Get all variants for a product
 * @access  Public
 */
router.get('/', productVariantController.getVariants);

/**
 * @route   GET /api/products/:id/variants/inventory
 * @desc    Get total inventory across all variants
 * @access  Public
 */
router.get('/inventory', productVariantController.getTotalInventory);

/**
 * @route   GET /api/products/:id/variants/find
 * @desc    Find variant by option values
 * @access  Public
 */
router.get('/find', productVariantController.findVariantByOptions);

/**
 * @route   POST /api/products/:id/variants/generate
 * @desc    Generate variants from product options (cartesian product)
 * @access  Vendor (owner)
 */
router.post(
  '/generate',
  protect,
  authorize('vendor'),
  getVendor,
  productVariantController.generateVariants
);

/**
 * @route   PUT /api/products/:id/variants/bulk
 * @desc    Bulk update variants (price or stock)
 * @access  Vendor (owner)
 */
router.put(
  '/bulk',
  protect,
  authorize('vendor'),
  getVendor,
  productVariantController.bulkUpdateVariants
);

/**
 * @route   GET /api/products/:id/variants/:variantId
 * @desc    Get single variant
 * @access  Public
 */
router.get('/:variantId', productVariantController.getVariant);

/**
 * @route   PUT /api/products/:id/variants/:variantId
 * @desc    Update a single variant
 * @access  Vendor (owner)
 */
router.put(
  '/:variantId',
  protect,
  authorize('vendor'),
  getVendor,
  productVariantController.updateVariant
);

/**
 * @route   DELETE /api/products/:id/variants/:variantId
 * @desc    Delete a variant
 * @access  Vendor (owner)
 */
router.delete(
  '/:variantId',
  protect,
  authorize('vendor'),
  getVendor,
  productVariantController.deleteVariant
);

/**
 * @route   DELETE /api/products/:id/variants
 * @desc    Delete all variants for a product
 * @access  Vendor (owner)
 */
router.delete(
  '/',
  protect,
  authorize('vendor'),
  getVendor,
  productVariantController.deleteAllVariants
);

module.exports = router;
