const localizationService = require('../services/localizationService');
const currencyService = require('../services/currencyService');
const Language = require('../models/Language');
const Translation = require('../models/Translation');
const UIString = require('../models/UIString');
const Currency = require('../models/Currency');
const exchangeRateJob = require('../jobs/updateExchangeRates');

// ==================== PUBLIC ROUTES ====================

/**
 * @desc    Get all active languages
 * @route   GET /api/localization/languages
 * @access  Public
 */
const getLanguages = async (req, res) => {
  try {
    const languages = await localizationService.getActiveLanguages();

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get languages',
    });
  }
};

/**
 * @desc    Get UI strings for a language
 * @route   GET /api/localization/strings/:lang
 * @access  Public
 */
const getUIStrings = async (req, res) => {
  try {
    const { lang } = req.params;
    const { namespace } = req.query;

    const strings = await localizationService.getUIStrings(lang, namespace);

    res.json({
      success: true,
      data: strings,
    });
  } catch (error) {
    console.error('Get UI strings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get UI strings',
    });
  }
};

/**
 * @desc    Get all active currencies
 * @route   GET /api/localization/currencies
 * @access  Public
 */
const getCurrencies = async (req, res) => {
  try {
    const currencies = await currencyService.getActiveCurrencies();

    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get currencies',
    });
  }
};

/**
 * @desc    Convert price between currencies
 * @route   GET /api/localization/currencies/convert
 * @access  Public
 */
const convertPrice = async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'amount, from, and to parameters are required',
      });
    }

    const converted = await currencyService.convertPrice(
      parseFloat(amount),
      from,
      to
    );

    const formatted = await currencyService.formatPrice(converted, to);

    res.json({
      success: true,
      data: {
        original: parseFloat(amount),
        converted,
        formatted,
        from,
        to,
      },
    });
  } catch (error) {
    console.error('Convert price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert price',
    });
  }
};

/**
 * @desc    Detect user's preferred currency
 * @route   GET /api/localization/currencies/detect
 * @access  Public
 */
const detectCurrency = async (req, res) => {
  try {
    const currency = await currencyService.detectCurrency(req);

    res.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Detect currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect currency',
    });
  }
};

/**
 * @desc    Get full localization data for frontend
 * @route   GET /api/localization/init
 * @access  Public
 */
const getLocalizationInit = async (req, res) => {
  try {
    const languageCode = localizationService.detectLanguage(req);
    const currencyCode = req.query.currency || req.cookies?.currency;

    const [localizationData, currencyData] = await Promise.all([
      localizationService.getLocalizationData(languageCode),
      currencyService.getCurrencyData(currencyCode),
    ]);

    res.json({
      success: true,
      data: {
        ...localizationData,
        ...currencyData,
      },
    });
  } catch (error) {
    console.error('Get localization init error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get localization data',
    });
  }
};

/**
 * @desc    Get entity translations
 * @route   GET /api/localization/translations/:type/:id
 * @access  Public
 */
const getEntityTranslations = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { lang } = req.query;

    const translations = await Translation.getForEntity(type, id, lang);

    res.json({
      success: true,
      data: translations,
    });
  } catch (error) {
    console.error('Get entity translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get translations',
    });
  }
};

// ==================== VENDOR/ADMIN ROUTES ====================

/**
 * @desc    Update entity translations
 * @route   PUT /api/localization/translations/:type/:id
 * @access  Vendor/Admin
 */
const updateEntityTranslations = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { languageCode, translations } = req.body;

    if (!languageCode || !translations) {
      return res.status(400).json({
        success: false,
        message: 'languageCode and translations are required',
      });
    }

    const result = await localizationService.setEntityTranslation(
      type,
      id,
      languageCode,
      translations,
      { translatedBy: req.user._id }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Update entity translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update translations',
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * @desc    Create a new language
 * @route   POST /api/admin/languages
 * @access  Admin
 */
const adminCreateLanguage = async (req, res) => {
  try {
    const language = await localizationService.createLanguage(req.body);

    res.status(201).json({
      success: true,
      data: language,
    });
  } catch (error) {
    console.error('Create language error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create language',
    });
  }
};

/**
 * @desc    Update a language
 * @route   PUT /api/admin/languages/:id
 * @access  Admin
 */
const adminUpdateLanguage = async (req, res) => {
  try {
    const language = await localizationService.updateLanguage(req.params.id, req.body);

    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found',
      });
    }

    res.json({
      success: true,
      data: language,
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update language',
    });
  }
};

/**
 * @desc    Delete a language
 * @route   DELETE /api/admin/languages/:id
 * @access  Admin
 */
const adminDeleteLanguage = async (req, res) => {
  try {
    await localizationService.deleteLanguage(req.params.id);

    res.json({
      success: true,
      message: 'Language deleted',
    });
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete language',
    });
  }
};

/**
 * @desc    Get all UI strings (admin)
 * @route   GET /api/admin/ui-strings
 * @access  Admin
 */
