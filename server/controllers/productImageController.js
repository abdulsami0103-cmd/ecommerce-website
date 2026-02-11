const ProductImage = require('../models/ProductImage');
const Product = require('../models/Product');
const imageProcessor = require('../services/imageProcessor');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Upload product images
 * @route   POST /api/products/:id/images
 * @access  Vendor (owner)
 */
exports.uploadImages = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

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

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
      });
    }

    // Check image count limit (max 10)
    const existingCount = await ProductImage.countDocuments({ product: productId });
    if (existingCount + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload more than 10 images. Current: ${existingCount}, Trying to add: ${req.files.length}`,
      });
    }

    const uploadedImages = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        // Validate image
        const validation = await imageProcessor.validateImage(file.buffer);
        if (!validation.valid) {
          errors.push({ filename: file.originalname, error: validation.error });
          continue;
        }

        // Process and upload image
        const result = await imageProcessor.processAndUploadProductImage(
          file.buffer,
          req.vendor._id.toString(),
          productId
        );

        if (!result.success) {
          errors.push({ filename: file.originalname, error: result.error });
          continue;
        }

        // Create ProductImage document
        const sortOrder = existingCount + i;
        const isPrimary = existingCount === 0 && i === 0;

        const productImage = await ProductImage.create({
          product: productId,
          vendor: req.vendor._id,
          url: result.url,
          publicId: result.publicId,
          altText: file.originalname.replace(/\.[^/.]+$/, ''),
          sortOrder,
          isPrimary,
          thumbnails: result.thumbnails,
          metadata: result.metadata,
        });

        uploadedImages.push(productImage);

        // Update product primary image if this is first image
        if (isPrimary) {
          await Product.findByIdAndUpdate(productId, {
            primaryImageId: productImage._id,
          });
        }
      } catch (error) {
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    // Update product image count
    const newCount = await ProductImage.countDocuments({ product: productId });
    await Product.findByIdAndUpdate(productId, { imageCount: newCount });

    res.status(201).json({
      success: true,
      data: {
        uploaded: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `${uploadedImages.length} image(s) uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all images for a product
 * @route   GET /api/products/:id/images
 * @access  Public
 */
exports.getProductImages = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const images = await ProductImage.getProductImages(productId);

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product image
 * @route   DELETE /api/products/:id/images/:imageId
 * @access  Vendor (owner)
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { id: productId, imageId } = req.params;

    // Find image and verify ownership
    const image = await ProductImage.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    if (image.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this image',
      });
    }

    // Delete image files (works for both local and cloudinary)
    if (image.publicId) {
      await imageProcessor.deleteProductImage(image.publicId, image.thumbnailPublicIds || {});
    }

    const wasPrimary = image.isPrimary;

    // Delete from database
    await image.deleteOne();

    // Update image count
    const newCount = await ProductImage.countDocuments({ product: productId });
    await Product.findByIdAndUpdate(productId, { imageCount: newCount });

    // If deleted image was primary, set new primary
    if (wasPrimary && newCount > 0) {
      const newPrimary = await ProductImage.findOne({ product: productId }).sort('sortOrder');
      if (newPrimary) {
        newPrimary.isPrimary = true;
        await newPrimary.save();
        await Product.findByIdAndUpdate(productId, { primaryImageId: newPrimary._id });
      }
    } else if (newCount === 0) {
      await Product.findByIdAndUpdate(productId, { primaryImageId: null });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder product images
 * @route   PUT /api/products/:id/images/reorder
 * @access  Vendor (owner)
 */
exports.reorderImages = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'imageIds array is required',
      });
    }

    // Verify product ownership
    const product = await Product.findById(productId);
    if (!product || product.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this product',
      });
    }

    // Reorder images
    await ProductImage.reorderImages(productId, imageIds);

    // Set first image as primary
    if (imageIds.length > 0) {
      await ProductImage.updateMany({ product: productId }, { isPrimary: false });
      const firstImage = await ProductImage.findByIdAndUpdate(
        imageIds[0],
        { isPrimary: true, sortOrder: 0 },
        { new: true }
      );
      if (firstImage) {
        await Product.findByIdAndUpdate(productId, { primaryImageId: firstImage._id });
      }
    }

    const reorderedImages = await ProductImage.getProductImages(productId);

    res.status(200).json({
      success: true,
      data: reorderedImages,
      message: 'Images reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update image (alt text, set as primary)
 * @route   PUT /api/products/:id/images/:imageId
 * @access  Vendor (owner)
 */
exports.updateImage = async (req, res, next) => {
  try {
    const { id: productId, imageId } = req.params;
    const { altText, isPrimary } = req.body;

    // Find image and verify ownership
    const image = await ProductImage.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    if (image.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this image',
      });
    }

    // Update fields
    if (altText !== undefined) {
      image.altText = altText;
    }

    if (isPrimary === true) {
      // Use static method to set primary (handles unsetting others)
      await ProductImage.setPrimaryImage(productId, imageId);
      await Product.findByIdAndUpdate(productId, { primaryImageId: imageId });
    }

    await image.save();

    res.status(200).json({
      success: true,
      data: image,
      message: 'Image updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get primary image URL for a product
 * @route   GET /api/products/:id/images/primary
 * @access  Public
 */
exports.getPrimaryImage = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { size = 'medium' } = req.query;

    const url = await ProductImage.getPrimaryImageUrl(productId, size);

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};
