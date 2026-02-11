const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    // Shopify-style option values (max 3 options)
    option1: {
      type: String,
      default: null,
    },
    option2: {
      type: String,
      default: null,
    },
    option3: {
      type: String,
      default: null,
    },
    // Combined title: "Red / Large / Cotton"
    title: {
      type: String,
      required: true,
    },
    // Pricing
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
    },
    // Inventory
    sku: {
      type: String,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    // Physical attributes
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz'],
      default: 'kg',
    },
    // Variant-specific image
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductImage',
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Display order
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
productVariantSchema.index({ product: 1, position: 1 });
productVariantSchema.index({ product: 1, sku: 1 });
productVariantSchema.index({ product: 1, option1: 1, option2: 1, option3: 1 });

// Pre-save: Generate title from options
productVariantSchema.pre('save', function (next) {
  if (this.isModified('option1') || this.isModified('option2') || this.isModified('option3') || !this.title) {
    const options = [this.option1, this.option2, this.option3].filter(Boolean);
    this.title = options.length > 0 ? options.join(' / ') : 'Default';
  }
  next();
});

// Static: Generate variants from product options (cartesian product)
productVariantSchema.statics.generateVariants = async function (productId, options, basePrice) {
  // options format: [{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['Red', 'Blue'] }]

  if (!options || options.length === 0) {
    // Create single default variant
    return this.create({
      product: productId,
      title: 'Default',
      price: basePrice,
      position: 0,
    });
  }

  // Generate cartesian product
  const cartesian = (...arrays) => {
    return arrays.reduce((acc, arr) => {
      return acc.flatMap(x => arr.map(y => [...x, y]));
    }, [[]]);
  };

  const optionValues = options.map(opt => opt.values);
  const combinations = cartesian(...optionValues);

  // Create variant documents
  const variants = combinations.map((combo, index) => {
    const variant = {
      product: productId,
      price: basePrice,
      position: index,
    };

    // Assign option values
    combo.forEach((value, i) => {
      variant[`option${i + 1}`] = value;
    });

    return variant;
  });

  // Delete existing variants and create new ones
  await this.deleteMany({ product: productId });
  return this.insertMany(variants);
};

// Static: Get all variants for a product
productVariantSchema.statics.getProductVariants = async function (productId) {
  return this.find({ product: productId, isActive: true })
    .populate('image')
    .sort('position');
};

// Static: Bulk update variants (price, stock)
productVariantSchema.statics.bulkUpdateVariants = async function (productId, updates) {
  // updates format: { field: 'price', action: 'set'|'increase'|'decrease'|'percent_increase'|'percent_decrease', value: 10 }
  const { field, action, value } = updates;

  let updateQuery = {};

  if (field === 'price') {
    switch (action) {
      case 'set':
        updateQuery = { price: value };
        break;
      case 'increase':
        updateQuery = { $inc: { price: value } };
        break;
      case 'decrease':
        updateQuery = { $inc: { price: -value } };
        break;
      case 'percent_increase':
        // Need to use aggregation pipeline for percentage
        return this.updateMany(
          { product: productId },
          [{ $set: { price: { $multiply: ['$price', 1 + (value / 100)] } } }]
        );
      case 'percent_decrease':
        return this.updateMany(
          { product: productId },
          [{ $set: { price: { $multiply: ['$price', 1 - (value / 100)] } } }]
        );
      default:
        updateQuery = { price: value };
    }
  } else if (field === 'quantity') {
    switch (action) {
      case 'set':
        updateQuery = { quantity: value };
        break;
      case 'adjust':
        updateQuery = { $inc: { quantity: value } };
        break;
      default:
        updateQuery = { quantity: value };
    }
  }

  return this.updateMany({ product: productId }, updateQuery);
};

// Static: Get variant by options
productVariantSchema.statics.findByOptions = async function (productId, option1, option2, option3) {
  const query = { product: productId, isActive: true };
  if (option1) query.option1 = option1;
  if (option2) query.option2 = option2;
  if (option3) query.option3 = option3;
  return this.findOne(query);
};

// Static: Calculate total inventory
productVariantSchema.statics.getTotalInventory = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isActive: true } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total || 0;
};

// Instance method: Check if variant is in stock
productVariantSchema.methods.isInStock = function () {
  if (!this.trackInventory) return true;
  return this.quantity > 0;
};

module.exports = mongoose.model('ProductVariant', productVariantSchema);
