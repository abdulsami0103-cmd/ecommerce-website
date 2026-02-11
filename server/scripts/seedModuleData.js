const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const Attribute = require('../models/Attribute');
const Category = require('../models/Category');
const CategoryAttribute = require('../models/CategoryAttribute');

const seedModuleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create Sample Attributes
    console.log('\n--- Creating Attributes ---');

    const attributesData = [
      {
        name: 'Color',
        type: 'color',
        description: 'Product color',
        isFilterable: true,
        isVisibleOnProduct: true,
        options: [
          { value: 'red', label: 'Red', colorHex: '#FF0000' },
          { value: 'blue', label: 'Blue', colorHex: '#0000FF' },
          { value: 'green', label: 'Green', colorHex: '#00FF00' },
          { value: 'black', label: 'Black', colorHex: '#000000' },
          { value: 'white', label: 'White', colorHex: '#FFFFFF' },
        ],
      },
      {
        name: 'Size',
        type: 'select',
        description: 'Product size',
        isFilterable: true,
        isVisibleOnProduct: true,
        options: [
          { value: 'xs', label: 'XS' },
          { value: 's', label: 'S' },
          { value: 'm', label: 'M' },
          { value: 'l', label: 'L' },
          { value: 'xl', label: 'XL' },
          { value: 'xxl', label: 'XXL' },
        ],
      },
      {
        name: 'Material',
        type: 'select',
        description: 'Product material',
        isFilterable: true,
        isVisibleOnProduct: true,
        options: [
          { value: 'cotton', label: 'Cotton' },
          { value: 'polyester', label: 'Polyester' },
          { value: 'leather', label: 'Leather' },
          { value: 'wool', label: 'Wool' },
          { value: 'silk', label: 'Silk' },
        ],
      },
      {
        name: 'Brand',
        type: 'text',
        description: 'Product brand name',
        isFilterable: true,
        isSearchable: true,
        isVisibleOnProduct: true,
      },
      {
        name: 'Weight (kg)',
        type: 'number',
        description: 'Product weight in kilograms',
        isVisibleOnProduct: true,
        validation: { min: 0, max: 1000 },
      },
      {
        name: 'Warranty',
        type: 'select',
        description: 'Warranty period',
        isFilterable: true,
        isVisibleOnProduct: true,
        options: [
          { value: 'none', label: 'No Warranty' },
          { value: '6months', label: '6 Months' },
          { value: '1year', label: '1 Year' },
          { value: '2years', label: '2 Years' },
          { value: '3years', label: '3 Years' },
        ],
      },
      {
        name: 'In Stock',
        type: 'boolean',
        description: 'Whether product is in stock',
        isFilterable: true,
      },
    ];

    for (const attrData of attributesData) {
      const existing = await Attribute.findOne({ name: attrData.name });
      if (!existing) {
        await Attribute.create(attrData);
        console.log(`Created attribute: ${attrData.name}`);
      } else {
        console.log(`Attribute already exists: ${attrData.name}`);
      }
    }

    // 2. Assign attributes to categories
    console.log('\n--- Assigning Attributes to Categories ---');

    const categories = await Category.find({});
    const colorAttr = await Attribute.findOne({ name: 'Color' });
    const sizeAttr = await Attribute.findOne({ name: 'Size' });
    const brandAttr = await Attribute.findOne({ name: 'Brand' });

    for (const category of categories) {
      // Assign Color and Brand to all categories
      if (colorAttr) {
        const exists = await CategoryAttribute.findOne({ category: category._id, attribute: colorAttr._id });
        if (!exists) {
          await CategoryAttribute.create({
            category: category._id,
            attribute: colorAttr._id,
            isRequired: false,
          });
          console.log(`Assigned Color to ${category.name}`);
        }
      }
      if (brandAttr) {
        const exists = await CategoryAttribute.findOne({ category: category._id, attribute: brandAttr._id });
        if (!exists) {
          await CategoryAttribute.create({
            category: category._id,
            attribute: brandAttr._id,
            isRequired: false,
          });
          console.log(`Assigned Brand to ${category.name}`);
        }
      }
      // Assign Size to Fashion category
      if (sizeAttr && category.name === 'Fashion') {
        const exists = await CategoryAttribute.findOne({ category: category._id, attribute: sizeAttr._id });
        if (!exists) {
          await CategoryAttribute.create({
            category: category._id,
            attribute: sizeAttr._id,
            isRequired: true,
          });
          console.log(`Assigned Size to ${category.name} (required)`);
        }
      }
    }

    // 3. Update existing products with moderation and inventory data
    console.log('\n--- Updating Products ---');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let updated = false;

      // Add moderation status if not present
      if (!product.moderation || !product.moderation.status) {
        // Randomly assign statuses for demo
        const statuses = ['draft', 'pending_review', 'approved', 'published', 'rejected'];
        const randomStatus = statuses[i % statuses.length];

        product.moderation = {
          status: randomStatus,
          submittedAt: randomStatus !== 'draft' ? new Date() : null,
          reviewCount: randomStatus === 'rejected' ? 1 : 0,
        };
        updated = true;
      }

      // Update inventory with low stock threshold
      if (!product.inventory.lowStockThreshold) {
        product.inventory.lowStockThreshold = 10;
        updated = true;
      }
      if (!product.inventory.outOfStockBehavior) {
        product.inventory.outOfStockBehavior = 'show_badge';
        updated = true;
      }

      // Make some products low stock for demo
      if (i % 3 === 0) {
        product.inventory.quantity = Math.floor(Math.random() * 8); // 0-7 (below threshold)
        updated = true;
      }

      if (updated) {
        await product.save();
        console.log(`Updated product: ${product.name} (moderation: ${product.moderation.status}, stock: ${product.inventory.quantity})`);
      }
    }

    // 4. Create sample products if none exist
    if (products.length === 0) {
      console.log('\n--- Creating Sample Products ---');

      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ isApproved: true });
      const category = await Category.findOne({});

      if (vendor && category) {
        const sampleProducts = [
          {
            vendor: vendor._id,
            name: 'Sample Product 1 - Pending Review',
            description: 'This is a sample product pending review',
            price: { amount: 999, currency: 'PKR' },
            category: category._id,
            inventory: { quantity: 5, lowStockThreshold: 10, trackInventory: true },
            moderation: { status: 'pending_review', submittedAt: new Date() },
            status: 'draft',
          },
          {
            vendor: vendor._id,
            name: 'Sample Product 2 - Low Stock',
            description: 'This is a sample product with low stock',
            price: { amount: 1999, currency: 'PKR' },
            category: category._id,
            inventory: { quantity: 3, lowStockThreshold: 10, trackInventory: true },
            moderation: { status: 'published' },
            status: 'active',
          },
          {
            vendor: vendor._id,
            name: 'Sample Product 3 - Out of Stock',
            description: 'This is a sample product out of stock',
            price: { amount: 2999, currency: 'PKR' },
            category: category._id,
            inventory: { quantity: 0, lowStockThreshold: 10, trackInventory: true },
            moderation: { status: 'approved' },
            status: 'active',
          },
        ];

        for (const productData of sampleProducts) {
          const product = new Product(productData);
          await product.save();
          console.log(`Created: ${product.name}`);
        }
      } else {
        console.log('No approved vendor or category found to create sample products');
      }
    }

    console.log('\n========================================');
    console.log('Module Data Seeded Successfully!');
    console.log('========================================');

    // Show summary
    const attrCount = await Attribute.countDocuments();
    const pendingProducts = await Product.countDocuments({ 'moderation.status': 'pending_review' });
    const lowStockProducts = await Product.countDocuments({
      'inventory.trackInventory': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
    });

    console.log(`\nSummary:`);
    console.log(`- Attributes: ${attrCount}`);
    console.log(`- Products pending review: ${pendingProducts}`);
    console.log(`- Low stock products: ${lowStockProducts}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedModuleData();
