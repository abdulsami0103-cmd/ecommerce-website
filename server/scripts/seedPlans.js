const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const VendorPlan = require('../models/VendorPlan');

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if plans already exist
    const existingPlans = await VendorPlan.countDocuments();
    if (existingPlans > 0) {
      console.log(`${existingPlans} plans already exist. Skipping seed.`);
      process.exit(0);
    }

    // Create default plans
    await VendorPlan.createDefaultPlans();
    console.log('Default vendor plans created successfully!');

    const plans = await VendorPlan.find();
    console.log('\nCreated plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price.monthly}/month, ${plan.commissionRate}% commission`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
