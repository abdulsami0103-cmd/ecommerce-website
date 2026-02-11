const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const { uploadDigital } = require('../config/cloudinary');
const digitalAssetController = require('../controllers/digitalAssetController');

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
 * @route   GET /api/products/:id/digital-assets
 * @desc    Get all digital assets for a product
 * @access  Vendor (owner)
 */
router.get(
  '/',
  protect,
  authorize('vendor'),
  getVendor,
  digitalAssetController.getDigitalAssets
);

/**
 * @route   POST /api/products/:id/digital-assets
 * @desc    Upload digital asset
 * @access  Vendor (owner)
 */
router.post(
  '/',
  protect,
  authorize('vendor'),
  getVendor,
  uploadDigital.single('file'),
  digitalAssetController.uploadDigitalAsset
);

/**
 * @route   PUT /api/products/:id/digital-assets/:assetId
 * @desc    Update digital asset
 * @access  Vendor (owner)
 */
router.put(
  '/:assetId',
  protect,
  authorize('vendor'),
  getVendor,
  digitalAssetController.updateDigitalAsset
);

/**
 * @route   DELETE /api/products/:id/digital-assets/:assetId
 * @desc    Delete digital asset
 * @access  Vendor (owner)
 */
router.delete(
  '/:assetId',
  protect,
  authorize('vendor'),
  getVendor,
  digitalAssetController.deleteDigitalAsset
);

/**
 * @route   POST /api/products/:id/digital-assets/:assetId/license-keys
 * @desc    Bulk upload license keys
 * @access  Vendor (owner)
 */
router.post(
  '/:assetId/license-keys',
  protect,
  authorize('vendor'),
  getVendor,
  digitalAssetController.uploadLicenseKeys
);

module.exports = router;
