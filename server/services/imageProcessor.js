const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your-api-key'
  );
};

// Lazy load cloudinary only if configured
let cloudinary = null;
const getCloudinary = () => {
  if (!cloudinary && isCloudinaryConfigured()) {
    cloudinary = require('../config/cloudinary').cloudinary;
  }
  return cloudinary;
};

// Local storage configuration
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Image size configurations
const IMAGE_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 600, height: 600 },
  full: { width: 1200, height: 1200 },
};

/**
 * Process an image buffer and generate thumbnails
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Processing options
 * @returns {Object} - Processed images as buffers with metadata
 */
const processImage = async (buffer, options = {}) => {
  const { format = 'webp', quality = 80 } = options;

  const results = {};
  const metadata = await sharp(buffer).metadata();

  // Process each size
  for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
    const processed = await sharp(buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    results[size] = processed;
  }

  return {
    buffers: results,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    },
  };
};

/**
 * Save buffer to local file
 * @param {Buffer} buffer - Image buffer
 * @param {String} filePath - Full file path
 */
const saveToLocal = async (buffer, filePath) => {
  ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

/**
 * Upload to local storage
 * @param {Object} buffers - Object containing small, medium, full buffers
 * @param {String} vendorId - Vendor ID
 * @param {String} productId - Product ID
 * @param {String} prefix - Filename prefix
 * @returns {Object} - URLs for each size
 */
const uploadToLocal = async (buffers, vendorId, productId, prefix = '') => {
  const baseDir = path.join(UPLOAD_DIR, vendorId, productId);
  ensureDir(baseDir);

  const results = {};
  const uniqueId = uuidv4();

  for (const [size, buffer] of Object.entries(buffers)) {
    const filename = `${prefix}${uniqueId}_${size}.webp`;
    const filePath = path.join(baseDir, filename);
    await saveToLocal(buffer, filePath);

    // Create URL path
    const url = `/uploads/products/${vendorId}/${productId}/${filename}`;
    results[size] = { url, filePath };
  }

  return results;
};

/**
 * Upload processed images to Cloudinary
 * @param {Object} buffers - Object containing small, medium, full buffers
 * @param {String} folder - Cloudinary folder path
 * @param {String} prefix - Filename prefix
 * @returns {Object} - URLs and public IDs for each size
 */
const uploadToCloudinary = async (buffers, folder = 'ecommerce/products', prefix = '') => {
  const cld = getCloudinary();
  if (!cld) {
    throw new Error('Cloudinary not configured');
  }

  const uploadPromises = Object.entries(buffers).map(async ([size, buffer]) => {
    const publicId = `${folder}/${prefix}_${size}_${uuidv4()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cld.uploader.upload_stream(
        {
          public_id: publicId,
          folder: '',
          resource_type: 'image',
          format: 'webp',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({ size, url: result.secure_url, publicId: result.public_id });
        }
      );

      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  });

  const results = await Promise.all(uploadPromises);

  return results.reduce((acc, { size, url, publicId }) => {
    acc[size] = { url, publicId };
    return acc;
  }, {});
};

/**
 * Upload original image to Cloudinary (without processing)
 * @param {Buffer} buffer - Image buffer
 * @param {String} folder - Cloudinary folder
 * @param {String} filename - Original filename for reference
 * @returns {Object} - Upload result
 */
const uploadOriginal = async (buffer, folder = 'ecommerce/products', filename = '') => {
  const cld = getCloudinary();
  if (!cld) {
    throw new Error('Cloudinary not configured');
  }

  const publicId = `${folder}/original_${uuidv4()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        public_id: publicId,
        folder: '',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload original to local storage
 * @param {Buffer} buffer - Image buffer
 * @param {String} vendorId - Vendor ID
 * @param {String} productId - Product ID
 * @returns {Object} - Upload result
 */
const uploadOriginalToLocal = async (buffer, vendorId, productId) => {
  const baseDir = path.join(UPLOAD_DIR, vendorId, productId);
  ensureDir(baseDir);

  const metadata = await sharp(buffer).metadata();
  const uniqueId = uuidv4();
  const ext = metadata.format || 'jpg';
  const filename = `original_${uniqueId}.${ext}`;
  const filePath = path.join(baseDir, filename);

  await saveToLocal(buffer, filePath);

  const url = `/uploads/products/${vendorId}/${productId}/${filename}`;

  return {
    url,
    filePath,
    publicId: filePath, // Use file path as publicId for local storage
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    bytes: buffer.length,
  };
};

/**
 * Process and upload a product image with all thumbnails
 * @param {Buffer} buffer - Original image buffer
 * @param {String} vendorId - Vendor ID for folder organization
 * @param {String} productId - Product ID for folder organization
 * @returns {Object} - All URLs and metadata
 */
const processAndUploadProductImage = async (buffer, vendorId, productId) => {
  try {
    // Process image to generate thumbnails
    const { buffers, metadata } = await processImage(buffer);

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured()) {
      // Use Cloudinary
      const folder = `ecommerce/vendors/${vendorId}/products/${productId}`;
      const original = await uploadOriginal(buffer, folder);
      const thumbnails = await uploadToCloudinary(buffers, folder, productId);

      return {
        success: true,
        url: original.url,
        publicId: original.publicId,
        thumbnails: {
          small: thumbnails.small?.url,
          medium: thumbnails.medium?.url,
          full: thumbnails.full?.url,
        },
        thumbnailPublicIds: {
          small: thumbnails.small?.publicId,
          medium: thumbnails.medium?.publicId,
          full: thumbnails.full?.publicId,
        },
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
        },
        storageType: 'cloudinary',
      };
    } else {
      // Use local storage
      const original = await uploadOriginalToLocal(buffer, vendorId, productId);
      const thumbnails = await uploadToLocal(buffers, vendorId, productId, '');

      return {
        success: true,
        url: original.url,
        publicId: original.filePath, // Use file path for deletion
        thumbnails: {
          small: thumbnails.small?.url,
          medium: thumbnails.medium?.url,
          full: thumbnails.full?.url,
        },
        thumbnailPublicIds: {
          small: thumbnails.small?.filePath,
          medium: thumbnails.medium?.filePath,
          full: thumbnails.full?.filePath,
        },
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
        },
        storageType: 'local',
      };
    }
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete an image and its thumbnails
 * @param {String} publicId - Main image public ID (or file path for local)
 * @param {Object} thumbnailPublicIds - Thumbnail public IDs (or file paths)
 */
const deleteProductImage = async (publicId, thumbnailPublicIds = {}) => {
  try {
    // Check if it's a local file path
    if (publicId && publicId.includes('/uploads/')) {
      // Local storage - delete files
      const filesToDelete = [publicId];
      if (thumbnailPublicIds.small) filesToDelete.push(thumbnailPublicIds.small);
      if (thumbnailPublicIds.medium) filesToDelete.push(thumbnailPublicIds.medium);
      if (thumbnailPublicIds.full) filesToDelete.push(thumbnailPublicIds.full);

      let deleted = 0;
      for (const filePath of filesToDelete) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        } catch (err) {
          console.error('Error deleting file:', filePath, err);
        }
      }

      return { success: true, deleted, storageType: 'local' };
    } else if (isCloudinaryConfigured()) {
      // Cloudinary - delete from cloud
      const cld = getCloudinary();
      const deletePromises = [publicId];

      if (thumbnailPublicIds.small) deletePromises.push(thumbnailPublicIds.small);
      if (thumbnailPublicIds.medium) deletePromises.push(thumbnailPublicIds.medium);
      if (thumbnailPublicIds.full) deletePromises.push(thumbnailPublicIds.full);

      const results = await Promise.all(
        deletePromises.map(id => cld.uploader.destroy(id))
      );
      return { success: true, deleted: deletePromises.length, storageType: 'cloudinary' };
    }

    return { success: false, error: 'No storage configured' };
  } catch (error) {
    console.error('Image deletion error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Optimize an existing image URL (generate thumbnails from URL)
 * @param {String} imageUrl - Existing image URL
 * @param {String} vendorId - Vendor ID
 * @param {String} productId - Product ID
 * @returns {Object} - Optimized image data
 */
const optimizeExistingImage = async (imageUrl, vendorId, productId) => {
  try {
    const axios = require('axios');
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    return processAndUploadProductImage(buffer, vendorId, productId);
  } catch (error) {
    console.error('Image optimization error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate image file
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
const validateImage = async (buffer, options = {}) => {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    minWidth = 200,
    minHeight = 200,
  } = options;

  try {
    const metadata = await sharp(buffer).metadata();

    // Check file size
    if (buffer.length > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeBytes / 1024 / 1024}MB limit`,
      };
    }

    // Check format
    if (!allowedFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: `Invalid format. Allowed: ${allowedFormats.join(', ')}`,
      };
    }

    // Check dimensions
    if (metadata.width < minWidth || metadata.height < minHeight) {
      return {
        valid: false,
        error: `Image must be at least ${minWidth}x${minHeight} pixels`,
      };
    }

    return {
      valid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file',
    };
  }
};

/**
 * Get Cloudinary transformation URL (only works with Cloudinary)
 * @param {String} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {String} - Transformed URL
 */
const getTransformUrl = (publicId, options = {}) => {
  const cld = getCloudinary();
  if (!cld) {
    return publicId; // Return as-is for local storage
  }

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;

  return cld.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality, fetch_format: format },
    ],
  });
};

/**
 * Check current storage type
 */
const getStorageType = () => {
  return isCloudinaryConfigured() ? 'cloudinary' : 'local';
};

module.exports = {
  processImage,
  uploadToCloudinary,
  uploadToLocal,
  uploadOriginal,
  uploadOriginalToLocal,
  processAndUploadProductImage,
  deleteProductImage,
  optimizeExistingImage,
  validateImage,
  getTransformUrl,
  getStorageType,
  isCloudinaryConfigured,
  IMAGE_SIZES,
};
