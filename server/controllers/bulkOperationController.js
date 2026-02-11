const BulkOperation = require('../models/BulkOperation');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

/**
 * @desc    Create bulk operation
 * @route   POST /api/vendors/bulk-operations
 * @access  Vendor
 */
exports.createBulkOperation = async (req, res, next) => {
  try {
    const { type, productIds, operationData } = req.body;

    // Validate type
    const validTypes = [
      'price_update', 'inventory_update', 'status_update',
      'delete', 'category_update', 'tag_update',
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid operation type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    // Validate productIds
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'productIds array is required',
      });
    }

    // Verify all products belong to vendor
    const products = await Product.find({
      _id: { $in: productIds },
      vendor: req.vendor._id,
    });

    if (products.length !== productIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some products not found or not authorized',
      });
    }

    // Create bulk operation
    const bulkOperation = await BulkOperation.createOperation(
      req.vendor._id,
      type,
      productIds,
      operationData,
      req.user._id
    );

    // Process operation (in a real app, this would be queued)
    await processBulkOperation(bulkOperation);

    res.status(201).json({
      success: true,
      data: bulkOperation.getSummary(),
      message: 'Bulk operation created and processing',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process bulk operation
 * @param {Object} operation - BulkOperation document
 */
async function processBulkOperation(operation) {
  try {
    await operation.startProcessing();

    const { type, productIds, operationData } = operation;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const productId of productIds) {
      try {
        switch (type) {
          case 'price_update':
            await updateProductPrice(productId, operationData);
            break;
          case 'inventory_update':
            await updateProductInventory(productId, operationData);
            break;
          case 'status_update':
            await Product.findByIdAndUpdate(productId, {
              status: operationData.newStatus,
            });
            break;
          case 'delete':
            await Product.findByIdAndUpdate(productId, {
              status: 'inactive',
            });
            break;
          case 'category_update':
            await Product.findByIdAndUpdate(productId, {
              category: operationData.newCategory,
            });
            break;
          case 'tag_update':
            await updateProductTags(productId, operationData);
            break;
        }
        succeeded++;
      } catch (error) {
        failed++;
        await operation.addError(productId, error.message);
      }
      processed++;
      await operation.updateProgress(processed, succeeded, failed);
    }

    await operation.complete();
  } catch (error) {
    await operation.fail(error.message);
  }
}

/**
 * Update product price
 */
async function updateProductPrice(productId, { priceChange, priceValue }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  let newPrice = product.price.amount;

  switch (priceChange) {
    case 'set':
      newPrice = priceValue;
      break;
    case 'increase':
      newPrice += priceValue;
      break;
    case 'decrease':
      newPrice -= priceValue;
      break;
    case 'percent_increase':
      newPrice *= (1 + priceValue / 100);
      break;
    case 'percent_decrease':
      newPrice *= (1 - priceValue / 100);
      break;
  }

  product.price.amount = Math.max(0, Math.round(newPrice * 100) / 100);
  await product.save();

  // Also update variants if product has variants
  if (product.hasVariants) {
    await ProductVariant.bulkUpdateVariants(productId, {
      field: 'price',
      action: priceChange,
      value: priceValue,
    });
  }
}

/**
 * Update product inventory
 */
async function updateProductInventory(productId, { inventoryChange, inventoryValue }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  if (inventoryChange === 'set') {
    product.inventory.quantity = Math.max(0, inventoryValue);
  } else if (inventoryChange === 'adjust') {
    product.inventory.quantity = Math.max(0, product.inventory.quantity + inventoryValue);
  }

  await product.save();

  // Also update variants if product has variants
  if (product.hasVariants) {
    await ProductVariant.bulkUpdateVariants(productId, {
      field: 'quantity',
      action: inventoryChange,
      value: inventoryValue,
    });
  }
}

/**
 * Update product tags
 */
async function updateProductTags(productId, { tagsToAdd, tagsToRemove }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // Remove tags
  if (tagsToRemove && tagsToRemove.length > 0) {
    product.tags = product.tags.filter(tag => !tagsToRemove.includes(tag));
  }

  // Add tags
  if (tagsToAdd && tagsToAdd.length > 0) {
    const newTags = tagsToAdd.filter(tag => !product.tags.includes(tag));
    product.tags.push(...newTags);
  }

  await product.save();
}

/**
 * @desc    Get vendor's bulk operations
 * @route   GET /api/vendors/bulk-operations
 * @access  Vendor
 */
exports.getBulkOperations = async (req, res, next) => {
  try {
    const { limit = 20, status } = req.query;

    let query = { vendor: req.vendor._id };
    if (status) {
      query.status = status;
    }

    const operations = await BulkOperation.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('requestedBy', 'email profile.firstName profile.lastName');

    res.status(200).json({
      success: true,
      data: operations.map(op => op.getSummary()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single bulk operation
 * @route   GET /api/vendors/bulk-operations/:id
 * @access  Vendor
 */
exports.getBulkOperation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const operation = await BulkOperation.findOne({
      _id: id,
      vendor: req.vendor._id,
    }).populate('requestedBy', 'email profile.firstName profile.lastName');

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Bulk operation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...operation.getSummary(),
        errors: operation.errors.slice(0, 100), // Return first 100 errors
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel bulk operation
 * @route   DELETE /api/vendors/bulk-operations/:id
 * @access  Vendor
 */
exports.cancelBulkOperation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const operation = await BulkOperation.findOne({
      _id: id,
      vendor: req.vendor._id,
    });

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Bulk operation not found',
      });
    }

    await operation.cancel();

    res.status(200).json({
      success: true,
      data: operation.getSummary(),
      message: 'Bulk operation cancelled',
    });
  } catch (error) {
    if (error.message === 'Cannot cancel completed or failed operation') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
