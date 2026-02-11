const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;

const Invoice = require('../models/Invoice');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const InvoiceCounter = require('../models/InvoiceCounter');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const PayoutRequest = require('../models/PayoutRequest');
const RMARequest = require('../models/RMARequest');

/**
 * Invoice Generator Service
 * Generates PDF invoices using Puppeteer and Handlebars templates
 */

class InvoiceGenerator {
  constructor() {
    this.puppeteer = null;
    this.browser = null;
    this.registerHandlebarsHelpers();
  }

  /**
   * Register Handlebars helpers for templates
   */
  registerHandlebarsHelpers() {
    // Format currency
    Handlebars.registerHelper('formatCurrency', (amount, currency = 'PKR') => {
      const num = parseFloat(amount) || 0;
      const formatted = num.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return currency === 'PKR' ? `Rs. ${formatted}` : `${currency} ${formatted}`;
    });

    // Format date
    Handlebars.registerHelper('formatDate', (date, format = 'default') => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'long') {
        return d.toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return d.toLocaleDateString('en-PK');
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Math helpers
    Handlebars.registerHelper('multiply', (a, b) => (a || 0) * (b || 0));
    Handlebars.registerHelper('add', (a, b) => (a || 0) + (b || 0));
    Handlebars.registerHelper('subtract', (a, b) => (a || 0) - (b || 0));

    // Index helper
    Handlebars.registerHelper('addOne', (index) => index + 1);
  }

  /**
   * Get browser instance (lazy loading)
   */
  async getBrowser() {
    if (!this.puppeteer) {
      try {
        this.puppeteer = require('puppeteer');
      } catch (err) {
        console.warn('Puppeteer not installed. PDF generation will be disabled.');
        return null;
      }
    }

    if (!this.browser && this.puppeteer) {
      this.browser = await this.puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber(type) {
    return Invoice.getNextInvoiceNumber(type);
  }

  /**
   * Compile Handlebars template
   */
  compileTemplate(templateString, data) {
    const template = Handlebars.compile(templateString);
    return template(data);
  }

  /**
   * Generate Customer Invoice for an Order
   */
  async generateCustomerInvoice(orderId) {
    const order = await Order.findById(orderId)
      .populate('customer', 'email profile')
      .populate('items.product', 'name images')
      .populate('items.vendor', 'storeName');

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ order: orderId, type: 'customer_invoice' });

    if (invoice) {
      // Regenerate PDF if requested
      return invoice;
    }

    const invoiceNumber = await this.getNextInvoiceNumber('customer_invoice');

    // Platform seller info (can be configured)
    const seller = {
      name: process.env.PLATFORM_NAME || 'E-Commerce Platform',
      address: process.env.PLATFORM_ADDRESS || 'Karachi, Pakistan',
      phone: process.env.PLATFORM_PHONE || '+92-21-12345678',
      email: process.env.PLATFORM_EMAIL || 'support@platform.com',
      ntn: process.env.PLATFORM_NTN || '',
      strn: process.env.PLATFORM_STRN || '',
    };

    // Buyer info
    const buyer = {
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      address: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      country: order.shippingAddress.country,
      postalCode: order.shippingAddress.zipCode,
      phone: order.shippingAddress.phone,
      email: order.customer?.email,
    };

    // Line items
    const items = order.items.map((item) => ({
      description: item.name,
      sku: item.variant || '',
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
      taxRate: 0,
      taxAmount: 0,
    }));

    invoice = await Invoice.create({
      invoiceNumber,
      type: 'customer_invoice',
      status: 'generated',
      order: order._id,
      customer: order.customer._id,
      seller,
      buyer,
      items,
      subtotal: order.totals.subtotal,
      totalTax: order.totals.tax,
      taxBreakdown: order.totals.tax > 0 ? [{ taxType: 'GST', rate: 17, amount: order.totals.tax }] : [],
      shippingCost: order.totals.shipping,
      discount: order.totals.discount,
      grandTotal: order.totals.total,
      currency: order.totals.currency || 'PKR',
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status === 'paid' ? 'paid' : 'unpaid',
      paidAt: order.payment.paidAt,
      notes: order.notes,
      terms: 'Thank you for your purchase!',
    });

    // Generate PDF
    await this.generatePDF(invoice);

    return invoice;
  }

  /**
   * Generate Vendor Statement for a period
   */
  async generateVendorStatement(vendorId, periodStart, periodEnd) {
    const vendor = await Vendor.findById(vendorId).populate('owner', 'email');

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const invoiceNumber = await this.getNextInvoiceNumber('vendor_statement');

    // Get vendor's sub-orders in period
    const subOrders = await SubOrder.find({
      vendor: vendorId,
      status: 'delivered',
      deliveredAt: { $gte: periodStart, $lte: periodEnd },
    });

    // Calculate totals
    let totalSales = 0;
    let totalCommission = 0;
    const items = [];

    for (const subOrder of subOrders) {
      totalSales += subOrder.total;
      totalCommission += subOrder.commissionAmount || 0;

      items.push({
        description: `Order ${subOrder.subOrderNumber} - ${new Date(subOrder.deliveredAt).toLocaleDateString()}`,
        quantity: 1,
        unitPrice: subOrder.total,
        total: subOrder.vendorEarnings || (subOrder.total - (subOrder.commissionAmount || 0)),
        taxRate: 0,
        taxAmount: 0,
      });
    }

    const netEarnings = totalSales - totalCommission;

    // Summary items
    items.push({
      description: 'Total Sales',
      quantity: subOrders.length,
      unitPrice: 0,
      total: totalSales,
    });

    items.push({
      description: 'Platform Commission',
      quantity: 1,
      unitPrice: 0,
      total: -totalCommission,
    });

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'vendor_statement',
      status: 'generated',
      vendor: vendorId,
      seller: {
        name: process.env.PLATFORM_NAME || 'E-Commerce Platform',
        address: process.env.PLATFORM_ADDRESS || '',
        email: process.env.PLATFORM_EMAIL || '',
      },
      buyer: {
        name: vendor.storeName || vendor.businessName,
        address: vendor.businessAddress?.street || '',
        city: vendor.businessAddress?.city || '',
        phone: vendor.phone || '',
        email: vendor.owner?.email || '',
        ntn: vendor.ntn || '',
      },
      items,
      subtotal: totalSales,
      totalTax: 0,
      discount: totalCommission,
      grandTotal: netEarnings,
      currency: 'PKR',
      periodStart,
      periodEnd,
      notes: `Statement for period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
    });

    await this.generatePDF(invoice);

    return invoice;
  }

  /**
   * Generate Credit Note for RMA/Refund
   */
  async generateCreditNote(rmaRequestId) {
    const rma = await RMARequest.findById(rmaRequestId)
      .populate('customer', 'email profile')
      .populate('order')
      .populate('vendor', 'storeName');

    if (!rma) {
      throw new Error('RMA Request not found');
    }

    // Check if credit note already exists
    let invoice = await Invoice.findOne({
      rmaRequest: rmaRequestId,
      type: 'credit_note',
    });

    if (invoice) {
      return invoice;
    }

    const invoiceNumber = await this.getNextInvoiceNumber('credit_note');

    const items = rma.items.map((item) => ({
      description: `${item.productName} - ${item.reason}`,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    }));

    invoice = await Invoice.create({
      invoiceNumber,
      type: 'credit_note',
      status: 'generated',
      rmaRequest: rmaRequestId,
      order: rma.order._id,
      customer: rma.customer._id,
      vendor: rma.vendor._id,
      seller: {
        name: process.env.PLATFORM_NAME || 'E-Commerce Platform',
        address: process.env.PLATFORM_ADDRESS || '',
        email: process.env.PLATFORM_EMAIL || '',
      },
      buyer: {
        name: `${rma.customer?.profile?.firstName || ''} ${rma.customer?.profile?.lastName || ''}`.trim() || 'Customer',
        email: rma.customer?.email || '',
      },
      items,
      subtotal: rma.totalItemValue,
      totalTax: 0,
      discount: rma.restockingFee || 0,
      grandTotal: rma.refund?.amount || rma.refundableAmount || rma.totalItemValue,
      currency: 'PKR',
      notes: `Credit Note for RMA ${rma.rmaNumber}\nReason: ${rma.items[0]?.reason || 'Return'}`,
    });

    await this.generatePDF(invoice);

    return invoice;
  }

  /**
   * Generate Payout Receipt
   */
  async generatePayoutReceipt(payoutRequestId) {
    const payout = await PayoutRequest.findById(payoutRequestId)
      .populate('vendor', 'storeName businessName phone ntn owner')
      .populate({
        path: 'vendor',
        populate: { path: 'owner', select: 'email' },
      });

    if (!payout) {
      throw new Error('Payout request not found');
    }

    // Check if receipt already exists
    let invoice = await Invoice.findOne({
      payoutRequest: payoutRequestId,
      type: 'payout_receipt',
    });

    if (invoice) {
      return invoice;
    }

    const invoiceNumber = await this.getNextInvoiceNumber('payout_receipt');

    const items = [
      {
        description: 'Payout Amount',
        quantity: 1,
        unitPrice: payout.requestedAmount,
        total: payout.requestedAmount,
      },
    ];

    if (payout.fees?.totalFees > 0) {
      items.push({
        description: 'Processing Fee',
        quantity: 1,
        unitPrice: -payout.fees.totalFees,
        total: -payout.fees.totalFees,
      });
    }

    invoice = await Invoice.create({
      invoiceNumber,
      type: 'payout_receipt',
      status: 'generated',
      payoutRequest: payoutRequestId,
      vendor: payout.vendor._id,
      seller: {
        name: process.env.PLATFORM_NAME || 'E-Commerce Platform',
        address: process.env.PLATFORM_ADDRESS || '',
        email: process.env.PLATFORM_EMAIL || '',
      },
      buyer: {
        name: payout.vendor.storeName || payout.vendor.businessName,
        phone: payout.vendor.phone || '',
        email: payout.vendor.owner?.email || '',
        ntn: payout.vendor.ntn || '',
      },
      items,
      subtotal: payout.requestedAmount,
      totalTax: 0,
      discount: payout.fees?.totalFees || 0,
      grandTotal: payout.netAmount,
      currency: 'PKR',
      paymentMethod: payout.paymentMethod?.type || 'Bank Transfer',
      paymentStatus: 'paid',
      paidAt: payout.completedAt || new Date(),
      paymentReference: payout.transactionId,
      notes: `Payout via ${payout.paymentMethod?.type || 'Bank Transfer'}`,
    });

    await this.generatePDF(invoice);

    return invoice;
  }

  /**
   * Generate PDF from invoice
   */
  async generatePDF(invoice) {
    try {
      // Get template
      const template = await InvoiceTemplate.getDefaultTemplate(
        invoice.type,
        invoice.vendor
      );

      if (!template) {
        console.warn(`No template found for ${invoice.type}, using basic template`);
        return invoice;
      }

      // Compile HTML
      const html = this.compileTemplate(template.template, {
        ...invoice.toObject(),
        footerText: template.footerText || '',
      });

      // Full HTML with styles
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${template.styles || ''}</style>
        </head>
        <body>${html}</body>
        </html>
      `;

      // Generate PDF using Puppeteer (if available)
      const browser = await this.getBrowser();

      if (browser) {
        const page = await browser.newPage();

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          format: template.pageSize || 'A4',
          printBackground: true,
          margin: template.margins || {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm',
          },
        });

        await page.close();

        // Save PDF
        const filename = `${invoice.invoiceNumber}.pdf`;
        const uploadDir = path.join(__dirname, '../uploads/invoices');

        try {
          await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
          // Directory exists
        }

        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, pdfBuffer);

        // Update invoice with PDF URL
        invoice.pdfUrl = `/uploads/invoices/${filename}`;
        invoice.pdfGeneratedAt = new Date();
      } else {
        // Puppeteer not available, skip PDF generation
        console.warn('PDF generation skipped - Puppeteer not installed');
      }

      await invoice.save();
      return invoice;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(invoiceId, recipientEmail) {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.pdfUrl) {
      await this.generatePDF(invoice);
    }

    // Email sending would be implemented here
    // using your email service (nodemailer, sendgrid, etc.)

    invoice.sentAt = new Date();
    invoice.sentTo.push(recipientEmail);
    await invoice.save();

    return invoice;
  }
}

// Export singleton instance
module.exports = new InvoiceGenerator();
