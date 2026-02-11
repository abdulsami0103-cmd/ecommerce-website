const mongoose = require('mongoose');

const urlRedirectSchema = new mongoose.Schema(
  {
    oldUrl: {
      type: String,
      required: [true, 'Old URL is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    newUrl: {
      type: String,
      required: [true, 'New URL is required'],
      trim: true,
    },
    redirectType: {
      type: Number,
      enum: [301, 302, 307, 308],
      default: 301,
    },
    hitCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
    },
    reason: {
      type: String,
      enum: ['slug_change', 'url_restructure', 'manual', 'seo_optimization', 'deleted_content'],
      default: 'manual',
    },
    description: {
      type: String,
      maxlength: 500,
    },
    // Reference to related entity
    entityType: {
      type: String,
      enum: ['product', 'category', 'vendor', 'page', null],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Management
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    // Analytics
    referrers: [{
      url: String,
      count: Number,
      lastSeen: Date,
    }],
    dailyHits: [{
      date: Date,
      count: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
urlRedirectSchema.index({ oldUrl: 1, isActive: 1 });
urlRedirectSchema.index({ entityType: 1, entityId: 1 });
urlRedirectSchema.index({ createdAt: -1 });
urlRedirectSchema.index({ hitCount: -1 });

// Pre-save: normalize URLs
urlRedirectSchema.pre('save', function(next) {
  // Remove trailing slashes and normalize
  this.oldUrl = this.oldUrl.replace(/\/+$/, '').toLowerCase();
  this.newUrl = this.newUrl.replace(/\/+$/, '');
  next();
});

/**
 * Find redirect for URL
 */
urlRedirectSchema.statics.findRedirect = async function(url) {
  const normalizedUrl = url.replace(/\/+$/, '').toLowerCase();

  const redirect = await this.findOne({
    oldUrl: normalizedUrl,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  return redirect;
};

/**
 * Record a redirect hit
 */
urlRedirectSchema.methods.recordHit = async function(referrer = null) {
  this.hitCount += 1;
  this.lastAccessedAt = new Date();

  // Update daily hits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyIndex = this.dailyHits.findIndex(
    d => d.date.getTime() === today.getTime()
  );

  if (dailyIndex >= 0) {
    this.dailyHits[dailyIndex].count += 1;
  } else {
    this.dailyHits.push({ date: today, count: 1 });
    // Keep only last 90 days
    if (this.dailyHits.length > 90) {
      this.dailyHits = this.dailyHits.slice(-90);
    }
  }

  // Track referrer
  if (referrer) {
    const refIndex = this.referrers.findIndex(r => r.url === referrer);
    if (refIndex >= 0) {
      this.referrers[refIndex].count += 1;
      this.referrers[refIndex].lastSeen = new Date();
    } else {
      this.referrers.push({ url: referrer, count: 1, lastSeen: new Date() });
      // Keep only top 50 referrers
      if (this.referrers.length > 50) {
        this.referrers.sort((a, b) => b.count - a.count);
        this.referrers = this.referrers.slice(0, 50);
      }
    }
  }

  await this.save();
};

/**
 * Create redirect on slug change
 */
urlRedirectSchema.statics.createOnSlugChange = async function(
  oldSlug,
  newSlug,
  entityType,
  entityId,
  userId = null
) {
  // Check if there's already a redirect from oldSlug
  const existing = await this.findOne({ oldUrl: oldSlug });

  if (existing) {
    // Update existing redirect to point to new URL
    existing.newUrl = `/${newSlug}`;
    existing.reason = 'slug_change';
    await existing.save();
    return existing;
  }

  // Create new redirect
  const redirect = await this.create({
    oldUrl: `/${oldSlug}`,
    newUrl: `/${newSlug}`,
    redirectType: 301,
    reason: 'slug_change',
    entityType,
    entityId,
    createdBy: userId,
  });

  return redirect;
};

/**
 * Check for redirect chains (A -> B -> C should become A -> C)
 */
urlRedirectSchema.statics.resolveChain = async function(url, maxDepth = 5) {
  const visited = new Set();
  let currentUrl = url;
  let depth = 0;

  while (depth < maxDepth) {
    if (visited.has(currentUrl)) {
      // Circular redirect detected
      return { url: currentUrl, isCircular: true };
    }

    visited.add(currentUrl);
    const redirect = await this.findRedirect(currentUrl);

    if (!redirect) {
      return { url: currentUrl, isCircular: false, depth };
    }

    currentUrl = redirect.newUrl;
    depth++;
  }

  return { url: currentUrl, isCircular: false, depth };
};

/**
 * Fix redirect chains by pointing all intermediate redirects to final URL
 */
urlRedirectSchema.statics.fixChains = async function() {
  const redirects = await this.find({ isActive: true });
  let fixed = 0;

  for (const redirect of redirects) {
    const resolved = await this.resolveChain(redirect.oldUrl);

    if (resolved.depth > 1 && !resolved.isCircular) {
      redirect.newUrl = resolved.url;
      await redirect.save();
      fixed++;
    }
  }

  return fixed;
};

/**
 * Bulk create redirects
 */
urlRedirectSchema.statics.bulkCreate = async function(redirects, userId = null) {
  const docs = redirects.map(r => ({
    oldUrl: r.oldUrl,
    newUrl: r.newUrl,
    redirectType: r.redirectType || 301,
    reason: r.reason || 'manual',
    description: r.description,
    createdBy: userId,
    isActive: true,
  }));

  return this.insertMany(docs, { ordered: false });
};

/**
 * Get redirect statistics
 */
urlRedirectSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: ['$isActive', 1, 0] } },
              totalHits: { $sum: '$hitCount' },
            },
          },
        ],
        byType: [
          {
            $group: {
              _id: '$redirectType',
              count: { $sum: 1 },
            },
          },
        ],
        byReason: [
          {
            $group: {
              _id: '$reason',
              count: { $sum: 1 },
            },
          },
        ],
        topRedirects: [
          { $sort: { hitCount: -1 } },
          { $limit: 10 },
          {
            $project: {
              oldUrl: 1,
              newUrl: 1,
              hitCount: 1,
              lastAccessedAt: 1,
            },
          },
        ],
        recentlyAccessed: [
          { $match: { lastAccessedAt: { $exists: true } } },
          { $sort: { lastAccessedAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              oldUrl: 1,
              newUrl: 1,
              hitCount: 1,
              lastAccessedAt: 1,
            },
          },
        ],
      },
    },
  ]);

  return {
    ...stats[0].overview[0],
    byType: stats[0].byType,
    byReason: stats[0].byReason,
    topRedirects: stats[0].topRedirects,
    recentlyAccessed: stats[0].recentlyAccessed,
  };
};

/**
 * Delete inactive/old redirects
 */
urlRedirectSchema.statics.cleanup = async function(options = {}) {
  const {
    deleteInactive = false,
    deleteUnused = false,
    unusedDays = 365,
    deleteExpired = true,
  } = options;

  let deleted = 0;

  // Delete expired redirects
  if (deleteExpired) {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    deleted += result.deletedCount;
  }

  // Delete inactive redirects
  if (deleteInactive) {
    const result = await this.deleteMany({ isActive: false });
    deleted += result.deletedCount;
  }

  // Delete unused redirects
  if (deleteUnused) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - unusedDays);

    const result = await this.deleteMany({
      $or: [
        { lastAccessedAt: { $lt: cutoffDate } },
        { lastAccessedAt: { $exists: false }, createdAt: { $lt: cutoffDate } },
      ],
      hitCount: { $lt: 10 },
    });
    deleted += result.deletedCount;
  }

  return deleted;
};

const UrlRedirect = mongoose.model('UrlRedirect', urlRedirectSchema);

module.exports = UrlRedirect;
