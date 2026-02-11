const Attribute = require('../models/Attribute');
const CategoryAttribute = require('../models/CategoryAttribute');
const Category = require('../models/Category');

// @desc    Get all attributes
// @route   GET /api/attributes
// @access  Private (Admin)
exports.getAttributes = async (req, res) => {
  try {
    const { type, isFilterable, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isFilterable !== undefined) query.isFilterable = isFilterable === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const attributes = await Attribute.find(query)
      .sort('sortOrder name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attribute.countDocuments(query);

    res.json({
      success: true,
      data: attributes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single attribute
// @route   GET /api/attributes/:id
// @access  Private (Admin)
exports.getAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    res.json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create attribute
// @route   POST /api/attributes
// @access  Private (Admin)
exports.createAttribute = async (req, res) => {
  try {
    const { name, type, description, options, validation, isFilterable, isSearchable, isVisibleOnProduct, isRequired, sortOrder } = req.body;

    // Validate options for select types
    if (['select', 'multi_select', 'color'].includes(type) && (!options || options.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Options are required for select, multi_select, and color types',
      });
    }

    const attribute = await Attribute.create({
      name,
      type,
      description,
      options,
      validation,
      isFilterable,
      isSearchable,
      isVisibleOnProduct,
      isRequired,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Attribute created',
      data: attribute,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attribute with this name already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update attribute
// @route   PUT /api/attributes/:id
// @access  Private (Admin)
exports.updateAttribute = async (req, res) => {
  try {
    const { name, type, description, options, validation, isFilterable, isSearchable, isVisibleOnProduct, isRequired, sortOrder, isActive } = req.body;

    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    // Prevent changing type if attribute is in use
    if (type && type !== attribute.type) {
      const inUse = await CategoryAttribute.countDocuments({ attribute: attribute._id });
      if (inUse > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change type of attribute that is assigned to categories',
        });
      }
    }

    if (name !== undefined) attribute.name = name;
    if (type !== undefined) attribute.type = type;
    if (description !== undefined) attribute.description = description;
    if (options !== undefined) attribute.options = options;
    if (validation !== undefined) attribute.validation = validation;
    if (isFilterable !== undefined) attribute.isFilterable = isFilterable;
    if (isSearchable !== undefined) attribute.isSearchable = isSearchable;
    if (isVisibleOnProduct !== undefined) attribute.isVisibleOnProduct = isVisibleOnProduct;
    if (isRequired !== undefined) attribute.isRequired = isRequired;
    if (sortOrder !== undefined) attribute.sortOrder = sortOrder;
    if (isActive !== undefined) attribute.isActive = isActive;

    await attribute.save();

    res.json({
      success: true,
      message: 'Attribute updated',
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete attribute
// @route   DELETE /api/attributes/:id
// @access  Private (Admin)
exports.deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    // Check if attribute is in use
    const inUse = await CategoryAttribute.countDocuments({ attribute: attribute._id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete attribute that is assigned to categories. Remove from all categories first.',
      });
    }

    await attribute.deleteOne();

    res.json({
      success: true,
      message: 'Attribute deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add option to attribute
// @route   POST /api/attributes/:id/options
// @access  Private (Admin)
exports.addOption = async (req, res) => {
  try {
    const { value, label, colorHex, sortOrder } = req.body;

    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    if (!['select', 'multi_select', 'color'].includes(attribute.type)) {
      return res.status(400).json({
        success: false,
        message: 'Options can only be added to select, multi_select, or color type attributes',
      });
    }

    // Check for duplicate value
    if (attribute.options.some(opt => opt.value === value)) {
      return res.status(400).json({
        success: false,
        message: 'Option with this value already exists',
      });
    }

    attribute.options.push({
      value,
      label: label || value,
      colorHex,
      sortOrder: sortOrder || attribute.options.length,
    });

    await attribute.save();

    res.json({
      success: true,
      message: 'Option added',
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update option
// @route   PUT /api/attributes/:id/options/:optionId
// @access  Private (Admin)
exports.updateOption = async (req, res) => {
  try {
    const { value, label, colorHex, sortOrder } = req.body;

    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    const option = attribute.options.id(req.params.optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    if (value !== undefined) option.value = value;
    if (label !== undefined) option.label = label;
    if (colorHex !== undefined) option.colorHex = colorHex;
    if (sortOrder !== undefined) option.sortOrder = sortOrder;

    await attribute.save();

    res.json({
      success: true,
      message: 'Option updated',
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete option
// @route   DELETE /api/attributes/:id/options/:optionId
// @access  Private (Admin)
exports.deleteOption = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    const option = attribute.options.id(req.params.optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    option.deleteOne();
    await attribute.save();

    res.json({
      success: true,
      message: 'Option deleted',
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attributes for a category (including inherited)
// @route   GET /api/categories/:id/attributes
// @access  Public
exports.getCategoryAttributes = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const attributes = await CategoryAttribute.getAttributesForCategory(req.params.id);

    res.json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign attribute to category
// @route   POST /api/categories/:id/attributes
// @access  Private (Admin)
exports.assignAttributeToCategory = async (req, res) => {
  try {
    const { attributeId, isRequired, sortOrder, propagateToChildren } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    // Check if already assigned
    const existing = await CategoryAttribute.findOne({
      category: req.params.id,
      attribute: attributeId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attribute already assigned to this category',
      });
    }

    const categoryAttribute = await CategoryAttribute.create({
      category: req.params.id,
      attribute: attributeId,
      isRequired: isRequired || false,
      sortOrder: sortOrder || 0,
    });

    // Propagate to children if requested
    if (propagateToChildren) {
      await CategoryAttribute.propagateToChildren(req.params.id, attributeId);
    }

    res.status(201).json({
      success: true,
      message: 'Attribute assigned to category',
      data: categoryAttribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category attribute assignment
// @route   PUT /api/categories/:catId/attributes/:attrId
// @access  Private (Admin)
exports.updateCategoryAttribute = async (req, res) => {
  try {
    const { isRequired, sortOrder, overrides } = req.body;

    const categoryAttribute = await CategoryAttribute.findOne({
      category: req.params.catId,
      attribute: req.params.attrId,
    });

    if (!categoryAttribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not assigned to this category',
      });
    }

    if (isRequired !== undefined) categoryAttribute.isRequired = isRequired;
    if (sortOrder !== undefined) categoryAttribute.sortOrder = sortOrder;
    if (overrides !== undefined) categoryAttribute.overrides = overrides;

    await categoryAttribute.save();

    res.json({
      success: true,
      message: 'Category attribute updated',
      data: categoryAttribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove attribute from category
// @route   DELETE /api/categories/:catId/attributes/:attrId
// @access  Private (Admin)
exports.removeAttributeFromCategory = async (req, res) => {
  try {
    const categoryAttribute = await CategoryAttribute.findOne({
      category: req.params.catId,
      attribute: req.params.attrId,
    });

    if (!categoryAttribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not assigned to this category',
      });
    }

    await categoryAttribute.deleteOne();

    // Also remove inherited assignments from child categories
    await CategoryAttribute.deleteMany({
      inheritedFrom: req.params.catId,
      attribute: req.params.attrId,
    });

    res.json({
      success: true,
      message: 'Attribute removed from category',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reorder category attributes
// @route   PUT /api/categories/:id/attributes/reorder
// @access  Private (Admin)
exports.reorderCategoryAttributes = async (req, res) => {
  try {
    const { order } = req.body; // Array of { attributeId, sortOrder }

    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be an array',
      });
    }

    const bulkOps = order.map(item => ({
      updateOne: {
        filter: { category: req.params.id, attribute: item.attributeId },
        update: { sortOrder: item.sortOrder },
      },
    }));

    await CategoryAttribute.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Attributes reordered',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
