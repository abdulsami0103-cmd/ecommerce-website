const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const localizationController = require('../controllers/localizationController');

// ==================== PUBLIC ROUTES ====================

// Get full localization init data (languages + currencies + strings)
router.get('/init', localizationController.getLocalizationInit);

// Get all active languages
router.get('/languages', localizationController.getLanguages);

// Get UI strings for a language
router.get('/strings/:lang', localizationController.getUIStrings);

// Get all active currencies
router.get('/currencies', localizationController.getCurrencies);

// Convert price between currencies
router.get('/currencies/convert', localizationController.convertPrice);

// Detect user's preferred currency
router.get('/currencies/detect', localizationController.detectCurrency);

// Get entity translations
router.get('/translations/:type/:id', localizationController.getEntityTranslations);

// ==================== VENDOR/ADMIN ROUTES ====================

// Update entity translations
router.put(
  '/translations/:type/:id',
  protect,
  authorize('vendor', 'admin'),
  localizationController.updateEntityTranslations
);

// ==================== ADMIN LANGUAGE ROUTES ====================

// Create language
router.post(
  '/admin/languages',
  protect,
  authorize('admin'),
  localizationController.adminCreateLanguage
);

// Update language
router.put(
  '/admin/languages/:id',
  protect,
  authorize('admin'),
  localizationController.adminUpdateLanguage
);

// Delete language
router.delete(
  '/admin/languages/:id',
  protect,
  authorize('admin'),
  localizationController.adminDeleteLanguage
);

// ==================== ADMIN UI STRINGS ROUTES ====================

// Get all UI strings
router.get(
  '/admin/ui-strings',
  protect,
  authorize('admin'),
  localizationController.adminGetUIStrings
);

// Update UI string
router.put(
  '/admin/ui-strings',
  protect,
  authorize('admin'),
  localizationController.adminUpdateUIString
);

// Import UI strings
router.post(
  '/admin/ui-strings/import',
  protect,
  authorize('admin'),
  localizationController.adminImportUIStrings
);

// Export UI strings
router.get(
  '/admin/ui-strings/export',
  protect,
  authorize('admin'),
  localizationController.adminExportUIStrings
);

// Get translation stats
router.get(
  '/admin/ui-strings/stats',
  protect,
  authorize('admin'),
  localizationController.adminGetTranslationStats
);

// ==================== ADMIN CURRENCY ROUTES ====================

// Create currency
router.post(
  '/admin/currencies',
  protect,
  authorize('admin'),
  localizationController.adminCreateCurrency
);

// Update currency
router.put(
  '/admin/currencies/:id',
  protect,
  authorize('admin'),
  localizationController.adminUpdateCurrency
);

// Update exchange rate
router.put(
  '/admin/currencies/:code/rate',
  protect,
  authorize('admin'),
  localizationController.adminUpdateRate
);

// Fetch latest exchange rates
router.post(
  '/admin/currencies/fetch-rates',
  protect,
  authorize('admin'),
  localizationController.adminFetchRates
);

// Get rate history
router.get(
  '/admin/currencies/:code/history',
  protect,
  authorize('admin'),
  localizationController.adminGetRateHistory
);

// Delete currency
router.delete(
  '/admin/currencies/:id',
  protect,
  authorize('admin'),
  localizationController.adminDeleteCurrency
);

module.exports = router;
