const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :id from parent
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const productImageController = require('../controllers/productImageController');

// Configure multer for memory storage (for sharp processing)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Middleware to get vendor from user (for vendor routes)
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
 * @route   GET /api/products/:id/images
 * @desc    Get all images for a product
 * @access  Public
 */
router.get('/', productImageController.getProductImages);

/**
 * @route   GET /api/products/:id/images/primary
 * @desc    Get primary image URL
 * @access  Public
 */
router.get('/primary', productImageController.getPrimaryImage);

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload product images (max 10)
 * @access  Vendor (owner)
 */
router.post(
  '/',
  protect,
  authorize('vendor'),
  getVendor,
  upload.array('images', 10),
  productImageController.uploadImages
);

/**
 * @route   PUT /api/products/:id/images/reorder
 * @desc    Reorder product images
 * @access  Vendor (owner)
 */
router.put(
  '/reorder',
  protect,
  authorize('vendor'),
  getVendor,
  productImageController.reorderImages
);

/**
 * @route   PUT /api/products/:id/images/:imageId
 * @desc    Update image (alt text, set primary)
 * @access  Vendor (owner)
 */
router.put(
  '/:imageId',
  protect,
  authorize('vendor'),
  getVendor,
  productImageController.updateImage
);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Delete a product image
 * @access  Vendor (owner)
 */
router.delete(
  '/:imageId',
  protect,
  authorize('vendor'),
  getVendor,
  productImageController.deleteImage
);

module.exports = router;
