const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  sku: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
});

const taxBreakdownSchema = new mongoose.Schema({
  taxType: { type: String, required: true }, // GST, VAT, etc.
  taxName: { type: String },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  phone: { type: String },
  email: { type: String },
  ntn: { type: String }, // National Tax Number (Pakistan)
  strn: { type: String }, // Sales Tax Registration Number
  cnic: { type: String }, // For individuals
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'customer_invoice',      // Invoice to customer for order
        'vendor_statement',      // Statement to vendor for period
        'commission_invoice',    // Commission charged to vendor
        'credit_note',           // Credit note for refund/return
        'payout_receipt',        // Receipt for vendor payout
        'tax_invoice',           // Tax invoice
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'generated', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'void'],
      default: 'draft',
    },

    // References
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    payoutRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutRequest',
    },
    rmaRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RMARequest',
    },

    // Seller/Issuer Info
    seller: partySchema,

    // Buyer/Recipient Info
    buyer: partySchema,

    // Line Items
    items: [invoiceItemSchema],

    // Totals
    subtotal: { type: Number, required: true },
    taxBreakdown: [taxBreakdownSchema],
    totalTax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
    },
    discountReason: { type: String },
    shippingCost: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    otherChargesDescription: { type: String },
    grandTotal: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },

    // Payment Information
    paymentMethod: { type: String },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially_paid', 'refunded'],
      default: 'unpaid',
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    paymentReference: { type: String },

    // PDF Generation
    pdfUrl: { type: String },
    pdfGeneratedAt: { type: Date },
    pdfVersion: { type: Number, default: 1 },

    // Invoice Metadata
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    periodStart: { type: Date }, // For statements
    periodEnd: { type: Date },

    // Terms and Notes
    notes: { type: String },
    terms: { type: String },
    footerText: { type: String },

    // Template
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvoiceTemplate',
    },

    // Email tracking
    sentAt: { type: Date },
    sentTo: [{ type: String }], // Email addresses
    lastReminderAt: { type: Date },
    reminderCount: { type: Number, default: 0 },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },

    // Related invoices (for credit notes)
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },

    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ type: 1, createdAt: -1 });
invoiceSchema.index({ vendor: 1, type: 1, createdAt: -1 });
invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ subOrder: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

// Pre-save calculations
invoiceSchema.pre('save', function (next) {
  // Calculate totals from items if items exist
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.totalTax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

    // Add tax from breakdown if exists
    if (this.taxBreakdown && this.taxBreakdown.length > 0) {
      this.totalTax = this.taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
    }

    this.grandTotal =
      this.subtotal +
      this.totalTax +
      (this.shippingCost || 0) +
      (this.otherCharges || 0) -
      (this.discount || 0);
  }

  next();
});

// Methods
invoiceSchema.methods.markAsPaid = async function (paymentReference, paidAt) {
  this.paymentStatus = 'paid';
  this.paidAmount = this.grandTotal;
  this.paidAt = paidAt || new Date();
  this.paymentReference = paymentReference;
  this.status = 'paid';
  await this.save();
  return this;
};

invoiceSchema.methods.cancel = async function (reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  await this.save();
  return this;
};

invoiceSchema.methods.regeneratePDF = async function () {
  // This will be implemented by the invoice generator service
  this.pdfVersion += 1;
  this.pdfGeneratedAt = null;
  this.pdfUrl = null;
  await this.save();
  return this;
};

// Static method to get next invoice number
invoiceSchema.statics.getNextInvoiceNumber = async function (type) {
  const InvoiceCounter = mongoose.model('InvoiceCounter');
  const year = new Date().getFullYear();

  const prefixes = {
    customer_invoice: 'INV',
    vendor_statement: 'VS',
    commission_invoice: 'COM',
    credit_note: 'CN',
    payout_receipt: 'PR',
    tax_invoice: 'TAX',
  };

  const prefix = prefixes[type] || 'INV';

  const counter = await InvoiceCounter.findOneAndUpdate(
    { type, year },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}-${year}-${String(counter.lastNumber).padStart(5, '0')}`;
};

// Static method to get overdue invoices
invoiceSchema.statics.getOverdueInvoices = function () {
  return this.find({
    status: { $in: ['generated', 'sent'] },
    paymentStatus: { $in: ['unpaid', 'partially_paid'] },
    dueDate: { $lt: new Date() },
  })
    .populate('customer', 'email profile.firstName profile.lastName')
    .populate('vendor', 'storeName email');
};

// Static method to get vendor's invoice summary
invoiceSchema.statics.getVendorSummary = async function (vendorId, startDate, endDate) {
  const match = { vendor: new mongoose.Types.ObjectId(vendorId) };
  if (startDate && endDate) {
    match.invoiceDate = { $gte: startDate, $lte: endDate };
  }

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        paidAmount: { $sum: '$paidAmount' },
      },
    },
  ]);

  return summary;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
