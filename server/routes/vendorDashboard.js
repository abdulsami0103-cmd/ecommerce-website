const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const vendorDashboardController = require('../controllers/vendorDashboardController');

// All routes require authentication and vendor role
router.use(protect);
router.use(authorize('vendor'));

// Middleware to get vendor from user
router.use(async (req, res, next) => {
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
});

/**
 * @route   GET /api/vendor/dashboard/summary
 * @desc    Get dashboard summary with all "at a glance" stats
 * @access  Vendor
 */
router.get('/summary', vendorDashboardController.getSummary);

/**
 * @route   GET /api/vendor/dashboard/sales
 * @desc    Get sales data with chart points
 * @query   range (7d|30d|90d|custom), startDate, endDate
 * @access  Vendor
 */
router.get('/sales', vendorDashboardController.getSales);

/**
 * @route   GET /api/vendor/dashboard/demographics
 * @desc    Get traffic sources, geographic, and device data
 * @query   range (7d|30d|90d|custom)
 * @access  Vendor
 */
router.get('/demographics', vendorDashboardController.getDemographics);

/**
 * @route   GET /api/vendor/dashboard/top-products
 * @desc    Get top selling products
 * @query   limit (default 10), sortBy (revenue|quantity), range
 * @access  Vendor
 */
router.get('/top-products', vendorDashboardController.getTopProducts);

/**
 * @route   GET /api/vendor/dashboard/export
 * @desc    Export sales data as CSV or JSON
 * @query   range, startDate, endDate, format (csv|json)
 * @access  Vendor
 */
router.get('/export', vendorDashboardController.exportSalesData);

module.exports = router;
