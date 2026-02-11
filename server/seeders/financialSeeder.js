const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const CommissionRule = require('../models/CommissionRule');
const TaxZone = require('../models/TaxZone');
const TaxRate = require('../models/TaxRate');
const TaxCategoryOverride = require('../models/TaxCategoryOverride');
const VendorWallet = require('../models/VendorWallet');
const WalletTransaction = require('../models/WalletTransaction');
const PayoutSettings = require('../models/PayoutSettings');
const FinancialSummary = require('../models/FinancialSummary');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');

const seedFinancialData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Get existing vendors and categories
    const vendors = await Vendor.find().limit(5);
    const categories = await Category.find().limit(5);

    console.log(`Found ${vendors.length} vendors and ${categories.length} categories`);

    // ============ COMMISSION RULES ============
    console.log('\n--- Seeding Commission Rules ---');

    await CommissionRule.deleteMany({});

    const commissionRules = [
      {
        name: 'Platform Default',
        scope: 'platform',
        type: 'percentage',
        value: 10,
        isActive: true,
        priority: 0,
        description: 'Default 10% commission for all sales',
      },
      {
        name: 'Electronics Category',
        scope: 'category',
        scopeRef: categories[0]?._id,
        type: 'percentage',
        value: 8,
        isActive: true,
        priority: 10,
        description: 'Reduced commission for electronics',
      },
      {
        name: 'Fashion Category',
        scope: 'category',
        scopeRef: categories[1]?._id,
        type: 'percentage',
        value: 15,
        isActive: true,
        priority: 10,
        description: 'Higher commission for fashion items',
      },
      {
        name: 'Premium Vendor Rate',
        scope: 'vendor',
        scopeRef: vendors[0]?._id,
        type: 'percentage',
        value: 5,
        isActive: true,
        priority: 20,
        description: 'Special rate for premium vendors',
      },
      {
        name: 'Tiered Commission',
        scope: 'platform',
        type: 'tiered',
        tiers: [
          { minAmount: 0, maxAmount: 50000, rate: 12 },
          { minAmount: 50000, maxAmount: 200000, rate: 10 },
          { minAmount: 200000, maxAmount: 500000, rate: 8 },
          { minAmount: 500000, maxAmount: null, rate: 5 },
        ],
        tierPeriod: 'monthly',
        isActive: false, // Disabled by default
        priority: 5,
        description: 'Tiered commission based on monthly sales',
      },
    ];

    // Filter out rules with null scopeRef
    const validRules = commissionRules.filter(rule =>
      rule.scope === 'platform' || rule.scopeRef
    );

    await CommissionRule.insertMany(validRules);
    console.log(`Created ${validRules.length} commission rules`);

    // ============ TAX ZONES ============
    console.log('\n--- Seeding Tax Zones ---');

    await TaxZone.deleteMany({});

    const taxZones = [
      {
        name: 'Pakistan (Default)',
        countryCode: 'PK',
        isDefault: true,
        isActive: true,
        priority: 0,
      },
      {
        name: 'Punjab',
        countryCode: 'PK',
        stateCode: 'PB',
        isActive: true,
        priority: 10,
      },
      {
        name: 'Sindh',
        countryCode: 'PK',
        stateCode: 'SD',
        isActive: true,
        priority: 10,
      },
      {
        name: 'Karachi',
        countryCode: 'PK',
        stateCode: 'SD',
        city: 'Karachi',
        isActive: true,
        priority: 20,
      },
      {
        name: 'Lahore',
        countryCode: 'PK',
        stateCode: 'PB',
        city: 'Lahore',
        isActive: true,
        priority: 20,
      },
      {
        name: 'Islamabad',
        countryCode: 'PK',
        stateCode: 'IS',
        city: 'Islamabad',
        isActive: true,
        priority: 20,
      },
    ];

    const createdZones = await TaxZone.insertMany(taxZones);
    console.log(`Created ${createdZones.length} tax zones`);

    // ============ TAX RATES ============
    console.log('\n--- Seeding Tax Rates ---');

    await TaxRate.deleteMany({});

    const pakistanZone = createdZones.find(z => z.name === 'Pakistan (Default)');
    const sindhZone = createdZones.find(z => z.name === 'Sindh');

    const taxRates = [
      {
        name: 'Pakistan GST',
        zone: pakistanZone._id,
        taxType: 'gst',
        rate: 17,
        appliesTo: 'all',
        isInclusive: false,
        isActive: true,
      },
      {
        name: 'Sindh Sales Tax',
        zone: sindhZone._id,
        taxType: 'sales_tax',
        rate: 13,
        appliesTo: 'all',
        isInclusive: false,
        isActive: true,
      },
      {
        name: 'Service Tax',
        zone: pakistanZone._id,
        taxType: 'service_tax',
        rate: 5,
        appliesTo: 'shipping_only',
        isInclusive: false,
        isActive: true,
      },
    ];

    await TaxRate.insertMany(taxRates);
    console.log(`Created ${taxRates.length} tax rates`);

    // ============ TAX CATEGORY OVERRIDES ============
    console.log('\n--- Seeding Tax Category Overrides ---');

    await TaxCategoryOverride.deleteMany({});

    if (categories.length > 0) {
      const categoryOverrides = [
        {
          category: categories[0]._id, // First category exempt
          overrideType: 'reduced_rate',
          customRate: 5,
          includeSubcategories: true,
          reason: 'Essential items reduced rate',
        },
      ];

      await TaxCategoryOverride.insertMany(categoryOverrides);
      console.log(`Created ${categoryOverrides.length} category overrides`);
    }

    // ============ VENDOR WALLETS ============
    console.log('\n--- Seeding Vendor Wallets ---');

    await VendorWallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await PayoutSettings.deleteMany({});

    for (const vendor of vendors) {
      // Create wallet with sample balance
      const availableBalance = Math.floor(Math.random() * 50000) + 10000;
      const pendingBalance = Math.floor(Math.random() * 20000) + 5000;
      const totalEarned = availableBalance + pendingBalance + Math.floor(Math.random() * 100000);
      const totalCommissionPaid = Math.floor(totalEarned * 0.1);
      const totalWithdrawn = Math.floor(Math.random() * 30000);

      const wallet = await VendorWallet.create({
        vendor: vendor._id,
        availableBalance,
        pendingBalance,
        reservedBalance: 0,
        totalEarned,
        totalCommissionPaid,
        totalWithdrawn,
        currency: 'PKR',
      });

      // Create sample transactions
      const transactions = [
        {
          wallet: wallet._id,
          vendor: vendor._id,
          type: 'credit',
          category: 'sale',
          amount: 15000,
          balanceAfter: { available: availableBalance, pending: pendingBalance, reserved: 0 },
          description: 'Order #ORD-001 - Product sale',
          reference: { type: 'Order', id: new mongoose.Types.ObjectId() },
        },
        {
          wallet: wallet._id,
          vendor: vendor._id,
          type: 'credit',
          category: 'sale',
          amount: 8500,
          balanceAfter: { available: availableBalance, pending: pendingBalance, reserved: 0 },
          description: 'Order #ORD-002 - Product sale',
          reference: { type: 'Order', id: new mongoose.Types.ObjectId() },
        },
        {
          wallet: wallet._id,
          vendor: vendor._id,
          type: 'hold',
          category: 'sale',
          amount: pendingBalance,
          balanceAfter: { available: availableBalance, pending: pendingBalance, reserved: 0 },
          description: 'Earnings in holding period',
          releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      ];

      if (totalWithdrawn > 0) {
        transactions.push({
          wallet: wallet._id,
          vendor: vendor._id,
          type: 'debit',
          category: 'payout',
          amount: totalWithdrawn,
          balanceAfter: { available: availableBalance, pending: pendingBalance, reserved: 0 },
          description: 'Payout processed via Bank Transfer',
          reference: { type: 'PayoutRequest', id: new mongoose.Types.ObjectId() },
        });
      }

      await WalletTransaction.insertMany(transactions);

      // Create payout settings
      const vendorName = vendor.businessName || vendor.storeName || 'Vendor ' + vendor._id.toString().slice(-4);
      await PayoutSettings.create({
        vendor: vendor._id,
        paymentMethods: [
          {
            type: 'bank_transfer',
            details: {
              bankName: 'HBL',
              accountTitle: vendorName,
              accountNumber: '1234567890' + Math.floor(Math.random() * 1000),
              branchCode: '0123',
            },
            isDefault: true,
            isVerified: true,
          },
          {
            type: 'easypaisa',
            details: {
              mobileNumber: '0300' + String(Math.floor(Math.random() * 10000000)).padStart(7, '0'),
              accountName: vendorName,
            },
            isDefault: false,
            isVerified: false,
          },
        ],
        minimumWithdrawal: 1000,
        autoWithdraw: false,
        autoWithdrawThreshold: 50000,
      });

      console.log(`  - Wallet created for ${vendor.businessName}: PKR ${availableBalance} available`);
    }

    // ============ FINANCIAL SUMMARIES ============
    console.log('\n--- Seeding Financial Summaries ---');

    await FinancialSummary.deleteMany({});

    // Create last 7 days of platform summaries
    const summaries = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const gmv = Math.floor(Math.random() * 500000) + 100000;
      const orders = Math.floor(Math.random() * 50) + 10;
      const commission = Math.floor(gmv * 0.1);
      const vendorEarnings = gmv - commission;

      summaries.push({
        scope: 'platform',
        period: 'daily',
        periodStart: date,
        periodEnd: endDate,
        grossMerchandiseValue: gmv,
        totalOrders: orders,
        averageOrderValue: Math.floor(gmv / orders),
        totalCommission: commission,
        commissionByType: {
          fixed: Math.floor(commission * 0.1),
          percentage: Math.floor(commission * 0.9),
          tiered: 0,
        },
        totalVendorEarnings: vendorEarnings,
        totalPayoutsProcessed: Math.floor(Math.random() * 100000),
        pendingPayouts: Math.floor(Math.random() * 50000),
        totalTaxCollected: Math.floor(gmv * 0.17),
        taxByType: {
          gst: Math.floor(gmv * 0.17),
          vat: 0,
          salesTax: 0,
        },
        totalRefunds: Math.floor(Math.random() * 10000),
        netRevenue: commission,
      });
    }

    await FinancialSummary.insertMany(summaries);
    console.log(`Created ${summaries.length} daily financial summaries`);

    // ============ SUMMARY ============
    console.log('\n========================================');
    console.log('Financial Data Seeding Complete!');
    console.log('========================================');
    console.log(`Commission Rules: ${validRules.length}`);
    console.log(`Tax Zones: ${createdZones.length}`);
    console.log(`Tax Rates: ${taxRates.length}`);
    console.log(`Vendor Wallets: ${vendors.length}`);
    console.log(`Financial Summaries: ${summaries.length} days`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding financial data:', error);
    process.exit(1);
  }
};

seedFinancialData();
