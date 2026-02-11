const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    sender: {
      type: {
        type: String,
        enum: ['customer', 'vendor', 'admin', 'system'],
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String, // Display name
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 10000,
    },
    attachments: [{
      filename: String,
      url: String,
      mimeType: String,
      size: Number,
    }],
    isInternalNote: {
      type: Boolean,
      default: false, // Hidden from customer
    },
    isAutoResponse: {
      type: Boolean,
      default: false,
    },
    templateUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketTemplate',
    },
    // Read status
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],
    // For email notifications
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketMessageSchema.index({ ticket: 1, createdAt: 1 });
ticketMessageSchema.index({ 'sender.user': 1 });

// Update ticket's messageCount and lastActivityAt after saving
ticketMessageSchema.post('save', async function () {
  const Ticket = mongoose.model('Ticket');
  const messageCount = await this.constructor.countDocuments({ ticket: this.ticket });

  const update = {
    messageCount,
    lastActivityAt: new Date(),
  };

  // If this is the first response from staff, update firstResponseAt
  if (!this.isInternalNote && ['admin', 'vendor'].includes(this.sender.type)) {
    const ticket = await Ticket.findById(this.ticket);
    if (ticket && !ticket.firstResponseAt) {
      update.firstResponseAt = new Date();
    }
  }

  await Ticket.findByIdAndUpdate(this.ticket, update);
});

// Static method to get messages for a ticket
ticketMessageSchema.statics.getTicketMessages = async function (ticketId, options = {}) {
  const { includeInternal = false, page = 1, limit = 50 } = options;

  const query = { ticket: ticketId };
  if (!includeInternal) {
    query.isInternalNote = false;
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    this.find(query)
      .populate('sender.user', 'email profile')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method to mark messages as read
ticketMessageSchema.statics.markAsRead = async function (ticketId, userId) {
  const messages = await this.find({
    ticket: ticketId,
    'readBy.user': { $ne: userId },
  });

  for (const message of messages) {
    message.readBy.push({ user: userId, readAt: new Date() });
    await message.save();
  }

  return messages.length;
};

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);
