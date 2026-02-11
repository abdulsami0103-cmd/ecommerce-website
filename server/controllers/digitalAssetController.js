const DigitalAsset = require('../models/DigitalAsset');
const DownloadLog = require('../models/DownloadLog');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { cloudinary, uploadDigital } = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Upload digital asset
 * @route   POST /api/products/:id/digital-assets
 * @access  Vendor (owner)
 */
exports.uploadDigitalAsset = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { downloadLimit, expiryHours, description, version, assetType } = req.body;

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

    // Verify product is digital type
    if (product.type !== 'digital') {
      return res.status(400).json({
        success: false,
        message: 'Product must be digital type to add digital assets',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Create digital asset record
    const digitalAsset = await DigitalAsset.create({
      product: productId,
      vendor: req.vendor._id,
      filename: req.file.filename || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      publicId: req.file.filename,
      downloadLimit: downloadLimit || 0,
      expiryHours: expiryHours || 0,
      description,
      version: version || '1.0',
      assetType: assetType || 'file',
    });

    res.status(201).json({
      success: true,
      data: digitalAsset,
      message: 'Digital asset uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all digital assets for a product
 * @route   GET /api/products/:id/digital-assets
 * @access  Vendor (owner)
 */
exports.getDigitalAssets = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const assets = await DigitalAsset.getProductAssets(productId);

    // Add license key stats
    const assetsWithStats = await Promise.all(
      assets.map(async (asset) => {
        const stats = await DigitalAsset.getLicenseKeyStats(asset._id);
        return {
          ...asset.toObject(),
          licenseKeyStats: stats,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: assetsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update digital asset
 * @route   PUT /api/products/:id/digital-assets/:assetId
 * @access  Vendor (owner)
 */
exports.updateDigitalAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;

    const asset = await DigitalAsset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Digital asset not found',
      });
    }

    if (asset.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this asset',
      });
    }

    // Allowed update fields
    const allowedFields = [
      'downloadLimit', 'expiryHours', 'description',
      'version', 'isActive', 'sortOrder', 'assetType',
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        asset[field] = updates[field];
      }
    });

    await asset.save();

    res.status(200).json({
      success: true,
      data: asset,
      message: 'Digital asset updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete digital asset
 * @route   DELETE /api/products/:id/digital-assets/:assetId
 * @access  Vendor (owner)
 */
exports.deleteDigitalAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await DigitalAsset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Digital asset not found',
      });
    }

    if (asset.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this asset',
      });
    }

    // Delete from Cloudinary
    if (asset.publicId) {
      await cloudinary.uploader.destroy(asset.publicId, { resource_type: 'raw' });
    }

    await asset.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Digital asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk upload license keys
 * @route   POST /api/products/:id/digital-assets/:assetId/license-keys
 * @access  Vendor (owner)
 */
exports.uploadLicenseKeys = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const { keys } = req.body;

    if (!keys || typeof keys !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'keys string is required (newline or comma separated)',
      });
    }

    const asset = await DigitalAsset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Digital asset not found',
      });
    }

    if (asset.vendor.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this asset',
      });
    }

    // Add license keys
    const updatedAsset = await DigitalAsset.addLicenseKeys(assetId, keys);
    const stats = await DigitalAsset.getLicenseKeyStats(assetId);

    res.status(200).json({
      success: true,
      data: {
        licenseKeyStats: stats,
      },
      message: `License keys added. Total: ${stats.total}, Available: ${stats.available}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get download URL (for customers)
 * @route   GET /api/orders/:orderId/downloads/:assetId
 * @access  Customer (owner of order)
 */
exports.getDownloadUrl = async (req, res, next) => {
  try {
    const { orderId, assetId } = req.params;

    // Find download log
    let downloadLog = await DownloadLog.findOne({
      order: orderId,
      digitalAsset: assetId,
      user: req.user._id,
    }).populate('digitalAsset');

    // If no download log exists, create one (if order is valid)
    if (!downloadLog) {
      const order = await Order.findOne({
        _id: orderId,
        customer: req.user._id,
        status: { $in: ['delivered', 'completed'] },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or not eligible for download',
        });
      }

      const asset = await DigitalAsset.findById(assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Digital asset not found',
        });
      }

      // Create download log
      downloadLog = await DownloadLog.createForOrder(
        orderId,
        req.user._id,
        asset.product,
        assetId,
        asset.downloadLimit,
        asset.expiryHours
      );

      // Assign license key if applicable
      if (asset.assetType === 'license_key' || asset.assetType === 'both') {
        const assignedKey = await DigitalAsset.assignLicenseKey(
          assetId,
          req.user._id,
          orderId
        );
        if (assignedKey) {
          downloadLog.assignedLicenseKey = assignedKey.key;
          await downloadLog.save();
        }
      }

      await downloadLog.populate('digitalAsset');
    }

    // Check if download is allowed
    const canDownload = downloadLog.canDownload();
    if (!canDownload.allowed) {
      return res.status(403).json({
        success: false,
        message: canDownload.reason,
      });
    }

    // Generate signed URL for download
    const asset = downloadLog.digitalAsset;
    let downloadUrl;

    if (asset.storageProvider === 'cloudinary_private') {
      // Generate Cloudinary signed URL
      downloadUrl = cloudinary.url(asset.publicId, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        attachment: true,
      });
    } else {
      // For other providers, return the storage path
      // (should be served through a secure endpoint)
      downloadUrl = `/api/downloads/${downloadLog.accessToken}`;
    }

    // Record download
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await downloadLog.recordDownload(ipAddress, userAgent);

    res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        filename: asset.originalName || asset.filename,
        remainingDownloads: downloadLog.getRemainingDownloads(),
        licenseKey: downloadLog.assignedLicenseKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's download history
 * @route   GET /api/downloads
 * @access  Customer
 */
exports.getMyDownloads = async (req, res, next) => {
  try {
    const downloads = await DownloadLog.getUserDownloads(req.user._id);

    res.status(200).json({
      success: true,
      data: downloads,
    });
  } catch (error) {
    next(error);
  }
};
