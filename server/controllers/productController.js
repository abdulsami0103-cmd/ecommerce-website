const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // Build query - only show active AND approved/published products
    const query = {
      status: 'active',
      'moderation.status': { $in: ['approved', 'published'] }
    };

    // Filter by category (supports both ID and slug)
    if (req.query.category) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.query.category)) {
        query.category = req.query.category;
      } else {
        const cat = await Category.findOne({ slug: req.query.category });
        if (cat) query.category = cat._id;
      }
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by vendor
    if (req.query.vendor) {
      query.vendor = req.query.vendor;
    }

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      query['price.amount'] = {};
      if (req.query.minPrice) query['price.amount'].$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query['price.amount'].$lte = parseFloat(req.query.maxPrice);
    }

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sort = { 'price.amount': 1 };
          break;
        case 'price_desc':
          sort = { 'price.amount': -1 };
          break;
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'popular':
          sort = { salesCount: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const products = await Product.find(query)
      .populate('vendor', 'storeName storeSlug')
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by slug or ID
// @route   GET /api/products/:slug
// @access  Public (approved products) / Vendor (own products)
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const mongoose = require('mongoose');

    // Check if it's a MongoDB ObjectId or a slug
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    let product;
    let isOwner = false;

    // First, try to find the product without restrictions
    if (isObjectId) {
      product = await Product.findById(slug)
        .populate('vendor', 'storeName storeSlug logo rating user')
        .populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug })
        .populate('vendor', 'storeName storeSlug logo rating user')
        .populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if logged-in user is the vendor owner
    if (req.user && product.vendor) {
      const vendorUserId = product.vendor.user?.toString() || product.vendor.toString();
      isOwner = vendorUserId === req.user.id?.toString() || req.user.role === 'admin';
    }

    // If not owner/admin, check moderation status
    if (!isOwner) {
      if (product.status !== 'active' || !['approved', 'published'].includes(product.moderation?.status)) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Increment view count only for public views
      product.viewCount += 1;
      await product.save();
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Vendor)
const createProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'You must be a vendor to create products',
      });
    }

    if (!vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your vendor account is pending approval',
      });
    }

    const product = await Product.create({
      ...req.body,
      vendor: vendor._id,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor - owner only)
const updateProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'You must be a vendor to update products',
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    // Prevent updating certain fields
    delete req.body.vendor;
    delete req.body.rating;
    delete req.body.salesCount;
    delete req.body.viewCount;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor - owner only)
const deleteProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'You must be a vendor to delete products',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's products
// @route   GET /api/vendors/:vendorId/products
// @access  Public
const getVendorProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      vendor: req.params.vendorId,
      status: 'active',
    })
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({
      vendor: req.params.vendorId,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my products (vendor)
// @route   GET /api/products/my-products
// @access  Private (Vendor)
const getMyProducts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: 'You must be a vendor to view products',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const query = { vendor: vendor._id };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getMyProducts,
};
