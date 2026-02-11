const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const fixVendorPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the vendor user
    let user = await User.findOne({ email: 'vendor@test.com' });

    if (!user) {
      console.log('Vendor user not found, creating new one...');
      user = new User({
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor',
        isVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'Vendor',
        },
      });
    } else {
      console.log('Vendor user found, resetting password...');
      user.password = 'password123';
    }

    // Save will trigger the pre-save hook to hash the password
    await user.save();

    console.log('\n========================================');
    console.log('Vendor Password Fixed!');
    console.log('========================================');
    console.log('Email: vendor@test.com');
    console.log('Password: password123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixVendorPassword();
