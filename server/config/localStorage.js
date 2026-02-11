const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create necessary directories
ensureDir(path.join(UPLOAD_DIR, 'products'));
ensureDir(path.join(UPLOAD_DIR, 'vendors'));
ensureDir(path.join(UPLOAD_DIR, 'categories'));
ensureDir(path.join(UPLOAD_DIR, 'temp'));

// Storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const vendorId = req.vendor?._id || 'unknown';
    const dir = path.join(UPLOAD_DIR, 'products', vendorId.toString());
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage configuration for general uploads
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Multer configurations
const uploadProductImage = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: imageFilter,
});

const uploadGeneral = multer({
  storage: generalStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: imageFilter,
});

// Helper to get public URL from file path
const getPublicUrl = (filePath) => {
  const relativePath = filePath.replace(UPLOAD_DIR, '').replace(/\\/g, '/');
  return `/uploads${relativePath}`;
};

// Helper to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Helper to delete file by URL
const deleteFileByUrl = (url) => {
  if (!url || !url.startsWith('/uploads')) return false;
  const filePath = path.join(UPLOAD_DIR, url.replace('/uploads', ''));
  return deleteFile(filePath);
};

module.exports = {
  UPLOAD_DIR,
  ensureDir,
  uploadProductImage,
  uploadGeneral,
  getPublicUrl,
  deleteFile,
  deleteFileByUrl,
};
