const Invoice = require('../models/Invoice');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const Vendor = require('../models/Vendor');
const invoiceGenerator = require('../services/invoiceGenerator');

/**
 * @desc    Get customer's invoices
 * @route   GET /api/invoices
 * @access  Private
 */
exports.getCustomerInvoices = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const query = { customer: req.user._id };
    if (type) {
      query.type = type;
    }

    const invoices = await Invoice.find(query)
      .populate('order', 'orderNumber')
      .select('-items') // Don't include items in list view
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get invoice details
 * @route   GET /api/invoices/:id
 * @access  Private
 */
exports.getInvoiceDetails = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order', 'orderNumber payment')
      .populate('subOrder', 'subOrderNumber')
      .populate('vendor', 'storeName')
      .populate('customer', 'email profile');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    const vendor = await Vendor.findOne({ user: req.user._id });
    const isCustomer = invoice.customer?._id?.toString() === req.user._id.toString();
    const isVendor = vendor && invoice.vendor?._id?.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Download invoice PDF
 * @route   GET /api/invoices/:id/pdf
 * @access  Private
 */
exports.downloadInvoicePDF = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    const vendor = await Vendor.findOne({ user: req.user._id });
    const isCustomer = invoice.customer?.toString() === req.user._id.toString();
    const isVendor = vendor && invoice.vendor?.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate PDF if not exists
    if (!invoice.pdfUrl) {
      invoice = await invoiceGenerator.generatePDF(invoice);
    }

    res.json({
      pdfUrl: invoice.pdfUrl,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Send invoice via email
 * @route   POST /api/invoices/:id/send
 * @access  Private
 */
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization (admin or vendor who owns the invoice)
    const vendor = await Vendor.findOne({ user: req.user._id });
    const isVendor = vendor && invoice.vendor?.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await invoiceGenerator.sendInvoiceEmail(invoice._id, email);

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate invoice for order
 * @route   POST /api/invoices/generate/order/:orderId
 * @access  Private (Admin/Vendor)
 */
exports.generateOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await invoiceGenerator.generateCustomerInvoice(orderId);

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice,
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get vendor's invoices
 * @route   GET /api/vendor/invoices
 * @access  Private (Vendor)
 */
exports.getVendorInvoices = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { type, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (type) {
      query.type = type;
    }

    const invoices = await Invoice.find(query)
      .populate('order', 'orderNumber')
      .populate('payoutRequest', 'requestedAmount status')
      .select('-items')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    // Get summary
    const summary = await Invoice.getVendorSummary(vendor._id);

    res.json({
      invoices,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate vendor statement
 * @route   POST /api/vendor/invoices/statement
 * @access  Private (Vendor)
 */
exports.generateVendorStatement = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { periodStart, periodEnd } = req.body;

    const invoice = await invoiceGenerator.generateVendorStatement(
      vendor._id,
      new Date(periodStart),
      new Date(periodEnd)
    );

    res.status(201).json({
      message: 'Statement generated successfully',
      invoice,
    });
  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all invoices (Admin)
 * @route   GET /api/admin/invoices
 * @access  Private (Admin)
 */
exports.adminGetAllInvoices = async (req, res) => {
  try {
    const { type, status, vendor, page = 1, limit = 20 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (vendor) query.vendor = vendor;

    const invoices = await Invoice.find(query)
      .populate('vendor', 'storeName')
      .populate('customer', 'email profile.firstName profile.lastName')
      .populate('order', 'orderNumber')
      .select('-items')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get invoice templates (Admin)
 * @route   GET /api/admin/invoice-templates
 * @access  Private (Admin)
 */
exports.getInvoiceTemplates = async (req, res) => {
  try {
    const templates = await InvoiceTemplate.find()
      .populate('vendor', 'storeName')
      .sort({ type: 1, isDefault: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create/Update invoice template (Admin)
 * @route   PUT /api/admin/invoice-templates/:id
 * @access  Private (Admin)
 */
exports.updateInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    let template;

    if (id === 'new') {
      template = await InvoiceTemplate.create({
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      template = await InvoiceTemplate.findByIdAndUpdate(
        id,
        {
          ...req.body,
          lastModifiedBy: req.user._id,
        },
        { new: true }
      );
    }

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Preview invoice template
 * @route   POST /api/admin/invoice-templates/preview
 * @access  Private (Admin)
 */
exports.previewTemplate = async (req, res) => {
  try {
    const { template, styles, sampleData } = req.body;

    // Compile template with sample data
    const html = invoiceGenerator.compileTemplate(template, sampleData || getSampleInvoiceData());

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${styles || ''}</style>
      </head>
      <body>${html}</body>
      </html>
    `;

    res.json({ html: fullHtml });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Initialize default templates
 * @route   POST /api/admin/invoice-templates/init
 * @access  Private (Admin)
 */
exports.initDefaultTemplates = async (req, res) => {
  try {
    await InvoiceTemplate.createDefaultTemplates();
    res.json({ message: 'Default templates initialized' });
  } catch (error) {
    console.error('Error initializing templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Sample invoice data for preview
function getSampleInvoiceData() {
  return {
    invoiceNumber: 'INV-2024-00001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    seller: {
      name: 'E-Commerce Platform',
      address: '123 Business Street',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75000',
      phone: '+92-21-12345678',
      ntn: '1234567-8',
    },
    buyer: {
      name: 'John Doe',
      address: '456 Customer Lane',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      phone: '+92-300-1234567',
    },
    items: [
      { description: 'Product 1', quantity: 2, unitPrice: 1500, total: 3000 },
      { description: 'Product 2', quantity: 1, unitPrice: 2500, total: 2500 },
    ],
    subtotal: 5500,
    taxBreakdown: [{ taxName: 'GST', rate: 17, amount: 935 }],
    totalTax: 935,
    shippingCost: 200,
    discount: 0,
    grandTotal: 6635,
    currency: 'PKR',
    footerText: 'Thank you for your business!',
  };
}
