const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const seoController = require('../controllers/seoController');

// ==================== PUBLIC ROUTES ====================

// Get SEO meta by slug
router.get('/slug/:slug', seoController.getSeoBySlug);

// Check if slug is available
router.get('/check-slug', seoController.checkSlug);

// ==================== ADMIN ROUTES (must be before generic /:type/:id) ====================

// SEO Audit
router.get(
  '/admin/audit',
  protect,
  authorize('admin'),
  seoController.getSeoAudit
);

// Get all SEO metas
router.get(
  '/admin/metas',
  protect,
  authorize('admin'),
  seoController.getAllSeoMetas
);

// Recalculate SEO scores
router.post(
  '/admin/recalculate-scores',
  protect,
  authorize('admin'),
  seoController.recalculateScores
);

// ==================== REDIRECT ROUTES ====================

// Get all redirects
router.get(
  '/admin/redirects',
  protect,
  authorize('admin'),
  seoController.getRedirects
);

// Get redirect statistics
router.get(
  '/admin/redirects/stats',
  protect,
  authorize('admin'),
  seoController.getRedirectStats
);

// Create redirect
router.post(
  '/admin/redirects',
  protect,
  authorize('admin'),
  seoController.createRedirect
);

// Fix redirect chains
router.post(
  '/admin/redirects/fix-chains',
  protect,
  authorize('admin'),
  seoController.fixRedirectChains
);

// Import redirects (bulk)
router.post(
  '/admin/redirects/import',
  protect,
  authorize('admin'),
  seoController.importRedirects
);

// Update redirect
router.put(
  '/admin/redirects/:id',
  protect,
  authorize('admin'),
  seoController.updateRedirect
);

// Delete redirect
router.delete(
  '/admin/redirects/:id',
  protect,
  authorize('admin'),
  seoController.deleteRedirect
);

// ==================== SITEMAP ROUTES ====================

// Get sitemap configurations
router.get(
  '/admin/sitemap/config',
  protect,
  authorize('admin'),
  seoController.getSitemapConfig
);

// Update sitemap configuration
router.put(
  '/admin/sitemap/config/:entityType',
  protect,
  authorize('admin'),
  seoController.updateSitemapConfig
);

// Get sitemap generation stats
router.get(
  '/admin/sitemap/stats',
  protect,
  authorize('admin'),
  seoController.getSitemapStats
);

// Trigger sitemap regeneration
router.post(
  '/admin/sitemap/generate',
  protect,
  authorize('admin'),
  seoController.triggerSitemapGeneration
);

// ==================== VENDOR/ADMIN ROUTES ====================

// Generate unique slug
router.post(
  '/generate-slug',
  protect,
  authorize('vendor', 'admin'),
  seoController.generateSlug
);

// ==================== GENERIC ENTITY ROUTES (must be last) ====================

// Get SEO meta for entity
router.get('/:type/:id', seoController.getSeoForEntity);

// Update SEO meta for entity (vendor can update their own products)
router.put(
  '/:type/:id',
  protect,
  authorize('vendor', 'admin'),
  seoController.updateSeo
);

module.exports = router;
