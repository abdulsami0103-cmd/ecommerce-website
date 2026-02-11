const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const SitemapConfig = require('../models/SitemapConfig');
const SeoMeta = require('../models/SeoMeta');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');

const gzip = promisify(zlib.gzip);

const SITEMAP_DIR = path.join(__dirname, '../../public/sitemaps');
const BASE_URL = process.env.SITE_URL || 'https://marketplace.com';
const MAX_URLS_PER_SITEMAP = 50000;

/**
 * Sitemap Generator
 * Generates XML sitemaps for all entity types
 */
class SitemapGenerator {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Initialize sitemap generator
   */
  async initialize() {
    // Ensure sitemap directory exists
    await fs.mkdir(SITEMAP_DIR, { recursive: true });

    // Initialize default configs
    await SitemapConfig.initializeDefaults();

    console.log('[SitemapGenerator] Initialized');
  }

  /**
   * Generate all sitemaps
   */
  async generateAll() {
    if (this.isRunning) {
      console.log('[SitemapGenerator] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    console.log('[SitemapGenerator] Starting sitemap generation...');

    try {
      const configs = await SitemapConfig.getEnabledConfigs();
      const sitemaps = [];

      for (const config of configs) {
        try {
          const result = await this.generateForEntityType(config);
          if (result) {
            sitemaps.push(...result);
          }
        } catch (error) {
          console.error(`[SitemapGenerator] Error generating ${config.entityType}:`, error);
          await config.recordError(error);
        }
      }

      // Generate sitemap index
      await this.generateSitemapIndex(sitemaps);

      const duration = Date.now() - startTime;
      console.log(`[SitemapGenerator] Completed in ${duration}ms, generated ${sitemaps.length} sitemaps`);

    } catch (error) {
      console.error('[SitemapGenerator] Failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate sitemap for entity type
   */
  async generateForEntityType(config) {
    const startTime = Date.now();
    const sitemaps = [];

    switch (config.entityType) {
      case 'products':
        sitemaps.push(...await this.generateProductsSitemap(config));
        break;
      case 'categories':
        sitemaps.push(...await this.generateCategoriesSitemap(config));
        break;
      case 'vendors':
        sitemaps.push(...await this.generateVendorsSitemap(config));
        break;
      case 'pages':
        sitemaps.push(...await this.generatePagesSitemap(config));
        break;
      case 'static':
        sitemaps.push(...await this.generateStaticSitemap(config));
        break;
    }

    // Update config stats
    const totalUrls = sitemaps.reduce((sum, s) => sum + s.urlCount, 0);
    const totalSize = sitemaps.reduce((sum, s) => sum + s.fileSize, 0);

    await config.updateGenerationStats({
      urlCount: totalUrls,
      fileSize: totalSize,
      duration: Date.now() - startTime,
    });

    return sitemaps;
  }

  /**
   * Generate products sitemap
   */
  async generateProductsSitemap(config) {
    const sitemaps = [];
    let page = 0;

    // Get active products with SEO meta
    const totalProducts = await Product.countDocuments({
      status: 'active',
      isVisible: true,
    });

    const totalPages = Math.ceil(totalProducts / MAX_URLS_PER_SITEMAP);

    while (page < totalPages) {
      const products = await Product.find({
        status: 'active',
        isVisible: true,
      })
        .select('_id slug updatedAt images')
        .sort({ updatedAt: -1 })
        .skip(page * MAX_URLS_PER_SITEMAP)
        .limit(MAX_URLS_PER_SITEMAP)
        .lean();

      const urls = products.map(product => ({
        loc: `${BASE_URL}/products/${product.slug}`,
        lastmod: product.updatedAt?.toISOString().split('T')[0],
        changefreq: config.changefreq,
        priority: config.priority,
        images: config.includeImages ? product.images?.map(img => ({
          loc: img.url,
          title: product.name,
        })) : undefined,
      }));

      const filename = totalPages > 1
        ? `sitemap-products-${page + 1}.xml`
        : 'sitemap-products.xml';

      const result = await this.writeSitemap(filename, urls);
      sitemaps.push(result);

      page++;
    }

    return sitemaps;
  }

  /**
   * Generate categories sitemap
   */
  async generateCategoriesSitemap(config) {
    const categories = await Category.find({ isActive: true })
      .select('_id slug updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const urls = categories.map(category => ({
      loc: `${BASE_URL}/products?category=${category.slug}`,
      lastmod: category.updatedAt?.toISOString().split('T')[0],
      changefreq: config.changefreq,
      priority: config.priority,
    }));

    const result = await this.writeSitemap('sitemap-categories.xml', urls);
    return [result];
  }

  /**
   * Generate vendors sitemap
   */
  async generateVendorsSitemap(config) {
    const vendors = await Vendor.find({
      isApproved: true,
      'user.isActive': { $ne: false },
    })
      .select('_id slug updatedAt logo')
      .sort({ updatedAt: -1 })
      .lean();

    const urls = vendors.map(vendor => ({
      loc: `${BASE_URL}/vendor/${vendor.slug}`,
      lastmod: vendor.updatedAt?.toISOString().split('T')[0],
      changefreq: config.changefreq,
      priority: config.priority,
      images: config.includeImages && vendor.logo ? [{
        loc: vendor.logo,
        title: vendor.storeName,
      }] : undefined,
    }));

    const result = await this.writeSitemap('sitemap-vendors.xml', urls);
    return [result];
  }

  /**
   * Generate pages sitemap
   */
  async generatePagesSitemap(config) {
    // Get SEO meta for pages
    const seoMetas = await SeoMeta.find({
      entityType: 'page',
      excludeFromSitemap: false,
    })
      .select('slug updatedAt sitemapPriority sitemapChangeFreq')
      .sort({ updatedAt: -1 })
      .lean();

    const urls = seoMetas.map(meta => ({
      loc: `${BASE_URL}/${meta.slug}`,
      lastmod: meta.updatedAt?.toISOString().split('T')[0],
      changefreq: meta.sitemapChangeFreq || config.changefreq,
      priority: meta.sitemapPriority || config.priority,
    }));

    if (urls.length === 0) return [];

    const result = await this.writeSitemap('sitemap-pages.xml', urls);
    return [result];
  }

  /**
   * Generate static pages sitemap
   */
  async generateStaticSitemap(config) {
    const urls = config.staticUrls.map(url => ({
      loc: url.url.startsWith('http') ? url.url : `${BASE_URL}${url.url}`,
      changefreq: url.changefreq || config.changefreq,
      priority: url.priority || config.priority,
      lastmod: url.lastmod?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    }));

    const result = await this.writeSitemap('sitemap-static.xml', urls);
    return [result];
  }

  /**
   * Write sitemap to file
   */
  async writeSitemap(filename, urls) {
    const xml = this.generateSitemapXml(urls);
    const filePath = path.join(SITEMAP_DIR, filename);

    // Write uncompressed
    await fs.writeFile(filePath, xml, 'utf8');

    // Write compressed
    const compressed = await gzip(xml);
    await fs.writeFile(`${filePath}.gz`, compressed);

    const stats = await fs.stat(filePath);

    return {
      filename,
      urlCount: urls.length,
      fileSize: stats.size,
      lastmod: new Date().toISOString(),
    };
  }

  /**
   * Generate sitemap XML content
   */
  generateSitemapXml(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;

      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      if (url.images && url.images.length > 0) {
        for (const image of url.images) {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${this.escapeXml(image.loc)}</image:loc>\n`;
          if (image.title) {
            xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
          }
          xml += '    </image:image>\n';
        }
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate sitemap index
   */
  async generateSitemapIndex(sitemaps) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sitemap of sitemaps) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${BASE_URL}/sitemaps/${sitemap.filename}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod.split('T')[0]}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>';

    const indexPath = path.join(SITEMAP_DIR, 'sitemap.xml');
    await fs.writeFile(indexPath, xml, 'utf8');

    // Also write to public root
    const publicIndexPath = path.join(__dirname, '../../public/sitemap.xml');
    await fs.writeFile(publicIndexPath, xml, 'utf8');

    return {
      filename: 'sitemap.xml',
      sitemapCount: sitemaps.length,
    };
  }

  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Schedule sitemap generation
   * Runs daily at 2:00 AM
   */
  schedule() {
    // Daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('[SitemapGenerator] Running scheduled generation...');
      await this.generateAll();
    });

    console.log('[SitemapGenerator] Scheduled for daily generation at 2:00 AM');
  }

  /**
   * Get sitemap stats
   */
  async getStats() {
    return await SitemapConfig.getGenerationStats();
  }
}

const sitemapGenerator = new SitemapGenerator();

module.exports = sitemapGenerator;
