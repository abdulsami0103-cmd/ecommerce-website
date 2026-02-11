const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const bulkOperationController = require('../controllers/bulkOperationController');

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

// All routes require vendor authentication
router.use(protect, authorize('vendor'), getVendor);

/**
 * @route   POST /api/vendors/bulk-operations
 * @desc    Create bulk operation
 * @access  Vendor
 */
router.post('/', bulkOperationController.createBulkOperation);

/**
 * @route   GET /api/vendors/bulk-operations
 * @desc    Get vendor's bulk operations
 * @access  Vendor
 */
router.get('/', bulkOperationController.getBulkOperations);

/**
 * @route   GET /api/vendors/bulk-operations/:id
 * @desc    Get single bulk operation
 * @access  Vendor
 */
router.get('/:id', bulkOperationController.getBulkOperation);

/**
 * @route   DELETE /api/vendors/bulk-operations/:id
 * @desc    Cancel bulk operation
 * @access  Vendor
 */
router.delete('/:id', bulkOperationController.cancelBulkOperation);

module.exports = router;
