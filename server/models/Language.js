const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Language code is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 5,
    },
    name: {
      type: String,
      required: [true, 'Language name is required'],
      trim: true,
    },
    nativeName: {
      type: String,
      required: [true, 'Native name is required'],
      trim: true,
    },
    direction: {
      type: String,
      enum: ['ltr', 'rtl'],
      default: 'ltr',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    flag: {
      type: String, // Emoji or URL
    },
    // Locale settings
    locale: {
      type: String, // e.g., 'en-US', 'ur-PK', 'ar-SA'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
    timeFormat: {
      type: String,
      default: 'h:mm A',
    },
    // Translation progress
    translationProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    totalStrings: {
      type: Number,
      default: 0,
    },
    translatedStrings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
languageSchema.index({ isActive: 1, sortOrder: 1 });
languageSchema.index({ isDefault: 1 });

// Ensure only one default language
languageSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

/**
 * Get all active languages
 */
languageSchema.statics.getActiveLanguages = async function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select('-__v')
    .lean();
};

/**
 * Get default language
 */
languageSchema.statics.getDefaultLanguage = async function() {
  let defaultLang = await this.findOne({ isDefault: true, isActive: true }).lean();

  if (!defaultLang) {
    defaultLang = await this.findOne({ code: 'en', isActive: true }).lean();
  }

  if (!defaultLang) {
    defaultLang = await this.findOne({ isActive: true }).lean();
  }

  return defaultLang;
};

/**
 * Get language by code
 */
languageSchema.statics.getByCode = async function(code) {
  return this.findOne({ code: code.toLowerCase(), isActive: true }).lean();
};

/**
 * Check if language is RTL
 */
languageSchema.statics.isRTL = async function(code) {
  const lang = await this.findOne({ code: code.toLowerCase() }).select('direction').lean();
  return lang?.direction === 'rtl';
};

/**
 * Update translation progress
 */
languageSchema.methods.updateTranslationProgress = async function() {
  const UIString = mongoose.model('UIString');

  // Count total and translated strings
  const totalStrings = await UIString.countDocuments({
    languageCode: await this.constructor.getDefaultLanguage().then(l => l?.code || 'en'),
  });

  const translatedStrings = await UIString.countDocuments({
    languageCode: this.code,
  });

  this.totalStrings = totalStrings;
  this.translatedStrings = translatedStrings;
  this.translationProgress = totalStrings > 0
    ? Math.round((translatedStrings / totalStrings) * 100)
    : 0;

  await this.save();
};

/**
 * Initialize default languages
 */
languageSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      isDefault: true,
      isActive: true,
      sortOrder: 1,
      flag: '🇺🇸',
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
    },
    {
      code: 'ur',
      name: 'Urdu',
      nativeName: 'اردو',
      direction: 'rtl',
      isDefault: false,
      isActive: true,
      sortOrder: 2,
      flag: '🇵🇰',
      locale: 'ur-PK',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'h:mm A',
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      direction: 'rtl',
      isDefault: false,
      isActive: true,
      sortOrder: 3,
      flag: '🇸🇦',
      locale: 'ar-SA',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'h:mm A',
    },
  ];

  for (const lang of defaults) {
    const existing = await this.findOne({ code: lang.code });
    if (!existing) {
      await this.create(lang);
      console.log(`[Language] Created default language: ${lang.code}`);
    }
  }
};

const Language = mongoose.model('Language', languageSchema);

module.exports = Language;
