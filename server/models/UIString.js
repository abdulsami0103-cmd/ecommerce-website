const mongoose = require('mongoose');

const uiStringSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Key is required'],
      trim: true,
      index: true,
    },
    languageCode: {
      type: String,
      required: [true, 'Language code is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    value: {
      type: String,
      required: [true, 'Value is required'],
    },
    namespace: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      default: 'common',
    },
    description: {
      type: String,
      trim: true,
    },
    placeholders: [{
      name: String,
      description: String,
      example: String,
    }],
    // For pluralization
    pluralForms: {
      zero: String,
      one: String,
      two: String,
      few: String,
      many: String,
      other: String,
    },
    // Tracking
    isAutoTranslated: {
      type: Boolean,
      default: false,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
uiStringSchema.index({ key: 1, languageCode: 1 }, { unique: true });
uiStringSchema.index({ namespace: 1, languageCode: 1 });

/**
 * Get all strings for a language
 */
uiStringSchema.statics.getForLanguage = async function(languageCode, namespace = null) {
  const query = { languageCode };

  if (namespace) {
    query.namespace = namespace;
  }

  const strings = await this.find(query).lean();

  // Convert to key-value object, grouped by namespace
  const result = {};
  for (const str of strings) {
    if (!result[str.namespace]) {
      result[str.namespace] = {};
    }
    result[str.namespace][str.key] = str.value;
  }

  return result;
};

/**
 * Get flat key-value object for a language (for i18n library)
 */
uiStringSchema.statics.getFlatForLanguage = async function(languageCode) {
  const strings = await this.find({ languageCode }).lean();

  const result = {};
  for (const str of strings) {
    // Use namespaced key: namespace.key
    const fullKey = str.namespace !== 'common' ? `${str.namespace}.${str.key}` : str.key;
    result[fullKey] = str.value;
  }

  return result;
};

/**
 * Set a string value
 */
uiStringSchema.statics.setString = async function(
  key,
  languageCode,
  value,
  options = {}
) {
  const {
    namespace = 'common',
    description = null,
    placeholders = [],
    pluralForms = null,
    isAutoTranslated = false,
    lastModifiedBy = null,
  } = options;

  const update = {
    value,
    namespace,
    isAutoTranslated,
  };

  if (description) update.description = description;
  if (placeholders.length) update.placeholders = placeholders;
  if (pluralForms) update.pluralForms = pluralForms;
  if (lastModifiedBy) update.lastModifiedBy = lastModifiedBy;

  return this.findOneAndUpdate(
    { key, languageCode },
    { $set: update },
    { upsert: true, new: true }
  );
};

/**
 * Bulk set strings
 */
uiStringSchema.statics.bulkSetStrings = async function(languageCode, strings, options = {}) {
  const { namespace = 'common', isAutoTranslated = false, lastModifiedBy = null } = options;

  const operations = Object.entries(strings).map(([key, value]) => ({
    updateOne: {
      filter: { key, languageCode },
      update: {
        $set: {
          value,
          namespace,
          isAutoTranslated,
          lastModifiedBy,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await this.bulkWrite(operations);
  }

  return operations.length;
};

/**
 * Import strings from JSON object
 */
uiStringSchema.statics.importFromJson = async function(languageCode, json, options = {}) {
  const { overwrite = false, lastModifiedBy = null } = options;

  let imported = 0;
  let skipped = 0;

  const flattenJson = (obj, prefix = '', namespace = 'common') => {
    const result = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if this is a namespace or nested key
        if (!prefix) {
          // Top level object = namespace
          result.push(...flattenJson(value, '', key));
        } else {
          result.push(...flattenJson(value, fullKey, namespace));
        }
      } else {
        result.push({ key: fullKey, value: String(value), namespace });
      }
    }
    return result;
  };

  const entries = flattenJson(json);

  for (const entry of entries) {
    try {
      if (!overwrite) {
        const existing = await this.findOne({
          key: entry.key,
          languageCode,
        });

        if (existing) {
          skipped++;
          continue;
        }
      }

      await this.setString(entry.key, languageCode, entry.value, {
        namespace: entry.namespace,
        lastModifiedBy,
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import string ${entry.key}:`, error);
      skipped++;
    }
  }

  return { imported, skipped, total: entries.length };
};

/**
 * Export strings to JSON
 */
uiStringSchema.statics.exportToJson = async function(languageCode, namespace = null) {
  const query = { languageCode };
  if (namespace) query.namespace = namespace;

  const strings = await this.find(query).lean();

  const result = {};
  for (const str of strings) {
    if (!result[str.namespace]) {
      result[str.namespace] = {};
    }

    // Handle nested keys (e.g., "form.validation.required")
    const keys = str.key.split('.');
    let current = result[str.namespace];

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = str.value;
  }

  return result;
};

/**
 * Get missing translations
 */
uiStringSchema.statics.getMissing = async function(sourceLanguage, targetLanguage) {
  const sourceStrings = await this.find({ languageCode: sourceLanguage }).select('key namespace').lean();
  const targetStrings = await this.find({ languageCode: targetLanguage }).select('key').lean();

  const targetKeys = new Set(targetStrings.map(s => s.key));
  const missing = sourceStrings.filter(s => !targetKeys.has(s.key));

  return missing;
};

/**
 * Get translation stats
 */
uiStringSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: { languageCode: '$languageCode', namespace: '$namespace' },
        count: { $sum: 1 },
        autoTranslated: {
          $sum: { $cond: ['$isAutoTranslated', 1, 0] },
        },
      },
    },
    {
      $group: {
        _id: '$_id.languageCode',
        namespaces: {
          $push: {
            namespace: '$_id.namespace',
            count: '$count',
            autoTranslated: '$autoTranslated',
          },
        },
        totalStrings: { $sum: '$count' },
        totalAutoTranslated: { $sum: '$autoTranslated' },
      },
    },
    {
      $project: {
        languageCode: '$_id',
        namespaces: 1,
        totalStrings: 1,
        totalAutoTranslated: 1,
        manuallyTranslated: { $subtract: ['$totalStrings', '$totalAutoTranslated'] },
      },
    },
    { $sort: { languageCode: 1 } },
  ]);

  return stats;
};

const UIString = mongoose.model('UIString', uiStringSchema);

module.exports = UIString;
