const mongoose = require('mongoose');

const sitemapConfigSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      unique: true,
      enum: ['products', 'categories', 'vendors', 'pages', 'static'],
    },
    changefreq: {
      type: String,
      enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
      default: 'weekly',
    },
    priority: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // Generation stats
    lastGenerated: {
      type: Date,
    },
    urlCount: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number, // bytes
      default: 0,
    },
    generationDuration: {
      type: Number, // milliseconds
      default: 0,
    },
    // Configuration options
    maxUrlsPerSitemap: {
      type: Number,
      default: 50000,
    },
    includeImages: {
      type: Boolean,
      default: true,
    },
    includeLastmod: {
      type: Boolean,
      default: true,
    },
    // Static URLs for this type
    staticUrls: [{
      url: {
        type: String,
        required: true,
      },
      changefreq: String,
      priority: Number,
      lastmod: Date,
    }],
    // Query options for dynamic content
    queryOptions: {
      // Filters to apply when fetching entities
      filters: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      // Fields to select
      select: {
        type: String,
        default: '_id slug updatedAt',
      },
      // Sort order
      sort: {
        type: String,
        default: '-updatedAt',
      },
    },
    // Error tracking
    lastError: {
      message: String,
      stack: String,
      occurredAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Get all enabled configs
 */
sitemapConfigSchema.statics.getEnabledConfigs = async function() {
  return this.find({ isEnabled: true }).sort({ entityType: 1 });
};

/**
 * Get config by entity type
 */
sitemapConfigSchema.statics.getByEntityType = async function(entityType) {
  let config = await this.findOne({ entityType });

  // Create default config if doesn't exist
  if (!config) {
    config = await this.createDefaultConfig(entityType);
  }

  return config;
};

/**
 * Create default config for entity type
 */
sitemapConfigSchema.statics.createDefaultConfig = async function(entityType) {
  const defaults = {
    products: {
      changefreq: 'daily',
      priority: 0.8,
      includeImages: true,
    },
    categories: {
      changefreq: 'weekly',
      priority: 0.7,
      includeImages: false,
    },
    vendors: {
      changefreq: 'weekly',
      priority: 0.6,
      includeImages: true,
    },
    pages: {
      changefreq: 'monthly',
      priority: 0.5,
      includeImages: false,
    },
    static: {
      changefreq: 'monthly',
      priority: 0.9,
      includeImages: false,
      staticUrls: [
        { url: '/', priority: 1.0, changefreq: 'daily' },
        { url: '/products', priority: 0.9, changefreq: 'daily' },
        { url: '/vendors', priority: 0.7, changefreq: 'weekly' },
        { url: '/become-vendor', priority: 0.5, changefreq: 'monthly' },
      ],
    },
  };

  const config = await this.create({
    entityType,
    ...defaults[entityType],
  });

  return config;
};

/**
 * Update generation stats
 */
sitemapConfigSchema.methods.updateGenerationStats = async function(stats) {
  this.lastGenerated = new Date();
  this.urlCount = stats.urlCount || this.urlCount;
  this.fileSize = stats.fileSize || this.fileSize;
  this.generationDuration = stats.duration || this.generationDuration;
  this.lastError = null;

  await this.save();
};

/**
 * Record generation error
 */
sitemapConfigSchema.methods.recordError = async function(error) {
  this.lastError = {
    message: error.message,
    stack: error.stack,
    occurredAt: new Date(),
  };

  await this.save();
};

/**
 * Initialize all default configs
 */
sitemapConfigSchema.statics.initializeDefaults = async function() {
  const entityTypes = ['products', 'categories', 'vendors', 'pages', 'static'];

  for (const entityType of entityTypes) {
    const existing = await this.findOne({ entityType });
    if (!existing) {
      await this.createDefaultConfig(entityType);
    }
  }
};

/**
 * Get sitemap generation stats
 */
sitemapConfigSchema.statics.getGenerationStats = async function() {
  const configs = await this.find().lean();

  const totalUrls = configs.reduce((sum, c) => sum + (c.urlCount || 0), 0);
  const totalSize = configs.reduce((sum, c) => sum + (c.fileSize || 0), 0);

  const lastGeneration = configs
    .filter(c => c.lastGenerated)
    .sort((a, b) => new Date(b.lastGenerated) - new Date(a.lastGenerated))[0];

  const errors = configs.filter(c => c.lastError);

  return {
    totalUrls,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    lastGenerated: lastGeneration?.lastGenerated,
    configs: configs.map(c => ({
      entityType: c.entityType,
      isEnabled: c.isEnabled,
      urlCount: c.urlCount,
      fileSize: c.fileSize,
      lastGenerated: c.lastGenerated,
      hasError: !!c.lastError,
      error: c.lastError?.message,
    })),
    errors: errors.map(c => ({
      entityType: c.entityType,
      error: c.lastError,
    })),
  };
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const SitemapConfig = mongoose.model('SitemapConfig', sitemapConfigSchema);

module.exports = SitemapConfig;
