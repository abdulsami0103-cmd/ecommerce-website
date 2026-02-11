const SeoMeta = require('../models/SeoMeta');
const UrlRedirect = require('../models/UrlRedirect');
const seoService = require('../services/seoService');

/**
 * Middleware to handle URL redirects
 * Should be used early in the middleware stack
 */
const handleRedirects = async (req, res, next) => {
  try {
    // Only check for GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Skip static files
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return next();
    }

    const redirect = await UrlRedirect.findRedirect(req.path);

    if (redirect) {
      // Record hit asynchronously
      setImmediate(() => {
        redirect.recordHit(req.get('Referer')).catch(err => {
          console.error('[SeoMiddleware] Failed to record redirect hit:', err);
        });
      });

      // Perform redirect
      return res.redirect(redirect.redirectType, redirect.newUrl);
    }

    next();
  } catch (error) {
    console.error('[SeoMiddleware] Redirect check error:', error);
    next();
  }
};

/**
 * Middleware to inject SEO meta into response
 * For server-side rendering support
 */
const injectSeoMeta = async (req, res, next) => {
  try {
    // Only for GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Get slug from path
    const slug = req.path.replace(/^\//, '').replace(/\/$/, '');

    if (!slug) {
      return next();
    }

    const languageCode = req.query.lang || req.acceptsLanguages('en', 'ur', 'ar') || 'en';
    const seoMeta = await SeoMeta.findBySlug(slug, languageCode);

    if (seoMeta) {
      req.seoMeta = seoMeta;
    }

    next();
  } catch (error) {
    console.error('[SeoMiddleware] Inject SEO meta error:', error);
    next();
  }
};

/**
 * Auto-create SEO meta after entity creation
 * Wrap this around controller responses
 */
const autoCreateSeoMeta = (entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async function(data) {
      // Only process successful create operations
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        req.method === 'POST' &&
        data?.data?._id
      ) {
        setImmediate(async () => {
          try {
            const entity = data.data;
            await seoService.findOrCreateMeta(
              entityType,
              entity._id,
              entity,
              'en'
            );
          } catch (error) {
            console.error(`[SeoMiddleware] Auto-create SEO meta error for ${entityType}:`, error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Create redirect on slug change
 * Wrap this around update operations
 */
const trackSlugChange = (entityType, getOldSlug) => {
  return async (req, res, next) => {
    // Only for update operations
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
      return next();
    }

    // Get old slug if function provided
    let oldSlug = null;
    if (getOldSlug && req.params.id) {
      try {
        oldSlug = await getOldSlug(req.params.id);
      } catch (error) {
        console.error('[SeoMiddleware] Failed to get old slug:', error);
      }
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async function(data) {
      // Check for successful update with slug change
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        data?.data &&
        oldSlug &&
        data.data.slug &&
        oldSlug !== data.data.slug
      ) {
        setImmediate(async () => {
          try {
            await seoService.createRedirectOnSlugChange(
              oldSlug,
              data.data.slug,
              entityType,
              data.data._id,
              req.user?._id
            );

            // Also update SEO meta slug
            await SeoMeta.findOneAndUpdate(
              { entityType, entityId: data.data._id },
              { $set: { slug: data.data.slug } }
            );
          } catch (error) {
            console.error(`[SeoMiddleware] Track slug change error:`, error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Delete SEO meta when entity is deleted
 */
const deleteSeoMeta = (entityType) => {
  return async (req, res, next) => {
    // Only for DELETE operations
    if (req.method !== 'DELETE') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async function(data) {
      // Delete SEO meta after successful deletion
      if (res.statusCode >= 200 && res.statusCode < 300 && req.params.id) {
        setImmediate(async () => {
          try {
            // Get SEO meta before deleting
            const seoMeta = await SeoMeta.findOne({
              entityType,
              entityId: req.params.id,
            });

            if (seoMeta) {
              // Create redirect to appropriate fallback page
              const fallbackMap = {
                product: '/products',
                category: '/products',
                vendor: '/vendors',
                page: '/',
              };

              await UrlRedirect.create({
                oldUrl: `/${seoMeta.slug}`,
                newUrl: fallbackMap[entityType] || '/',
                redirectType: 301,
                reason: 'deleted_content',
                entityType,
                entityId: req.params.id,
                createdBy: req.user?._id,
              });

              // Delete SEO meta
              await SeoMeta.deleteMany({
                entityType,
                entityId: req.params.id,
              });
            }
          } catch (error) {
            console.error(`[SeoMiddleware] Delete SEO meta error:`, error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Validate and sanitize SEO input
 */
const validateSeoInput = (req, res, next) => {
  const body = req.body;

  // Sanitize meta title
  if (body.metaTitle) {
    body.metaTitle = body.metaTitle.trim().substring(0, 70);
  }

  // Sanitize meta description
  if (body.metaDescription) {
    body.metaDescription = body.metaDescription.trim().substring(0, 160);
  }

  // Sanitize slug
  if (body.slug) {
    body.slug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Validate robots directive
  const validDirectives = ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'];
  if (body.robotsDirective && !validDirectives.includes(body.robotsDirective)) {
    body.robotsDirective = 'index,follow';
  }

  // Validate sitemap priority
  if (body.sitemapPriority !== undefined) {
    body.sitemapPriority = Math.min(1, Math.max(0, parseFloat(body.sitemapPriority) || 0.5));
  }

  next();
};

module.exports = {
  handleRedirects,
  injectSeoMeta,
  autoCreateSeoMeta,
  trackSlugChange,
  deleteSeoMeta,
  validateSeoInput,
};
