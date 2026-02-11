const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Tax Zones
  getTaxZones,
  getTaxZone,
  createTaxZone,
  updateTaxZone,
  deleteTaxZone,
  // Tax Rates
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  // Category Overrides
  getCategoryOverrides,
  createCategoryOverride,
  updateCategoryOverride,
  deleteCategoryOverride,
  // Exemptions
  getExemptions,
  applyForExemption,
  verifyExemption,
  rejectExemption,
  // Tax Calculation
  calculateTax,
  getRatesForAddress,
  setupPakistanDefaults,
} = require('../controllers/taxController');

// ============ PUBLIC ROUTES ============

// Tax calculation (no auth required for cart preview)
router.post('/calculate', calculateTax);
router.get('/rates-for-address', getRatesForAddress);

// ============ VENDOR ROUTES ============

// Apply for exemption
router.post('/exemptions', protect, authorize('vendor'), applyForExemption);

// ============ ADMIN ROUTES ============

// All admin routes require admin role
const adminRouter = express.Router();
adminRouter.use(protect, authorize('admin'));

// Tax Zones
adminRouter.get('/zones', getTaxZones);
adminRouter.get('/zones/:id', getTaxZone);
adminRouter.post('/zones', createTaxZone);
adminRouter.put('/zones/:id', updateTaxZone);
adminRouter.delete('/zones/:id', deleteTaxZone);

// Tax Rates
adminRouter.get('/rates', getTaxRates);
adminRouter.post('/rates', createTaxRate);
adminRouter.put('/rates/:id', updateTaxRate);
adminRouter.delete('/rates/:id', deleteTaxRate);

// Category Overrides
adminRouter.get('/category-overrides', getCategoryOverrides);
adminRouter.post('/category-overrides', createCategoryOverride);
adminRouter.put('/category-overrides/:id', updateCategoryOverride);
adminRouter.delete('/category-overrides/:id', deleteCategoryOverride);

// Exemptions
adminRouter.get('/exemptions', getExemptions);
adminRouter.put('/exemptions/:id/verify', verifyExemption);
adminRouter.put('/exemptions/:id/reject', rejectExemption);

// Setup Pakistan defaults
adminRouter.post('/setup-pakistan', setupPakistanDefaults);

// Mount admin routes
router.use('/', adminRouter);

module.exports = router;
