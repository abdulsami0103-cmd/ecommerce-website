const PageView = require('../models/PageView');
const geoip = require('geoip-lite');
const crypto = require('crypto');

/**
 * Parse User-Agent string to extract device, browser, and OS info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      browser: 'unknown',
      browserVersion: '',
      os: 'unknown',
      osVersion: '',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Detect browser
  let browser = 'unknown';
  let browserVersion = '';

  if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detect OS
  let os = 'unknown';
  let osVersion = '';

  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android (\d+\.?\d*)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  return { deviceType, browser, browserVersion, os, osVersion };
};

/**
 * Extract traffic source from UTM parameters or referrer
 */
const extractTrafficSource = (query, referrer) => {
  // Check for UTM parameters first
  if (query.utm_source) {
    return {
      source: query.utm_source,
      medium: query.utm_medium || 'none',
      campaign: query.utm_campaign || '',
    };
  }

  // Parse referrer if no UTM
  if (referrer) {
    try {
      const url = new URL(referrer);
      const domain = url.hostname.replace('www.', '');

      // Categorize known sources
      if (domain.includes('google')) {
        return { source: 'google', medium: 'organic', campaign: '' };
      } else if (domain.includes('facebook') || domain.includes('fb.com')) {
        return { source: 'facebook', medium: 'social', campaign: '' };
      } else if (domain.includes('twitter') || domain.includes('t.co')) {
        return { source: 'twitter', medium: 'social', campaign: '' };
      } else if (domain.includes('instagram')) {
        return { source: 'instagram', medium: 'social', campaign: '' };
      } else if (domain.includes('linkedin')) {
        return { source: 'linkedin', medium: 'social', campaign: '' };
      } else if (domain.includes('youtube')) {
        return { source: 'youtube', medium: 'social', campaign: '' };
      } else if (domain.includes('bing')) {
        return { source: 'bing', medium: 'organic', campaign: '' };
      } else if (domain.includes('yahoo')) {
        return { source: 'yahoo', medium: 'organic', campaign: '' };
      }

      // Generic referral
      return { source: domain, medium: 'referral', campaign: '' };
    } catch (e) {
      // Invalid referrer URL
    }
  }

  // Direct traffic
  return { source: 'direct', medium: 'none', campaign: '' };
};

/**
 * Get or create visitor ID from cookie
 */
const getVisitorId = (req, res) => {
  let visitorId = req.cookies?.visitor_id;

  if (!visitorId) {
    visitorId = crypto.randomBytes(16).toString('hex');
    // Set cookie for 1 year
    res.cookie('visitor_id', visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return visitorId;
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
};

/**
 * Middleware factory to track page views
 * @param {Object} options - Configuration options
 * @param {string} options.pageType - Type of page ('store', 'product', 'category')
 * @param {Function} options.getVendorId - Function to extract vendor ID from request
 * @param {Function} options.getProductId - Optional function to extract product ID
 */
const trackPageView = (options = {}) => {
  const {
    pageType = 'store',
    getVendorId = (req) => req.params.vendorId,
    getProductId = null,
  } = options;

  return async (req, res, next) => {
    // Don't block the request - track asynchronously
    setImmediate(async () => {
      try {
        const vendorId = typeof getVendorId === 'function' ? getVendorId(req) : getVendorId;

        if (!vendorId) return;

        const productId = getProductId ? getProductId(req) : null;
        const visitorId = getVisitorId(req, res);
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers.referer || req.headers.referrer;
        const ip = getClientIP(req);

        // Parse user agent
        const { deviceType, browser, browserVersion, os, osVersion } = parseUserAgent(userAgent);

        // Get geo data from IP
        let geoData = {};
        if (ip && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
          const geo = geoip.lookup(ip);
          if (geo) {
            geoData = {
              country: geo.country,
              countryCode: geo.country,
              city: geo.city,
              region: geo.region,
            };
          }
        }

        // Extract traffic source
        const trafficSource = extractTrafficSource(req.query, referrer);

        // Create page view record
        await PageView.create({
          vendor: vendorId,
          product: productId,
          pageType,
          visitorId,
          customerId: req.user?._id,
          sessionId: req.sessionID,
          source: trafficSource.source,
          medium: trafficSource.medium,
          campaign: trafficSource.campaign,
          referrer,
          ...geoData,
          deviceType,
          browser,
          browserVersion,
          os,
          osVersion,
          ipAddress: ip,
          userAgent,
          url: req.originalUrl,
        });
      } catch (error) {
        // Don't log errors in production to avoid noise
        if (process.env.NODE_ENV === 'development') {
          console.error('Error tracking page view:', error.message);
        }
      }
    });

    // Continue with the request immediately
    next();
  };
};

/**
 * Simple middleware for tracking vendor store pages
 */
const trackVendorStore = trackPageView({
  pageType: 'store',
  getVendorId: (req) => req.vendor?._id || req.params.vendorId,
});

/**
 * Simple middleware for tracking product pages
 */
const trackProductPage = trackPageView({
  pageType: 'product',
  getVendorId: (req) => req.product?.vendor || req.params.vendorId,
  getProductId: (req) => req.product?._id || req.params.productId,
});

module.exports = {
  trackPageView,
  trackVendorStore,
  trackProductPage,
  parseUserAgent,
  extractTrafficSource,
  getClientIP,
};
