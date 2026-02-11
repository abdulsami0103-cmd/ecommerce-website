const cron = require('node-cron');
const Vendor = require('../models/Vendor');
const invoiceGenerator = require('../services/invoiceGenerator');

/**
 * Generate monthly vendor statements
 * Runs on the 1st of each month at 2 AM
 */

const generateMonthlyStatements = async () => {
  console.log('[Job] Starting monthly statement generation...');

  try {
    // Get all active vendors
    const vendors = await Vendor.find({
      status: 'active',
      'subscription.status': 'active',
    });

    console.log(`[Job] Generating statements for ${vendors.length} vendors`);

    // Calculate previous month period
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

    let generated = 0;
    let errors = 0;

    for (const vendor of vendors) {
      try {
        const statement = await invoiceGenerator.generateVendorStatement(
          vendor._id,
          periodStart,
          periodEnd
        );

        if (statement) {
          generated++;

          // TODO: Send statement via email
          // const vendorEmail = vendor.owner?.email;
          // if (vendorEmail) {
          //   await invoiceGenerator.sendInvoiceEmail(statement._id, vendorEmail);
          // }
        }
      } catch (err) {
        console.error(
          `[Job] Error generating statement for vendor ${vendor.storeName}:`,
          err.message
        );
        errors++;
      }
    }

    console.log(`[Job] Statement generation complete. Generated: ${generated}, Errors: ${errors}`);
  } catch (error) {
    console.error('[Job] Monthly statement job failed:', error);
  }
};

// Schedule: Run on 1st of each month at 2 AM
const scheduleMonthlyStatements = () => {
  cron.schedule('0 2 1 * *', generateMonthlyStatements);
  console.log('[Cron] Monthly statement job scheduled (1st of month, 2 AM)');
};

module.exports = {
  generateMonthlyStatements,
  scheduleMonthlyStatements,
};
