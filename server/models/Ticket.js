const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null, // null = platform ticket
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubOrder',
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
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: [
        'open',
        'assigned',
        'in_progress',
        'waiting_customer',
        'waiting_vendor',
        'escalated',
        'resolved',
        'closed',
      ],
      default: 'open',
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin/Staff user
    },
    assignedTeam: {
      type: String,
      enum: ['support', 'finance', 'operations', 'technical'],
    },

    // SLA tracking
    slaDeadline: {
      type: Date,
    },
    firstResponseAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },

    // Customer satisfaction
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    satisfactionFeedback: {
      type: String,
      maxlength: 1000,
    },

    // Tags and escalation
    tags: [String],
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: {
      type: Date,
    },
    escalatedReason: {
      type: String,
    },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Attachments on the ticket itself
    attachments: [{
      filename: String,
      url: String,
      mimeType: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Metadata
    metadata: {
      source: {
        type: String,
        enum: ['web', 'email', 'api', 'phone'],
        default: 'web',
      },
      userAgent: String,
      ipAddress: String,
    },

    // Internal notes visible only to staff
    internalNotes: [{
      note: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    }],

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate ticket number before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Find the last ticket of today
    const lastTicket = await this.constructor.findOne({
      ticketNumber: new RegExp(`^TKT-${dateStr}-`)
    }).sort({ ticketNumber: -1 });

    let sequence = 1;
    if (lastTicket) {
      const lastSeq = parseInt(lastTicket.ticketNumber.split('-')[2]);
      sequence = lastSeq + 1;
    }

    this.ticketNumber = `TKT-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }

  // Set SLA deadline based on priority
  if (this.isNew && !this.slaDeadline) {
    const SLA_HOURS = {
      urgent: 2,
      high: 6,
      medium: 24,
      low: 48,
    };
    this.slaDeadline = new Date(Date.now() + SLA_HOURS[this.priority] * 60 * 60 * 1000);
  }

  next();
});

// Update lastActivityAt on save
ticketSchema.pre('save', function (next) {
  this.lastActivityAt = new Date();
  next();
});

// Indexes
ticketSchema.index({ customer: 1, status: 1 });
ticketSchema.index({ vendor: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ assignedTeam: 1, status: 1 });
ticketSchema.index({ status: 1, slaDeadline: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ category: 1 });

// Virtual for checking if SLA is breached
ticketSchema.virtual('isSLABreached').get(function () {
  if (['resolved', 'closed'].includes(this.status)) return false;
  return this.slaDeadline && new Date() > this.slaDeadline;
});

// Virtual for time until SLA breach
ticketSchema.virtual('timeToSLA').get(function () {
  if (!this.slaDeadline) return null;
  return this.slaDeadline - new Date();
});

// Method to check if user can view ticket
ticketSchema.methods.canView = function (user, vendorId) {
  // Admin can view all
  if (user.role === 'admin') return true;

  // Customer can view their own tickets
  if (this.customer.toString() === user._id.toString()) return true;

  // Vendor can view tickets assigned to them
  if (vendorId && this.vendor?.toString() === vendorId.toString()) return true;

  // Assigned staff can view
  if (this.assignedTo?.toString() === user._id.toString()) return true;

  return false;
};

// Static method to get ticket stats
ticketSchema.statics.getStats = async function (filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    open: 0,
    assigned: 0,
    in_progress: 0,
    waiting_customer: 0,
    waiting_vendor: 0,
    escalated: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  // Get SLA breach count
  const slaBreached = await this.countDocuments({
    ...filter,
    status: { $nin: ['resolved', 'closed'] },
    slaDeadline: { $lt: new Date() },
  });

  result.slaBreached = slaBreached;

  return result;
};

module.exports = mongoose.model('Ticket', ticketSchema);
