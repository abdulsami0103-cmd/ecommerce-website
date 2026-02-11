const Language = require('../models/Language');
const Translation = require('../models/Translation');
const UIString = require('../models/UIString');

// Simple in-memory cache
const cache = {
  languages: null,
  languagesExpiry: 0,
  uiStrings: {},
  uiStringsExpiry: {},
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Localization Service
 * Handles language management, translations, and UI strings
 */
class LocalizationService {
  /**
   * Get all active languages (cached)
   */
  async getActiveLanguages() {
    const now = Date.now();

    if (cache.languages && cache.languagesExpiry > now) {
      return cache.languages;
    }

    const languages = await Language.getActiveLanguages();
    cache.languages = languages;
    cache.languagesExpiry = now + CACHE_TTL;

    return languages;
  }

  /**
   * Get language by code
   */
  async getLanguage(code) {
    return Language.getByCode(code);
  }

  /**
   * Get default language
   */
  async getDefaultLanguage() {
    return Language.getDefaultLanguage();
  }

  /**
   * Check if language is RTL
   */
  async isRTL(code) {
    return Language.isRTL(code);
  }

  /**
   * Get UI strings for a language (cached)
   */
  async getUIStrings(languageCode, namespace = null) {
    const cacheKey = `${languageCode}:${namespace || 'all'}`;
    const now = Date.now();

    if (cache.uiStrings[cacheKey] && cache.uiStringsExpiry[cacheKey] > now) {
      return cache.uiStrings[cacheKey];
    }

    const strings = namespace
      ? await UIString.getForLanguage(languageCode, namespace)
      : await UIString.getFlatForLanguage(languageCode);

    cache.uiStrings[cacheKey] = strings;
    cache.uiStringsExpiry[cacheKey] = now + CACHE_TTL;

    return strings;
  }

  /**
   * Clear caches
   */
  clearCache() {
    cache.languages = null;
    cache.languagesExpiry = 0;
    cache.uiStrings = {};
    cache.uiStringsExpiry = {};
  }

  /**
   * Detect language from request
   */
  detectLanguage(req) {
    // Priority: query param > user preference > cookie > header > default

    // 1. Query parameter
    if (req.query.lang) {
      return req.query.lang.toLowerCase();
    }

    // 2. User preference (if authenticated)
    if (req.user?.preferredLanguage) {
      return req.user.preferredLanguage;
    }

    // 3. Cookie
    if (req.cookies?.lang) {
      return req.cookies.lang;
    }

    // 4. Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
      return preferred;
    }

    // 5. Default
    return 'en';
  }

  /**
   * Get entity translation
   */
  async getEntityTranslation(entityType, entityId, languageCode, fields) {
    return Translation.getForEntity(entityType, entityId, languageCode);
  }

  /**
   * Set entity translation
   */
  async setEntityTranslation(entityType, entityId, languageCode, translations, options = {}) {
    return Translation.setTranslations(entityType, entityId, languageCode, translations, options);
  }

  /**
   * Translate entity object
   */
  async translateEntity(entity, entityType, languageCode, fields) {
    return Translation.applyToEntity(entity, entityType, languageCode, fields);
  }

  /**
   * Translate multiple entities
   */
  async translateEntities(entities, entityType, languageCode, fields) {
    return Translation.applyToEntities(entities, entityType, languageCode, fields);
  }

  /**
   * Get translation progress for entity
   */
  async getTranslationProgress(entityType, entityId, fields) {
    return Translation.getProgress(entityType, entityId, fields);
  }

  /**
   * Set UI string
   */
  async setUIString(key, languageCode, value, options = {}) {
    this.clearUIStringCache(languageCode);
    return UIString.setString(key, languageCode, value, options);
  }

  /**
   * Bulk set UI strings
   */
  async bulkSetUIStrings(languageCode, strings, options = {}) {
    this.clearUIStringCache(languageCode);
    return UIString.bulkSetStrings(languageCode, strings, options);
  }

  /**
   * Import UI strings from JSON
   */
  async importUIStrings(languageCode, json, options = {}) {
    this.clearUIStringCache(languageCode);
    return UIString.importFromJson(languageCode, json, options);
  }

  /**
   * Export UI strings to JSON
   */
  async exportUIStrings(languageCode, namespace = null) {
    return UIString.exportToJson(languageCode, namespace);
  }

  /**
   * Get missing translations
   */
  async getMissingStrings(sourceLanguage, targetLanguage) {
    return UIString.getMissing(sourceLanguage, targetLanguage);
  }

  /**
   * Get translation stats
   */
  async getTranslationStats() {
    return UIString.getStats();
  }

  /**
   * Clear UI string cache for a language
   */
  clearUIStringCache(languageCode) {
    Object.keys(cache.uiStrings).forEach(key => {
      if (key.startsWith(languageCode)) {
        delete cache.uiStrings[key];
        delete cache.uiStringsExpiry[key];
      }
    });
  }

  /**
   * Create a new language
   */
  async createLanguage(data) {
    this.clearCache();
    return Language.create(data);
  }

  /**
   * Update a language
   */
  async updateLanguage(languageId, data) {
    this.clearCache();
    return Language.findByIdAndUpdate(languageId, data, { new: true });
  }

  /**
   * Delete a language
   */
  async deleteLanguage(languageId) {
    this.clearCache();
    const language = await Language.findById(languageId);

    if (!language) {
      throw new Error('Language not found');
    }

    if (language.isDefault) {
      throw new Error('Cannot delete default language');
    }

    // Delete all UI strings for this language
    await UIString.deleteMany({ languageCode: language.code });

    // Delete all translations for this language
    await Translation.deleteMany({ languageCode: language.code });

    await language.deleteOne();
    return true;
  }

  /**
   * Initialize default languages
   */
  async initializeDefaults() {
    await Language.initializeDefaults();
  }

  /**
   * Get localization data for frontend
   */
  async getLocalizationData(languageCode) {
    const [language, strings, allLanguages] = await Promise.all([
      this.getLanguage(languageCode),
      this.getUIStrings(languageCode),
      this.getActiveLanguages(),
    ]);

    return {
      currentLanguage: language || { code: 'en', direction: 'ltr' },
      strings,
      availableLanguages: allLanguages.map(l => ({
        code: l.code,
        name: l.name,
        nativeName: l.nativeName,
        direction: l.direction,
        flag: l.flag,
      })),
    };
  }
}

module.exports = new LocalizationService();
