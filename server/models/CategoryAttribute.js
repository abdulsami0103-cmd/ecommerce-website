const mongoose = require('mongoose');

const categoryAttributeSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
    },
    // Whether this attribute is required for products in this category
    isRequired: { type: Boolean, default: false },
    // Whether this was inherited from a parent category
    isInherited: { type: Boolean, default: false },
    inheritedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    // Display order within the category
    sortOrder: { type: Number, default: 0 },
    // Override global attribute settings for this category
    overrides: {
      isRequired: { type: Boolean },
      defaultValue: mongoose.Schema.Types.Mixed,
      // Override options for select/multi_select types
      options: [{
        value: { type: String },
        label: { type: String },
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - each attribute can only be assigned once per category
categoryAttributeSchema.index({ category: 1, attribute: 1 }, { unique: true });
categoryAttributeSchema.index({ category: 1, sortOrder: 1 });
categoryAttributeSchema.index({ attribute: 1 });

// Static method to get attributes for a category (including inherited)
categoryAttributeSchema.statics.getAttributesForCategory = async function (categoryId) {
  const Category = mongoose.model('Category');
  const category = await Category.findById(categoryId);

  if (!category) {
    return { own: [], inherited: [] };
  }

  // Get directly assigned attributes
  const ownAttributes = await this.find({ category: categoryId, isInherited: false })
    .populate('attribute')
    .sort('sortOrder');

  // Get inherited attributes from ancestors
  let inheritedAttributes = [];
  if (category.ancestors && category.ancestors.length > 0) {
    inheritedAttributes = await this.find({
      category: { $in: category.ancestors },
      isInherited: false,
    })
      .populate('attribute')
      .populate('category', 'name')
      .sort('sortOrder');

    // Mark as inherited and add source
    inheritedAttributes = inheritedAttributes.map(attr => ({
      ...attr.toObject(),
      isInherited: true,
      inheritedFrom: attr.category,
    }));
  }

  return {
    own: ownAttributes,
    inherited: inheritedAttributes,
  };
};

// Static method to propagate attributes to child categories
categoryAttributeSchema.statics.propagateToChildren = async function (categoryId, attributeId) {
  const Category = mongoose.model('Category');
  const children = await Category.find({ parent: categoryId });

  for (const child of children) {
    // Check if already exists
    const existing = await this.findOne({
      category: child._id,
      attribute: attributeId,
    });

    if (!existing) {
      await this.create({
        category: child._id,
        attribute: attributeId,
        isInherited: true,
        inheritedFrom: categoryId,
      });

      // Recursively propagate to grandchildren
      await this.propagateToChildren(child._id, attributeId);
    }
  }
};

module.exports = mongoose.model('CategoryAttribute', categoryAttributeSchema);
