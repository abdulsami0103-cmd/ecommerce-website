const mongoose = require('mongoose');

const invoiceTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'customer_invoice',
        'vendor_statement',
        'commission_invoice',
        'credit_note',
        'payout_receipt',
        'tax_invoice',
      ],
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Template Content (Handlebars HTML)
    template: {
      type: String,
      required: true,
    },

    // CSS Styles
    styles: {
      type: String,
      default: '',
    },

    // Header
    headerLogo: { type: String },
    headerText: { type: String },
    showHeader: { type: Boolean, default: true },

    // Footer
    footerText: { type: String },
    showFooter: { type: Boolean, default: true },
    showPageNumbers: { type: Boolean, default: true },

    // Page Settings
    pageSize: {
      type: String,
      enum: ['A4', 'Letter', 'Legal'],
      default: 'A4',
    },
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait',
    },
    margins: {
      top: { type: String, default: '20mm' },
      right: { type: String, default: '15mm' },
      bottom: { type: String, default: '20mm' },
      left: { type: String, default: '15mm' },
    },

    // Vendor-specific template (null = platform default)
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },

    // Default Terms and Notes
    defaultTerms: { type: String },
    defaultNotes: { type: String },

    // Color Scheme
    colors: {
      primary: { type: String, default: '#2563eb' },
      secondary: { type: String, default: '#64748b' },
      accent: { type: String, default: '#059669' },
      text: { type: String, default: '#1f2937' },
      background: { type: String, default: '#ffffff' },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceTemplateSchema.index({ type: 1, isDefault: 1 });
invoiceTemplateSchema.index({ vendor: 1, type: 1 });
invoiceTemplateSchema.index({ isActive: 1 });

// Ensure only one default per type
invoiceTemplateSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      {
        type: this.type,
        _id: { $ne: this._id },
        vendor: this.vendor || { $exists: false },
      },
      { isDefault: false }
    );
  }
  next();
});

// Static method to get default template for type
invoiceTemplateSchema.statics.getDefaultTemplate = async function (type, vendorId = null) {
  // First try vendor-specific template
  if (vendorId) {
    const vendorTemplate = await this.findOne({
      type,
      vendor: vendorId,
      isActive: true,
      isDefault: true,
    });
    if (vendorTemplate) return vendorTemplate;
  }

  // Fallback to platform default
  return this.findOne({
    type,
    vendor: { $exists: false },
    isActive: true,
    isDefault: true,
  });
};

// Static method to create default templates
invoiceTemplateSchema.statics.createDefaultTemplates = async function () {
  const defaultTemplates = [
    {
      name: 'Default Customer Invoice',
      type: 'customer_invoice',
      isDefault: true,
      template: getDefaultCustomerInvoiceTemplate(),
      styles: getDefaultStyles(),
      defaultTerms: 'Payment is due within 30 days of invoice date.',
      footerText: 'Thank you for your business!',
    },
    {
      name: 'Default Vendor Statement',
      type: 'vendor_statement',
      isDefault: true,
      template: getDefaultVendorStatementTemplate(),
      styles: getDefaultStyles(),
      defaultTerms: 'This is a summary of your earnings for the specified period.',
    },
    {
      name: 'Default Credit Note',
      type: 'credit_note',
      isDefault: true,
      template: getDefaultCreditNoteTemplate(),
      styles: getDefaultStyles(),
    },
    {
      name: 'Default Payout Receipt',
      type: 'payout_receipt',
      isDefault: true,
      template: getDefaultPayoutReceiptTemplate(),
      styles: getDefaultStyles(),
    },
  ];

  for (const templateData of defaultTemplates) {
    const exists = await this.findOne({
      type: templateData.type,
      vendor: { $exists: false },
      isDefault: true,
    });

    if (!exists) {
      await this.create(templateData);
    }
  }
};

