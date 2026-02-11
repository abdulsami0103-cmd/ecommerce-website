const mongoose = require('mongoose');

const ticketTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'order_issue',
        'product_inquiry',
        'payment',
        'shipping',
        'refund',
        'general',
        'vendor_complaint',
        'technical',
        'all', // For templates applicable to all categories
      ],
      default: 'all',
    },
    subject: {
      type: String, // For auto-responses that create new messages
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Template body is required'],
      maxlength: 10000,
    },
    // Variables available: {{customer_name}}, {{ticket_number}}, {{order_number}}, etc.
    variables: [{
      type: String,
    }],
    isAutoResponse: {
      type: Boolean,
      default: false, // Sent automatically on ticket creation
    },
    autoResponseTrigger: {
      type: String,
      enum: ['ticket_created', 'ticket_assigned', 'ticket_resolved', 'ticket_closed'],
    },
    autoAssignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Auto-assign to specific user
    },
    autoAssignTeam: {
      type: String,
      enum: ['support', 'finance', 'operations', 'technical'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null, // null = platform-wide template
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketTemplateSchema.index({ category: 1, isActive: 1 });
ticketTemplateSchema.index({ vendor: 1 });
ticketTemplateSchema.index({ isAutoResponse: 1, autoResponseTrigger: 1 });

// Method to compile template with variables
ticketTemplateSchema.methods.compile = function (data) {
  let compiled = this.body;

  const variableMap = {
    customer_name: data.customerName || 'Customer',
    ticket_number: data.ticketNumber || '',
    order_number: data.orderNumber || '',
    vendor_name: data.vendorName || '',
    subject: data.subject || '',
    category: data.category || '',
    platform_name: process.env.PLATFORM_NAME || 'E-Commerce Platform',
    support_email: process.env.SUPPORT_EMAIL || 'support@platform.com',
    ...data,
  };

  for (const [key, value] of Object.entries(variableMap)) {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return compiled;
};

// Static method to get auto-response template
ticketTemplateSchema.statics.getAutoResponse = async function (trigger, category) {
  return this.findOne({
    isActive: true,
    isAutoResponse: true,
    autoResponseTrigger: trigger,
    $or: [{ category }, { category: 'all' }],
  });
};

// Static method to get templates for a category
ticketTemplateSchema.statics.getByCategory = async function (category, vendorId = null) {
  const query = {
    isActive: true,
    isAutoResponse: false,
    $or: [{ category }, { category: 'all' }],
  };

  // Include platform templates and vendor-specific templates
  if (vendorId) {
    query.$and = [
      { $or: [{ vendor: null }, { vendor: vendorId }] },
    ];
  } else {
    query.vendor = null;
  }

  return this.find(query).sort({ name: 1 });
};

module.exports = mongoose.model('TicketTemplate', ticketTemplateSchema);
