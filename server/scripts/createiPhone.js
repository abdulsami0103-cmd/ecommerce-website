const mongoose = require('mongoose');
require('dotenv').config();

const createiPhoneProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');

    const Product = require('../models/Product');
    const Vendor = require('../models/Vendor');
    const Category = require('../models/Category');

    // Find vendor (Tech Galaxy Store)
    const vendor = await Vendor.findOne({ storeName: /tech/i });
    if (!vendor) {
      console.log('Vendor not found');
      process.exit(1);
    }
    console.log('Found vendor:', vendor.storeName);

    // Find Electronics category
    const category = await Category.findOne({ name: /electronics/i });
    console.log('Found category:', category ? category.name : 'None');

    // Create iPhone 15 Pro Max product
    const product = await Product.create({
      name: 'iPhone 15 Pro Max',
      description: 'Apple iPhone 15 Pro Max featuring the powerful A17 Pro chip, titanium design, 48MP main camera with 5x optical zoom, Action Button, USB-C with USB 3 speeds, and all-day battery life. The most advanced iPhone ever with ProMotion display and Dynamic Island.',
      shortDescription: 'Apple flagship iPhone with A17 Pro chip, titanium design, and 48MP camera system',
      vendor: vendor._id,
      category: category ? category._id : null,
      type: 'physical',
      price: {
        amount: 579999,
        compareAt: 619999,
        cost: 520000
      },
      inventory: {
        sku: 'IP15PM-256-NAT',
        quantity: 50,
        lowStockThreshold: 5,
        trackQuantity: true
      },
      hasVariants: true,
      options: [
        { name: 'Storage', values: ['256GB', '512GB', '1TB'] },
        { name: 'Color', values: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] }
      ],
      tags: ['iphone', 'apple', 'smartphone', 'flagship', 'ios', 'pro max'],
      status: 'active',
      moderation: {
        status: 'pending_review',
        submittedAt: new Date()
      },
      seo: {
        metaTitle: 'iPhone 15 Pro Max - Buy Online in Pakistan',
        metaDescription: 'Buy Apple iPhone 15 Pro Max at best price. A17 Pro chip, titanium design, 48MP camera, 5x zoom.'
      }
    });

    console.log('\n✓ Product created successfully!');
    console.log('Product ID:', product._id);
    console.log('Product Name:', product.name);
    console.log('Slug:', product.slug);
    console.log('Status:', product.status);
    console.log('Moderation:', product.moderation.status);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createiPhoneProduct();