// Default template helpers
function getDefaultStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { max-height: 60px; }
    .invoice-title { font-size: 28px; font-weight: bold; color: #2563eb; }
    .invoice-number { font-size: 14px; color: #666; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 45%; }
    .party-label { font-weight: bold; margin-bottom: 5px; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
    .items-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .totals-row.grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; }
  `;
}

function getDefaultCustomerInvoiceTemplate() {
  return `
    <div class="invoice">
      <div class="header">
        <div>
          {{#if seller.logo}}<img src="{{seller.logo}}" class="logo" alt="Logo">{{/if}}
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">{{invoiceNumber}}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Date:</strong> {{formatDate invoiceDate}}</div>
          {{#if dueDate}}<div><strong>Due Date:</strong> {{formatDate dueDate}}</div>{{/if}}
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">From:</div>
          <div><strong>{{seller.name}}</strong></div>
          <div>{{seller.address}}</div>
          <div>{{seller.city}}, {{seller.state}} {{seller.postalCode}}</div>
          {{#if seller.phone}}<div>Phone: {{seller.phone}}</div>{{/if}}
          {{#if seller.ntn}}<div>NTN: {{seller.ntn}}</div>{{/if}}
        </div>
        <div class="party">
          <div class="party-label">Bill To:</div>
          <div><strong>{{buyer.name}}</strong></div>
          <div>{{buyer.address}}</div>
          <div>{{buyer.city}}, {{buyer.state}} {{buyer.postalCode}}</div>
          {{#if buyer.phone}}<div>Phone: {{buyer.phone}}</div>{{/if}}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{description}}</td>
            <td style="text-align: center;">{{quantity}}</td>
            <td style="text-align: right;">{{formatCurrency unitPrice ../currency}}</td>
            <td style="text-align: right;">{{formatCurrency total ../currency}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>{{formatCurrency subtotal currency}}</span>
        </div>
        {{#if discount}}
        <div class="totals-row">
          <span>Discount:</span>
          <span>-{{formatCurrency discount currency}}</span>
        </div>
        {{/if}}
        {{#if shippingCost}}
        <div class="totals-row">
          <span>Shipping:</span>
          <span>{{formatCurrency shippingCost currency}}</span>
        </div>
        {{/if}}
        {{#each taxBreakdown}}
        <div class="totals-row">
          <span>{{taxName}} ({{rate}}%):</span>
          <span>{{formatCurrency amount ../currency}}</span>
        </div>
        {{/each}}
        <div class="totals-row grand-total">
          <span>Total:</span>
          <span>{{formatCurrency grandTotal currency}}</span>
        </div>
      </div>

      {{#if notes}}
      <div style="margin-top: 30px;">
        <strong>Notes:</strong>
        <p>{{notes}}</p>
      </div>
      {{/if}}

      {{#if terms}}
      <div style="margin-top: 20px;">
        <strong>Terms & Conditions:</strong>
        <p>{{terms}}</p>
      </div>
      {{/if}}

      <div class="footer">
        {{footerText}}
      </div>
    </div>
  `;
}

function getDefaultVendorStatementTemplate() {
  return `
    <div class="invoice">
      <div class="header">
        <div>
          <div class="invoice-title">VENDOR STATEMENT</div>
          <div class="invoice-number">{{invoiceNumber}}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Period:</strong> {{formatDate periodStart}} - {{formatDate periodEnd}}</div>
          <div><strong>Generated:</strong> {{formatDate invoiceDate}}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">Vendor:</div>
          <div><strong>{{buyer.name}}</strong></div>
          <div>{{buyer.address}}</div>
          {{#if buyer.ntn}}<div>NTN: {{buyer.ntn}}</div>{{/if}}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{description}}</td>
            <td style="text-align: right;">{{formatCurrency total ../currency}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand-total">
          <span>Net Earnings:</span>
          <span>{{formatCurrency grandTotal currency}}</span>
        </div>
      </div>
    </div>
  `;
}

function getDefaultCreditNoteTemplate() {
  return `
    <div class="invoice">
      <div class="header">
        <div>
          <div class="invoice-title" style="color: #dc2626;">CREDIT NOTE</div>
          <div class="invoice-number">{{invoiceNumber}}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Date:</strong> {{formatDate invoiceDate}}</div>
          {{#if relatedInvoice}}<div><strong>Original Invoice:</strong> {{relatedInvoice.invoiceNumber}}</div>{{/if}}
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">Issued To:</div>
          <div><strong>{{buyer.name}}</strong></div>
          <div>{{buyer.address}}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{description}}</td>
            <td style="text-align: center;">{{quantity}}</td>
            <td style="text-align: right;">{{formatCurrency total ../currency}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand-total">
          <span>Credit Amount:</span>
          <span>{{formatCurrency grandTotal currency}}</span>
        </div>
      </div>

      {{#if notes}}
      <div style="margin-top: 30px;">
        <strong>Reason:</strong>
        <p>{{notes}}</p>
      </div>
      {{/if}}
    </div>
  `;
}

function getDefaultPayoutReceiptTemplate() {
  return `
    <div class="invoice">
      <div class="header">
        <div>
          <div class="invoice-title" style="color: #059669;">PAYOUT RECEIPT</div>
          <div class="invoice-number">{{invoiceNumber}}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Date:</strong> {{formatDate invoiceDate}}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">Paid To:</div>
          <div><strong>{{buyer.name}}</strong></div>
          <div>{{buyer.address}}</div>
          {{#if buyer.ntn}}<div>NTN: {{buyer.ntn}}</div>{{/if}}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{description}}</td>
            <td style="text-align: right;">{{formatCurrency total ../currency}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand-total">
          <span>Total Paid:</span>
          <span>{{formatCurrency grandTotal currency}}</span>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <strong>Payment Method:</strong> {{paymentMethod}}
        {{#if paymentReference}}<br><strong>Reference:</strong> {{paymentReference}}{{/if}}
      </div>
    </div>
  `;
}

module.exports = mongoose.model('InvoiceTemplate', invoiceTemplateSchema);
