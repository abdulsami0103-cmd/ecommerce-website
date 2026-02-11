const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Currency code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    name: {
      type: String,
      required: [true, 'Currency name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Currency symbol is required'],
      trim: true,
    },
    symbolPosition: {
      type: String,
      enum: ['before', 'after'],
      default: 'before',
    },
    decimalPlaces: {
      type: Number,
      min: 0,
      max: 4,
      default: 2,
    },
    decimalSeparator: {
      type: String,
      default: '.',
    },
    thousandSeparator: {
      type: String,
      default: ',',
    },
    // Exchange rate (relative to base currency USD)
    exchangeRate: {
      type: Number,
      required: true,
      min: 0,
    },
    isBaseCurrency: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Rate tracking
    lastRateUpdate: {
      type: Date,
      default: Date.now,
    },
    rateSource: {
      type: String,
      enum: ['manual', 'api', 'system'],
      default: 'manual',
    },
    // Country/region info
    countries: [{
      type: String,
      trim: true,
    }],
    // Formatting examples
    formatExample: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
currencySchema.index({ isActive: 1, sortOrder: 1 });
currencySchema.index({ isBaseCurrency: 1 });
currencySchema.index({ isDefault: 1 });

// Ensure only one base currency
currencySchema.pre('save', async function(next) {
  if (this.isBaseCurrency && this.isModified('isBaseCurrency')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isBaseCurrency: true },
      { isBaseCurrency: false }
    );
  }

  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }

  // Update format example
  this.formatExample = this.format(1234.56);

  next();
});

/**
 * Format amount in this currency
 */
currencySchema.methods.format = function(amount) {
  const fixed = amount.toFixed(this.decimalPlaces);
  const [intPart, decPart] = fixed.split('.');

  // Add thousand separators
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);

  const number = decPart
    ? `${formattedInt}${this.decimalSeparator}${decPart}`
    : formattedInt;

  return this.symbolPosition === 'before'
    ? `${this.symbol}${number}`
    : `${number} ${this.symbol}`;
};

/**
 * Get all active currencies
 */
currencySchema.statics.getActiveCurrencies = async function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, code: 1 })
    .select('-__v')
    .lean();
};

/**
 * Get base currency (usually USD)
 */
currencySchema.statics.getBaseCurrency = async function() {
  let baseCurrency = await this.findOne({ isBaseCurrency: true }).lean();

  if (!baseCurrency) {
    baseCurrency = await this.findOne({ code: 'USD' }).lean();
  }

  return baseCurrency;
};

/**
 * Get default display currency
 */
currencySchema.statics.getDefaultCurrency = async function() {
  let defaultCurrency = await this.findOne({ isDefault: true, isActive: true }).lean();

  if (!defaultCurrency) {
    defaultCurrency = await this.findOne({ code: 'PKR', isActive: true }).lean();
  }

  if (!defaultCurrency) {
    defaultCurrency = await this.getBaseCurrency();
  }

  return defaultCurrency;
};

/**
 * Get currency by code
 */
currencySchema.statics.getByCode = async function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true }).lean();
};

/**
 * Convert amount between currencies
 */
currencySchema.statics.convert = async function(amount, fromCode, toCode) {
  if (fromCode === toCode) return amount;

  const [fromCurrency, toCurrency] = await Promise.all([
    this.getByCode(fromCode),
    this.getByCode(toCode),
  ]);

  if (!fromCurrency || !toCurrency) {
    throw new Error(`Currency not found: ${!fromCurrency ? fromCode : toCode}`);
  }

  // Convert to base currency (USD), then to target
  const inBase = amount / fromCurrency.exchangeRate;
  const converted = inBase * toCurrency.exchangeRate;

  return Number(converted.toFixed(toCurrency.decimalPlaces));
};

/**
 * Format amount in specified currency
 */
currencySchema.statics.formatAmount = async function(amount, currencyCode) {
  const currency = await this.getByCode(currencyCode);

  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }

  const fixed = amount.toFixed(currency.decimalPlaces);
  const [intPart, decPart] = fixed.split('.');

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);

  const number = decPart
    ? `${formattedInt}${currency.decimalSeparator}${decPart}`
    : formattedInt;

  return currency.symbolPosition === 'before'
    ? `${currency.symbol}${number}`
    : `${number} ${currency.symbol}`;
};

/**
 * Update exchange rate
 */
currencySchema.statics.updateRate = async function(code, rate, source = 'api') {
  const CurrencyRateLog = mongoose.model('CurrencyRateLog');

  const currency = await this.findOne({ code: code.toUpperCase() });
  if (!currency) {
    throw new Error(`Currency not found: ${code}`);
  }

  const previousRate = currency.exchangeRate;

  // Log the change
  await CurrencyRateLog.create({
    currencyCode: currency.code,
    rate,
    previousRate,
    source,
    changePercent: previousRate
      ? ((rate - previousRate) / previousRate) * 100
      : 0,
  });

  // Update currency
  currency.exchangeRate = rate;
  currency.lastRateUpdate = new Date();
  currency.rateSource = source;
  await currency.save();

  return currency;
};

/**
 * Initialize default currencies
 */
currencySchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      symbolPosition: 'before',
      decimalPlaces: 2,
      exchangeRate: 1,
      isBaseCurrency: true,
      isActive: true,
      sortOrder: 1,
      countries: ['US'],
    },
    {
      code: 'PKR',
      name: 'Pakistani Rupee',
      symbol: 'Rs',
      symbolPosition: 'before',
      decimalPlaces: 0,
      exchangeRate: 278.50,
      isBaseCurrency: false,
      isDefault: true,
      isActive: true,
      sortOrder: 2,
      countries: ['PK'],
    },
    {
      code: 'AED',
      name: 'UAE Dirham',
      symbol: 'د.إ',
      symbolPosition: 'after',
      decimalPlaces: 2,
      exchangeRate: 3.67,
      isBaseCurrency: false,
      isActive: true,
      sortOrder: 3,
      countries: ['AE'],
    },
    {
      code: 'SAR',
      name: 'Saudi Riyal',
      symbol: 'ر.س',
      symbolPosition: 'after',
      decimalPlaces: 2,
      exchangeRate: 3.75,
      isBaseCurrency: false,
      isActive: true,
      sortOrder: 4,
      countries: ['SA'],
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      symbolPosition: 'before',
      decimalPlaces: 2,
      exchangeRate: 0.79,
      isBaseCurrency: false,
      isActive: true,
      sortOrder: 5,
      countries: ['GB'],
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      symbolPosition: 'before',
      decimalPlaces: 2,
      exchangeRate: 0.92,
      isBaseCurrency: false,
      isActive: true,
      sortOrder: 6,
      countries: ['DE', 'FR', 'IT', 'ES'],
    },
  ];

  for (const currency of defaults) {
    const existing = await this.findOne({ code: currency.code });
    if (!existing) {
      await this.create(currency);
      console.log(`[Currency] Created default currency: ${currency.code}`);
    }
  }
};

const Currency = mongoose.model('Currency', currencySchema);

module.exports = Currency;
