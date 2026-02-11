const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const CourierConfig = require('../models/CourierConfig');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const InvoiceCounter = require('../models/InvoiceCounter');

const seedOperationalData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // ============ COURIER CONFIGURATIONS ============
    console.log('\n--- Seeding Courier Configurations ---');

    await CourierConfig.deleteMany({});

    const courierConfigs = [
      {
        name: 'TCS',
        code: 'tcs',
        displayName: 'TCS Express',
        isActive: true,
        apiCredentials: {
          baseUrl: 'https://api.tcsexpress.com/v1',
          testBaseUrl: 'https://sandbox.tcsexpress.com/v1',
          // Credentials to be filled by admin
          apiKey: '',
          apiSecret: '',
          username: '',
          password: '',
          costCenterId: '',
        },
        environment: 'sandbox',
        services: [
          { code: 'overnight', name: 'Overnight', description: 'Next day delivery', estimatedDays: 1, isActive: true },
          { code: 'standard', name: 'Standard', description: '2-3 days delivery', estimatedDays: 3, isActive: true },
          { code: 'economy', name: 'Economy', description: '3-5 days delivery', estimatedDays: 5, isActive: true },
        ],
        supportedCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
        defaultRate: 250,
        fuelSurchargePercent: 5,
        settings: {
          autoFetchTracking: true,
          trackingFetchInterval: 60,
          supportsCOD: true,
          supportsPickup: true,
          supportsReturn: true,
          maxWeight: 30,
          maxDeclaredValue: 500000,
        },
        statusMapping: new Map([
          ['booked', 'pending'],
          ['shipment booked', 'pending'],
          ['picked up', 'picked_up'],
          ['in transit', 'in_transit'],
          ['out for delivery', 'out_for_delivery'],
          ['delivered', 'delivered'],
          ['returned to shipper', 'returned'],
        ]),
        priority: 10,
      },
      {
        name: 'Leopards Courier',
        code: 'leopards',
        displayName: 'Leopards Courier',
        isActive: true,
        apiCredentials: {
          baseUrl: 'https://api.leopardscourier.com',
          testBaseUrl: 'https://sandbox.leopardscourier.com',
          apiKey: '',
          apiSecret: '',
        },
        environment: 'sandbox',
        services: [
          { code: 'express', name: 'Express', description: 'Fast delivery', estimatedDays: 2, isActive: true },
          { code: 'standard', name: 'Standard', description: 'Standard delivery', estimatedDays: 3, isActive: true },
        ],
        supportedCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'],
        defaultRate: 200,
        fuelSurchargePercent: 3,
        settings: {
          autoFetchTracking: true,
          trackingFetchInterval: 60,
          supportsCOD: true,
          supportsPickup: true,
          supportsReturn: true,
          maxWeight: 25,
          maxDeclaredValue: 300000,
        },
        statusMapping: new Map([
          ['booked', 'pending'],
          ['arrived at station', 'picked_up'],
          ['in transit', 'in_transit'],
          ['out for delivery', 'out_for_delivery'],
          ['delivered', 'delivered'],
          ['returned to shipper', 'returned'],
        ]),
        priority: 8,
      },
      {
        name: 'PostEx',
        code: 'postex',
        displayName: 'PostEx',
        isActive: true,
        apiCredentials: {
          baseUrl: 'https://api.postex.pk',
          testBaseUrl: 'https://sandbox.postex.pk',
          apiKey: '',
        },
        environment: 'sandbox',
        services: [
          { code: 'express', name: 'Express', description: 'Express delivery', estimatedDays: 2, isActive: true },
          { code: 'standard', name: 'Standard', description: 'Standard delivery', estimatedDays: 3, isActive: true },
        ],
        supportedCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'],
        defaultRate: 180,
        fuelSurchargePercent: 0,
        settings: {
          autoFetchTracking: true,
          trackingFetchInterval: 60,
          supportsCOD: true,
          supportsPickup: true,
          supportsReturn: true,
          maxWeight: 20,
          maxDeclaredValue: 200000,
        },
        statusMapping: new Map([
          ['pending', 'pending'],
          ['order created', 'pending'],
          ['picked up', 'picked_up'],
          ['in transit', 'in_transit'],
          ['out for delivery', 'out_for_delivery'],
          ['delivered', 'delivered'],
          ['returned', 'returned'],
        ]),
        priority: 6,
      },
      {
        name: 'Manual Shipping',
        code: 'manual',
        displayName: 'Manual / Self Delivery',
        isActive: true,
        apiCredentials: {},
        environment: 'production',
        services: [
          { code: 'self', name: 'Self Delivery', description: 'Vendor self-delivery', estimatedDays: 3, isActive: true },
        ],
        supportedCities: [],
        defaultRate: 0,
        settings: {
          autoFetchTracking: false,
          supportsCOD: true,
          supportsPickup: false,
          supportsReturn: false,
        },
        priority: 0,
      },
    ];

    await CourierConfig.insertMany(courierConfigs);
    console.log(`Created ${courierConfigs.length} courier configurations`);

    // ============ INVOICE TEMPLATES ============
    console.log('\n--- Seeding Invoice Templates ---');

    await InvoiceTemplate.deleteMany({});
    await InvoiceTemplate.createDefaultTemplates();
    const templateCount = await InvoiceTemplate.countDocuments();
    console.log(`Created ${templateCount} invoice templates`);

    // ============ INVOICE COUNTERS ============
    console.log('\n--- Initializing Invoice Counters ---');

    await InvoiceCounter.deleteMany({});
    await InvoiceCounter.initializeYear(new Date().getFullYear());
    const counterCount = await InvoiceCounter.countDocuments();
    console.log(`Initialized ${counterCount} invoice counters`);

    // ============ SUMMARY ============
    console.log('\n========================================');
    console.log('Operational Data Seeding Complete!');
    console.log('========================================');
    console.log(`Courier Configs: ${courierConfigs.length}`);
    console.log(`Invoice Templates: ${templateCount}`);
    console.log(`Invoice Counters: ${counterCount}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding operational data:', error);
    process.exit(1);
  }
};

seedOperationalData();
