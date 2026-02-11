const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');

/**
 * @desc    Generate variants from product options (cartesian product)
 * @route   POST /api/products/:id/variants/generate
 * @access  Vendor (owner)
 */
exports.generateVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { options, basePrice } = req.body;

    // options format: [{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['Red', 'Blue'] }]

    // Find product and verify ownership
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Validate options (max 3)
    if (options && options.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 option types allowed',
      });
    }

    // Use product price if basePrice not provided
    const price = basePrice || product.price.amount;

    // Generate variants
    const variants = await ProductVariant.generateVariants(productId, options, price);

    // Update product with options and hasVariants flag
    product.options = options || [];
    product.hasVariants = variants.length > 1;
    await product.save();

    res.status(201).json({
      success: true,
      data: {
        variants,
        count: Array.isArray(variants) ? variants.length : 1,
      },
      message: `${Array.isArray(variants) ? variants.length : 1} variant(s) generated`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all variants for a product
 * @route   GET /api/products/:id/variants
 * @access  Public
 */
exports.getVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const variants = await ProductVariant.getProductVariants(productId);

    res.status(200).json({
      success: true,
      data: variants,
      count: variants.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single variant
 * @route   GET /api/products/:id/variants/:variantId
 * @access  Public
 */
exports.getVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await ProductVariant.findById(variantId).populate('image');

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
      });
    }

    res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a single variant
 * @route   PUT /api/products/:id/variants/:variantId
 * @access  Vendor (owner)
 */
exports.updateVariant = async (req, res, next) => {
  try {
    const { id: productId, variantId } = req.params;
    const updates = req.body;

    // Find variant
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
      });
    }

    // Verify product ownership
    const product = await Product.findById(productId);
    if (!product || product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this variant',
      });
    }

    // Allowed update fields
    const allowedFields = [
      'price', 'compareAtPrice', 'sku', 'barcode',
      'quantity', 'trackInventory', 'weight', 'weightUnit',
      'image', 'isActive', 'position',
    ];

    // Apply updates
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        variant[field] = updates[field];
      }
    });

    await variant.save();

    res.status(200).json({
      success: true,
      data: variant,
      message: 'Variant updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update variants (price or stock)
 * @route   PUT /api/products/:id/variants/bulk
 * @access  Vendor (owner)
 */
exports.bulkUpdateVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { field, action, value, variantIds } = req.body;

    // Verify product ownership
    const product = await Product.findById(productId);
    if (!product || product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Validate input
    if (!field || !action || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'field, action, and value are required',
      });
    }

    if (!['price', 'quantity'].includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'field must be price or quantity',
      });
    }

    let result;

    if (variantIds && variantIds.length > 0) {
      // Update specific variants
      const bulkOps = variantIds.map(variantId => {
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
          }
        } else if (field === 'quantity') {
          switch (action) {
            case 'set':
              updateQuery = { quantity: value };
              break;
            case 'adjust':
              updateQuery = { $inc: { quantity: value } };
              break;
          }
        }

        return {
          updateOne: {
            filter: { _id: variantId, product: productId },
            update: updateQuery,
          },
        };
      });

      result = await ProductVariant.bulkWrite(bulkOps);
    } else {
      // Update all variants for the product
      result = await ProductVariant.bulkUpdateVariants(productId, { field, action, value });
    }

    const updatedVariants = await ProductVariant.getProductVariants(productId);

    res.status(200).json({
      success: true,
      data: updatedVariants,
      message: `${result.modifiedCount || updatedVariants.length} variant(s) updated`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a variant
 * @route   DELETE /api/products/:id/variants/:variantId
 * @access  Vendor (owner)
 */
exports.deleteVariant = async (req, res, next) => {
  try {
    const { id: productId, variantId } = req.params;

    // Verify product ownership
    const product = await Product.findById(productId);
    if (!product || product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    const variant = await ProductVariant.findOneAndDelete({
      _id: variantId,
      product: productId,
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
      });
    }

    // Check if any variants remain
    const remainingCount = await ProductVariant.countDocuments({ product: productId });
    if (remainingCount === 0) {
      product.hasVariants = false;
      product.options = [];
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all variants for a product
 * @route   DELETE /api/products/:id/variants
 * @access  Vendor (owner)
 */
exports.deleteAllVariants = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    // Verify product ownership
    const product = await Product.findById(productId);
    if (!product || product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    const result = await ProductVariant.deleteMany({ product: productId });

    // Update product
    product.hasVariants = false;
    product.options = [];
    await product.save();

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} variant(s) deleted`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get total inventory across all variants
 * @route   GET /api/products/:id/variants/inventory
 * @access  Public
 */
exports.getTotalInventory = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const total = await ProductVariant.getTotalInventory(productId);

    res.status(200).json({
      success: true,
      data: { totalInventory: total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find variant by option values
 * @route   GET /api/products/:id/variants/find
 * @access  Public
 */
exports.findVariantByOptions = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { option1, option2, option3 } = req.query;

    const variant = await ProductVariant.findByOptions(
      productId,
      option1,
      option2,
      option3
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found for specified options',
      });
    }

    res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    next(error);
  }
};
