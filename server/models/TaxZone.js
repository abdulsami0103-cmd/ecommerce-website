const mongoose = require('mongoose');

const taxZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },

  // Geographic matching (checked in order of specificity)
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2,
  }, // ISO 3166-1 alpha-2 (e.g., 'PK' for Pakistan)

  stateCode: {
    type: String,
    uppercase: true,
    trim: true,
  }, // Optional state/province code

  city: {
    type: String,
    trim: true,
  }, // Optional city name

  zipPatterns: [{
    type: String,
    trim: true,
  }], // Regex patterns for ZIP codes

  // Priority for matching (higher = checked first)
  priority: { type: Number, default: 0 },

  // Default zone used when no other zone matches
  isDefault: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes
taxZoneSchema.index({ countryCode: 1, stateCode: 1, isActive: 1 });
taxZoneSchema.index({ isDefault: 1 });
taxZoneSchema.index({ priority: -1 });
taxZoneSchema.index({ isActive: 1, priority: -1 });

// Ensure only one default zone
taxZoneSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Static method to find matching zone for an address
taxZoneSchema.statics.findMatchingZone = async function(address) {
  const { country, state, city, zipCode } = address;

  // Normalize inputs
  const countryCode = this.normalizeCountryCode(country);
  const normalizedState = state?.toUpperCase().trim();
  const normalizedCity = city?.toLowerCase().trim();
  const normalizedZip = zipCode?.trim();

  // Get all active zones for the country, sorted by priority
  const zones = await this.find({
    countryCode,
    isActive: true,
  }).sort({ priority: -1 });

  for (const zone of zones) {
    let isMatch = true;

    // Check state if specified in zone
    if (zone.stateCode && zone.stateCode !== normalizedState) {
      isMatch = false;
      continue;
    }

    // Check city if specified in zone
    if (zone.city && zone.city.toLowerCase() !== normalizedCity) {
      isMatch = false;
      continue;
    }

    // Check ZIP patterns if specified
    if (zone.zipPatterns && zone.zipPatterns.length > 0 && normalizedZip) {
      const zipMatches = zone.zipPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(normalizedZip);
        } catch (e) {
          return false;
        }
      });
      if (!zipMatches) {
        isMatch = false;
        continue;
      }
    }

    if (isMatch) return zone;
  }

  // Return default zone if no match
  return this.findOne({ isDefault: true, isActive: true });
};

// Static helper to normalize country codes
taxZoneSchema.statics.normalizeCountryCode = function(country) {
  if (!country) return null;

  // Common country name to code mappings
  const countryMap = {
    'pakistan': 'PK',
    'united states': 'US',
    'usa': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'india': 'IN',
    'china': 'CN',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'saudi arabia': 'SA',
    'canada': 'CA',
    'australia': 'AU',
    'germany': 'DE',
    'france': 'FR',
    // Add more as needed
  };

  const normalized = country.toLowerCase().trim();

  // If already a 2-letter code, return uppercase
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }

  return countryMap[normalized] || country.toUpperCase().substring(0, 2);
};

// Static method to get all zones grouped by country
taxZoneSchema.statics.getZonesByCountry = async function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$countryCode',
        zones: { $push: '$$ROOT' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to setup default Pakistan zone
taxZoneSchema.statics.setupPakistanDefaults = async function() {
  const existing = await this.findOne({ countryCode: 'PK' });
  if (existing) return existing;

  return this.create({
    name: 'Pakistan',
    description: 'Default tax zone for Pakistan',
    countryCode: 'PK',
    isDefault: true,
    isActive: true,
    priority: 0,
  });
};

module.exports = mongoose.model('TaxZone', taxZoneSchema);
