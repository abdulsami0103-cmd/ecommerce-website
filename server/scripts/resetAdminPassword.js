const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ role: 'admin' });

    if (!user) {
      console.log('No admin user found, creating new one...');
      user = new User({
        email: 'admin@marketplace.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
        },
      });
    } else {
      console.log(`Admin found: ${user.email}`);
      console.log('Resetting password...');
      user.password = 'admin123';
    }

    // Save will trigger the pre-save hook to hash the password
    await user.save();

    console.log('\n========================================');
    console.log('Admin Password Reset Done!');
    console.log('========================================');
    console.log(`Email: ${user.email}`);
    console.log('Password: admin123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdminPassword();
