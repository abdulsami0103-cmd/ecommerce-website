const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const VendorPlan = require('../models/VendorPlan');
const VendorSubscription = require('../models/VendorSubscription');
const VendorRole = require('../models/VendorRole');

const createVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if vendor user already exists
    let user = await User.findOne({ email: 'vendor@test.com' });

    if (user) {
      console.log('User already exists, updating to vendor role...');
      user.role = 'vendor';
      await user.save();
    } else {
      // Create user
      user = await User.create({
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor',
        isVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'Vendor',
          phone: '+92 300 1234567',
        },
      });
      console.log('User created:', user.email);
    }

    // Check if vendor profile already exists
    let vendor = await Vendor.findOne({ user: user._id });

    if (vendor) {
      console.log('Vendor profile already exists');
    } else {
      // Get basic plan
      const basicPlan = await VendorPlan.findOne({ slug: 'basic' });

      // Create vendor profile
      vendor = await Vendor.create({
        user: user._id,
        storeName: 'Test Store',
        description: 'A test vendor store with quality products at great prices.',
        contactEmail: 'vendor@test.com',
        contactPhone: '+92 300 1234567',
        address: {
          street: '123 Business Street',
          city: 'Karachi',
          state: 'Sindh',
          country: 'Pakistan',
          zipCode: '75500',
        },
        isApproved: true,
        isActive: true,
        verificationStatus: 'verified',
        verificationStep: 5,
        verifiedAt: new Date(),
        businessDetails: {
          businessName: 'Test Store Pvt Ltd',
          businessType: 'company',
          taxId: 'NTN-1234567',
        },
        bankDetails: {
          accountHolderName: 'Test Vendor',
          bankName: 'HBL',
          accountNumber: '1234567890',
          isVerified: true,
        },
        currentPlan: basicPlan?._id,
        subscriptionStatus: 'active',
        commissionRate: basicPlan?.commissionRate || 15,
        shipping: {
          methods: [
            { name: 'Standard Shipping', price: 5, estimatedDays: 5 },
            { name: 'Express Shipping', price: 15, estimatedDays: 2 },
          ],
          freeShippingThreshold: 50,
        },
      });
      console.log('Vendor profile created:', vendor.storeName);

      // Create default roles for vendor
      await VendorRole.createDefaultRoles(vendor._id);
      console.log('Default roles created');

      // Create subscription
      if (basicPlan) {
        await VendorSubscription.create({
          vendor: vendor._id,
          plan: basicPlan._id,
          billingCycle: 'monthly',
          status: 'active',
          startDate: new Date(),
        });
        console.log('Subscription created (Basic plan)');
      }
    }

    console.log('\n========================================');
    console.log('Vendor Account Created Successfully!');
    console.log('========================================');
    console.log('Email: vendor@test.com');
    console.log('Password: password123');
    console.log('Store Name:', vendor.storeName);
    console.log('Status: Verified & Approved');
    console.log('Plan: Basic (Free)');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating vendor:', error);
    process.exit(1);
  }
};

createVendor();