const adminGetUIStrings = async (req, res) => {
  try {
    const { languageCode, namespace, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (languageCode) query.languageCode = languageCode;
    if (namespace) query.namespace = namespace;
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { value: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [strings, total] = await Promise.all([
      UIString.find(query)
        .sort({ namespace: 1, key: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      UIString.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: strings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get UI strings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get UI strings',
    });
  }
};

/**
 * @desc    Update UI string
 * @route   PUT /api/admin/ui-strings
 * @access  Admin
 */
const adminUpdateUIString = async (req, res) => {
  try {
    const { key, languageCode, value, namespace, description } = req.body;

    if (!key || !languageCode || !value) {
      return res.status(400).json({
        success: false,
        message: 'key, languageCode, and value are required',
      });
    }

    const result = await localizationService.setUIString(key, languageCode, value, {
      namespace,
      description,
      lastModifiedBy: req.user._id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Update UI string error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update UI string',
    });
  }
};

/**
 * @desc    Import UI strings from JSON
 * @route   POST /api/admin/ui-strings/import
 * @access  Admin
 */
const adminImportUIStrings = async (req, res) => {
  try {
    const { languageCode, data, overwrite = false } = req.body;

    if (!languageCode || !data) {
      return res.status(400).json({
        success: false,
        message: 'languageCode and data are required',
      });
    }

    const result = await localizationService.importUIStrings(languageCode, data, {
      overwrite,
      lastModifiedBy: req.user._id,
    });

    res.json({
      success: true,
      message: `Imported ${result.imported} strings, skipped ${result.skipped}`,
      data: result,
    });
  } catch (error) {
    console.error('Import UI strings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import UI strings',
    });
  }
};

/**
 * @desc    Export UI strings to JSON
 * @route   GET /api/admin/ui-strings/export
 * @access  Admin
 */
const adminExportUIStrings = async (req, res) => {
  try {
    const { languageCode, namespace } = req.query;

    if (!languageCode) {
      return res.status(400).json({
        success: false,
        message: 'languageCode is required',
      });
    }

    const data = await localizationService.exportUIStrings(languageCode, namespace);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Export UI strings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export UI strings',
    });
  }
};

/**
 * @desc    Get translation stats
 * @route   GET /api/admin/ui-strings/stats
 * @access  Admin
 */
const adminGetTranslationStats = async (req, res) => {
  try {
    const stats = await localizationService.getTranslationStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get translation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
    });
  }
};

// ==================== CURRENCY ADMIN ROUTES ====================

/**
 * @desc    Create a new currency
 * @route   POST /api/admin/currencies
 * @access  Admin
 */
const adminCreateCurrency = async (req, res) => {
  try {
    const currency = await currencyService.createCurrency(req.body);

    res.status(201).json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Create currency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create currency',
    });
  }
};

/**
 * @desc    Update a currency
 * @route   PUT /api/admin/currencies/:id
 * @access  Admin
 */
const adminUpdateCurrency = async (req, res) => {
  try {
    const currency = await currencyService.updateCurrency(req.params.id, req.body);

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found',
      });
    }

    res.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update currency',
    });
  }
};

/**
 * @desc    Update exchange rate manually
 * @route   PUT /api/admin/currencies/:code/rate
 * @access  Admin
 */
const adminUpdateRate = async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid rate is required',
      });
    }

    const currency = await currencyService.updateRate(req.params.code, rate);

    res.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update rate',
    });
  }
};

/**
 * @desc    Fetch latest exchange rates
 * @route   POST /api/admin/currencies/fetch-rates
 * @access  Admin
 */
const adminFetchRates = async (req, res) => {
  try {
    const result = await exchangeRateJob.run();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Fetch rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rates',
    });
  }
};

/**
 * @desc    Get rate history for a currency
 * @route   GET /api/admin/currencies/:code/history
 * @access  Admin
 */
const adminGetRateHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [history, stats, dailyAverages] = await Promise.all([
      currencyService.getRateHistory(req.params.code, parseInt(days)),
      currencyService.getRateStats(req.params.code, parseInt(days)),
      currencyService.getDailyAverages(req.params.code, parseInt(days)),
    ]);

    res.json({
      success: true,
      data: {
        history,
        stats,
        dailyAverages,
      },
    });
  } catch (error) {
    console.error('Get rate history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate history',
    });
  }
};

/**
 * @desc    Delete a currency
 * @route   DELETE /api/admin/currencies/:id
 * @access  Admin
 */
const adminDeleteCurrency = async (req, res) => {
  try {
    await currencyService.deleteCurrency(req.params.id);

    res.json({
      success: true,
      message: 'Currency deleted',
    });
  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete currency',
    });
  }
};

module.exports = {
  // Public
  getLanguages,
  getUIStrings,
  getCurrencies,
  convertPrice,
  detectCurrency,
  getLocalizationInit,
  getEntityTranslations,

  // Vendor/Admin
  updateEntityTranslations,

  // Admin - Languages
  adminCreateLanguage,
  adminUpdateLanguage,
  adminDeleteLanguage,

  // Admin - UI Strings
  adminGetUIStrings,
  adminUpdateUIString,
  adminImportUIStrings,
  adminExportUIStrings,
  adminGetTranslationStats,

  // Admin - Currencies
  adminCreateCurrency,
  adminUpdateCurrency,
  adminUpdateRate,
  adminFetchRates,
  adminGetRateHistory,
  adminDeleteCurrency,
};
