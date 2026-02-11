const axios = require('axios');
const Currency = require('../models/Currency');
const CurrencyRateLog = require('../models/CurrencyRateLog');

// Simple in-memory cache
const cache = {
  currencies: null,
  currenciesExpiry: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Currency Service
 * Handles currency conversion, formatting, and exchange rate updates
 */
class CurrencyService {
  /**
   * Get all active currencies (cached)
   */
  async getActiveCurrencies() {
    const now = Date.now();

    if (cache.currencies && cache.currenciesExpiry > now) {
      return cache.currencies;
    }

    const currencies = await Currency.getActiveCurrencies();
    cache.currencies = currencies;
    cache.currenciesExpiry = now + CACHE_TTL;

    return currencies;
  }

  /**
   * Get currency by code
   */
  async getCurrency(code) {
    return Currency.getByCode(code);
  }

  /**
   * Get base currency
   */
  async getBaseCurrency() {
    return Currency.getBaseCurrency();
  }

  /**
   * Get default display currency
   */
  async getDefaultCurrency() {
    return Currency.getDefaultCurrency();
  }

  /**
   * Convert price between currencies
   */
  async convertPrice(amount, fromCode, toCode) {
    return Currency.convert(amount, fromCode, toCode);
  }

  /**
   * Format price in specified currency
   */
  async formatPrice(amount, currencyCode) {
    return Currency.formatAmount(amount, currencyCode);
  }

  /**
   * Detect currency from IP/country
   */
  async detectCurrencyFromIP(ip) {
    // Simple mapping - in production, use a geo-IP service
    const countryToCurrency = {
      PK: 'PKR',
      US: 'USD',
      AE: 'AED',
      SA: 'SAR',
      GB: 'GBP',
      DE: 'EUR',
      FR: 'EUR',
    };

    try {
      // You could use a service like ip-api.com or ipinfo.io here
      // For now, return default
      return await this.getDefaultCurrency();
    } catch (error) {
      console.error('[CurrencyService] Failed to detect currency from IP:', error);
      return await this.getDefaultCurrency();
    }
  }

  /**
   * Detect currency from request
   */
  async detectCurrency(req) {
    // Priority: query param > user preference > cookie > IP > default

    // 1. Query parameter
    if (req.query.currency) {
      const currency = await this.getCurrency(req.query.currency);
      if (currency) return currency;
    }

    // 2. User preference
    if (req.user?.preferredCurrency) {
      const currency = await this.getCurrency(req.user.preferredCurrency);
      if (currency) return currency;
    }

    // 3. Cookie
    if (req.cookies?.currency) {
      const currency = await this.getCurrency(req.cookies.currency);
      if (currency) return currency;
    }

    // 4. Default
    return await this.getDefaultCurrency();
  }

  /**
   * Clear cache
   */
  clearCache() {
    cache.currencies = null;
    cache.currenciesExpiry = 0;
  }

  /**
   * Fetch exchange rates from Open Exchange Rates API
   */
  async fetchExchangeRates() {
    const apiKey = process.env.OPENEXCHANGERATES_APP_ID;

    if (!apiKey) {
      console.warn('[CurrencyService] OPENEXCHANGERATES_APP_ID not configured');
      return null;
    }

    try {
      const response = await axios.get(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`,
        { timeout: 10000 }
      );

      const rates = response.data.rates;
      const currencies = await Currency.find({ isActive: true });

      let updated = 0;
      let errors = 0;

      for (const currency of currencies) {
        if (currency.isBaseCurrency) continue; // Skip base currency (USD)

        const newRate = rates[currency.code];
        if (newRate) {
          try {
            await Currency.updateRate(currency.code, newRate, 'openexchangerates');
            updated++;
          } catch (error) {
            console.error(`[CurrencyService] Failed to update ${currency.code}:`, error);
            errors++;
          }
        }
      }

      this.clearCache();

      return {
        success: true,
        updated,
        errors,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error('[CurrencyService] Failed to fetch exchange rates:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update exchange rate manually
   */
  async updateRate(code, rate) {
    this.clearCache();
    return Currency.updateRate(code, rate, 'manual');
  }

  /**
   * Get rate history
   */
  async getRateHistory(currencyCode, days = 30) {
    return CurrencyRateLog.getHistory(currencyCode, { days });
  }

  /**
   * Get rate statistics
   */
  async getRateStats(currencyCode, days = 30) {
    return CurrencyRateLog.getStats(currencyCode, days);
  }

  /**
   * Get daily average rates
   */
  async getDailyAverages(currencyCode, days = 30) {
    return CurrencyRateLog.getDailyAverages(currencyCode, days);
  }

  /**
   * Create a new currency
   */
  async createCurrency(data) {
    this.clearCache();
    return Currency.create(data);
  }

  /**
   * Update a currency
   */
  async updateCurrency(currencyId, data) {
    this.clearCache();
    return Currency.findByIdAndUpdate(currencyId, data, { new: true });
  }

  /**
   * Delete a currency
   */
  async deleteCurrency(currencyId) {
    this.clearCache();
    const currency = await Currency.findById(currencyId);

    if (!currency) {
      throw new Error('Currency not found');
    }

    if (currency.isBaseCurrency) {
      throw new Error('Cannot delete base currency');
    }

    if (currency.isDefault) {
      throw new Error('Cannot delete default currency');
    }

    // Delete rate logs
    await CurrencyRateLog.deleteMany({ currencyCode: currency.code });

    await currency.deleteOne();
    return true;
  }

  /**
   * Initialize default currencies
   */
  async initializeDefaults() {
    await Currency.initializeDefaults();
  }

  /**
   * Check if rates are stale (older than 24 hours)
   */
  async areRatesStale() {
    const currencies = await Currency.find({
      isActive: true,
      isBaseCurrency: false,
    }).select('lastRateUpdate');

    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - 24);

    for (const currency of currencies) {
      if (!currency.lastRateUpdate || currency.lastRateUpdate < staleThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get currency data for frontend
   */
  async getCurrencyData(currencyCode = null) {
    const [allCurrencies, defaultCurrency] = await Promise.all([
      this.getActiveCurrencies(),
      this.getDefaultCurrency(),
    ]);

    const currentCurrency = currencyCode
      ? await this.getCurrency(currencyCode) || defaultCurrency
      : defaultCurrency;

    return {
      currentCurrency,
      defaultCurrency,
      availableCurrencies: allCurrencies.map(c => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        symbolPosition: c.symbolPosition,
        decimalPlaces: c.decimalPlaces,
        exchangeRate: c.exchangeRate,
      })),
    };
  }

  /**
   * Convert product prices to specified currency
   */
  async convertProductPrices(product, targetCurrencyCode, sourceCurrencyCode = 'PKR') {
    if (sourceCurrencyCode === targetCurrencyCode) {
      return product;
    }

    const converted = { ...product };

    if (product.price) {
      converted.price = await this.convertPrice(product.price, sourceCurrencyCode, targetCurrencyCode);
    }

    if (product.salePrice) {
      converted.salePrice = await this.convertPrice(product.salePrice, sourceCurrencyCode, targetCurrencyCode);
    }

    if (product.compareAtPrice) {
      converted.compareAtPrice = await this.convertPrice(product.compareAtPrice, sourceCurrencyCode, targetCurrencyCode);
    }

    converted._convertedTo = targetCurrencyCode;
    converted._convertedFrom = sourceCurrencyCode;

    return converted;
  }
}

module.exports = new CurrencyService();
