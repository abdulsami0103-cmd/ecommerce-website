const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    translatableType: {
      type: String,
      required: true,
      enum: ['Product', 'Category', 'Vendor', 'Page'],
      index: true,
    },
    translatableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    languageCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    isAutoTranslated: {
      type: Boolean,
      default: false,
    },
    translatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    translatedAt: {
      type: Date,
      default: Date.now,
    },
    // Track if original content has changed
    sourceHash: {
      type: String,
    },
    isOutdated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
translationSchema.index(
  { translatableType: 1, translatableId: 1, languageCode: 1, field: 1 },
  { unique: true }
);
translationSchema.index({ translatableType: 1, translatableId: 1, languageCode: 1 });

/**
 * Get all translations for an entity
 */
translationSchema.statics.getForEntity = async function(type, id, languageCode = null) {
  const query = {
    translatableType: type,
    translatableId: id,
  };

  if (languageCode) {
    query.languageCode = languageCode;
  }

  const translations = await this.find(query).lean();

  // Group by language code
  const grouped = {};
  for (const trans of translations) {
    if (!grouped[trans.languageCode]) {
      grouped[trans.languageCode] = {};
    }
    grouped[trans.languageCode][trans.field] = trans.value;
  }

  return languageCode ? grouped[languageCode] || {} : grouped;
};

/**
 * Set translation for a field
 */
translationSchema.statics.setTranslation = async function(
  type,
  id,
  languageCode,
  field,
  value,
  options = {}
) {
  const { isAutoTranslated = false, translatedBy = null, sourceHash = null } = options;

  const translation = await this.findOneAndUpdate(
    {
      translatableType: type,
      translatableId: id,
      languageCode,
      field,
    },
    {
      value,
      isAutoTranslated,
      translatedBy,
      sourceHash,
      translatedAt: new Date(),
      isOutdated: false,
    },
    {
      upsert: true,
      new: true,
    }
  );

  return translation;
};

/**
 * Set multiple translations at once
 */
translationSchema.statics.setTranslations = async function(
  type,
  id,
  languageCode,
  translations,
  options = {}
) {
  const { isAutoTranslated = false, translatedBy = null } = options;

  const operations = Object.entries(translations).map(([field, value]) => ({
    updateOne: {
      filter: {
        translatableType: type,
        translatableId: id,
        languageCode,
        field,
      },
      update: {
        $set: {
          value,
          isAutoTranslated,
          translatedBy,
          translatedAt: new Date(),
          isOutdated: false,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await this.bulkWrite(operations);
  }

  return this.getForEntity(type, id, languageCode);
};

/**
 * Delete translations for an entity
 */
translationSchema.statics.deleteForEntity = async function(type, id, languageCode = null) {
  const query = {
    translatableType: type,
    translatableId: id,
  };

  if (languageCode) {
    query.languageCode = languageCode;
  }

  return this.deleteMany(query);
};

/**
 * Mark translations as outdated when source changes
 */
translationSchema.statics.markOutdated = async function(type, id, field = null) {
  const query = {
    translatableType: type,
    translatableId: id,
  };

  if (field) {
    query.field = field;
  }

  return this.updateMany(query, { isOutdated: true });
};

/**
 * Get translation progress for an entity
 */
translationSchema.statics.getProgress = async function(type, id, fields) {
  const Language = mongoose.model('Language');
  const activeLanguages = await Language.getActiveLanguages();

  const progress = {};

  for (const lang of activeLanguages) {
    const translations = await this.find({
      translatableType: type,
      translatableId: id,
      languageCode: lang.code,
      field: { $in: fields },
    }).lean();

    progress[lang.code] = {
      total: fields.length,
      translated: translations.length,
      percentage: Math.round((translations.length / fields.length) * 100),
      outdated: translations.filter(t => t.isOutdated).length,
    };
  }

  return progress;
};

/**
 * Apply translations to an entity object
 */
translationSchema.statics.applyToEntity = async function(entity, type, languageCode, fields) {
  if (!entity || !languageCode) return entity;

  const translations = await this.getForEntity(type, entity._id, languageCode);

  const result = typeof entity.toObject === 'function' ? entity.toObject() : { ...entity };

  for (const field of fields) {
    if (translations[field]) {
      result[field] = translations[field];
    }
  }

  result._translatedTo = languageCode;
  return result;
};

/**
 * Bulk apply translations to multiple entities
 */
translationSchema.statics.applyToEntities = async function(entities, type, languageCode, fields) {
  if (!entities.length || !languageCode) return entities;

  const ids = entities.map(e => e._id);

  const allTranslations = await this.find({
    translatableType: type,
    translatableId: { $in: ids },
    languageCode,
    field: { $in: fields },
  }).lean();

  // Group by entity ID
  const translationMap = {};
  for (const trans of allTranslations) {
    const key = trans.translatableId.toString();
    if (!translationMap[key]) {
      translationMap[key] = {};
    }
    translationMap[key][trans.field] = trans.value;
  }

  // Apply translations
  return entities.map(entity => {
    const entityObj = typeof entity.toObject === 'function' ? entity.toObject() : { ...entity };
    const entityTrans = translationMap[entity._id.toString()] || {};

    for (const field of fields) {
      if (entityTrans[field]) {
        entityObj[field] = entityTrans[field];
      }
    }

    entityObj._translatedTo = languageCode;
    return entityObj;
  });
};

const Translation = mongoose.model('Translation', translationSchema);

module.exports = Translation;
