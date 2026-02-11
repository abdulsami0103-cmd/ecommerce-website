const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const TicketTemplate = require('../models/TicketTemplate');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');

// SLA deadlines in hours
const SLA_HOURS = {
  urgent: 2,
  high: 6,
  medium: 24,
  low: 48,
};

/**
 * @desc    Create a new ticket
 * @route   POST /api/tickets
 * @access  Customer
 */
exports.createTicket = async (req, res) => {
  try {
    const {
      category,
      priority,
      subject,
      description,
      orderId,
      subOrderId,
      attachments,
    } = req.body;

    // Build ticket data
    const ticketData = {
      customer: req.user._id,
      category,
      priority: priority || 'medium',
      subject,
      description,
      attachments: attachments || [],
      metadata: {
        source: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    };

    // Link to order if provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.customer.toString() === req.user._id.toString()) {
        ticketData.order = orderId;
      }
    }

    if (subOrderId) {
      const subOrder = await SubOrder.findById(subOrderId);
      if (subOrder) {
        ticketData.subOrder = subOrderId;
        ticketData.vendor = subOrder.vendor;
      }
    }

    // Auto-routing based on category
    if (['order_issue', 'shipping'].includes(category) && ticketData.vendor) {
      ticketData.status = 'waiting_vendor';
    } else if (['payment', 'refund'].includes(category)) {
      ticketData.assignedTeam = 'finance';
    } else if (category === 'vendor_complaint') {
      // Hidden from vendor, admin only
      ticketData.assignedTeam = 'operations';
      ticketData.vendor = null; // Don't assign to vendor
    } else if (category === 'technical') {
      ticketData.assignedTeam = 'technical';
    } else {
      ticketData.assignedTeam = 'support';
    }

    const ticket = await Ticket.create(ticketData);

    // Create initial message from customer
    await TicketMessage.create({
      ticket: ticket._id,
      sender: {
        type: 'customer',
        user: req.user._id,
        name: `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim() || req.user.email,
      },
      message: description,
      attachments: attachments || [],
    });

    // Send auto-response if configured
    const autoResponse = await TicketTemplate.getAutoResponse('ticket_created', category);
    if (autoResponse) {
      const compiledMessage = autoResponse.compile({
        customerName: req.user.profile?.firstName || 'Customer',
        ticketNumber: ticket.ticketNumber,
        category,
        subject,
      });

      await TicketMessage.create({
        ticket: ticket._id,
        sender: {
          type: 'system',
          name: 'Support Team',
        },
        message: compiledMessage,
        isAutoResponse: true,
        templateUsed: autoResponse._id,
      });

      // Increment template usage
      autoResponse.usageCount += 1;
      await autoResponse.save();
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customer', 'email profile')
      .populate('vendor', 'storeName')
      .populate('order', 'orderNumber');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: populatedTicket,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Get customer's tickets
 * @route   GET /api/tickets
 * @access  Customer
 */
exports.getMyTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('vendor', 'storeName')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket details
 * @route   GET /api/tickets/:id
 * @access  Customer/Vendor/Admin
 */
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'email profile')
      .populate('vendor', 'storeName businessName')
      .populate('order', 'orderNumber totals')
      .populate('subOrder', 'subOrderNumber')
      .populate('assignedTo', 'email profile');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check access
    let vendorId = null;
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      vendorId = vendor?._id;
    }

    if (!ticket.canView(req.user, vendorId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket',
      });
    }

    // Get messages
    const includeInternal = req.user.role === 'admin' || req.user.role === 'vendor';
    const messagesResult = await TicketMessage.getTicketMessages(ticket._id, {
      includeInternal,
    });

    // Mark messages as read
    await TicketMessage.markAsRead(ticket._id, req.user._id);

    res.json({
      success: true,
      data: {
        ticket,
        messages: messagesResult.messages,
      },
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Add message to ticket
 * @route   POST /api/tickets/:id/messages
 * @access  Customer/Vendor/Admin
 */
exports.addMessage = async (req, res) => {
  try {
    const { message, attachments, isInternalNote, templateId } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check access
    let vendorId = null;
    let senderType = 'customer';
    let senderName = `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim() || req.user.email;

    if (req.user.role === 'admin') {
      senderType = 'admin';
      senderName = 'Support Team';
    } else if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor || ticket.vendor?.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reply to this ticket',
        });
      }
      vendorId = vendor._id;
      senderType = 'vendor';
      senderName = vendor.storeName;
    } else if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this ticket',
      });
    }

    // Use template if provided
    let finalMessage = message;
    if (templateId && (req.user.role === 'admin' || req.user.role === 'vendor')) {
      const template = await TicketTemplate.findById(templateId);
      if (template) {
        finalMessage = template.compile({
          customerName: ticket.customer?.profile?.firstName || 'Customer',
          ticketNumber: ticket.ticketNumber,
        });
        template.usageCount += 1;
        await template.save();
      }
    }

    const ticketMessage = await TicketMessage.create({
      ticket: ticket._id,
      sender: {
        type: senderType,
        user: req.user._id,
        name: senderName,
      },
      message: finalMessage,
      attachments: attachments || [],
      isInternalNote: isInternalNote && (req.user.role === 'admin' || req.user.role === 'vendor'),
      templateUsed: templateId,
    });

    // Update ticket status based on who replied
    if (senderType === 'customer') {
      if (['waiting_customer', 'resolved'].includes(ticket.status)) {
        ticket.status = ticket.vendor ? 'waiting_vendor' : 'open';
      }
    } else if (senderType === 'vendor' || senderType === 'admin') {
      if (!isInternalNote) {
        ticket.status = 'waiting_customer';
      }
    }

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: ticketMessage,
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding message',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign ticket
 * @route   PUT /api/tickets/:id/assign
 * @access  Admin
 */
exports.assignTicket = async (req, res) => {
  try {
    const { assignedTo, assignedTeam } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (assignedTo) ticket.assignedTo = assignedTo;
    if (assignedTeam) ticket.assignedTeam = assignedTeam;
    ticket.status = 'assigned';

    await ticket.save();

    // Add system message
    await TicketMessage.create({
      ticket: ticket._id,
      sender: { type: 'system', name: 'System' },
      message: `Ticket assigned to ${assignedTeam || 'staff'}`,
      isInternalNote: true,
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Escalate ticket
 * @route   PUT /api/tickets/:id/escalate
 * @access  Vendor/Admin
 */
exports.escalateTicket = async (req, res) => {
  try {
    const { reason } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.status = 'escalated';
    ticket.isEscalated = true;
    ticket.escalatedAt = new Date();
    ticket.escalatedReason = reason;
    ticket.escalatedBy = req.user._id;
    ticket.assignedTeam = 'operations'; // Escalate to operations team

    await ticket.save();

    // Add system message
    await TicketMessage.create({
      ticket: ticket._id,
      sender: { type: 'system', name: 'System' },
      message: `Ticket escalated: ${reason}`,
      isInternalNote: true,
    });

    res.json({
      success: true,
      message: 'Ticket escalated successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error escalating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error escalating ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Resolve ticket
 * @route   PUT /api/tickets/:id/resolve
 * @access  Vendor/Admin
 */
exports.resolveTicket = async (req, res) => {
  try {
    const { resolution } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();

    await ticket.save();

    // Add resolution message
    if (resolution) {
      await TicketMessage.create({
        ticket: ticket._id,
        sender: {
          type: req.user.role === 'admin' ? 'admin' : 'vendor',
          user: req.user._id,
          name: 'Support Team',
        },
        message: resolution,
      });
    }

    res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Close ticket
 * @route   PUT /api/tickets/:id/close
 * @access  Admin
 */
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket closed successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Rate ticket (customer satisfaction)
 * @route   POST /api/tickets/:id/rate
 * @access  Customer
 */
exports.rateTicket = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only rate resolved or closed tickets',
      });
    }

    ticket.satisfactionRating = rating;
    ticket.satisfactionFeedback = feedback;

    await ticket.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback',
      data: ticket,
    });
  } catch (error) {
    console.error('Error rating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Get vendor tickets
 * @route   GET /api/vendor/tickets
 * @access  Vendor
 */
exports.getVendorTickets = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found',
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const query = { vendor: vendor._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total, stats] = await Promise.all([
      Ticket.find(query)
        .populate('customer', 'email profile')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query),
      Ticket.getStats({ vendor: vendor._id }),
    ]);

    res.json({
      success: true,
      data: tickets,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all tickets (admin)
 * @route   GET /api/admin/tickets
 * @access  Admin
 */
exports.getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      assignedTeam,
      vendor,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTeam) query.assignedTeam = assignedTeam;
    if (vendor) query.vendor = vendor;

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [tickets, total, stats] = await Promise.all([
      Ticket.find(query)
        .populate('customer', 'email profile')
        .populate('vendor', 'storeName')
        .populate('assignedTo', 'email profile')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query),
      Ticket.getStats({}),
    ]);

    res.json({
      success: true,
      data: tickets,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket statistics
 * @route   GET /api/admin/tickets/stats
 * @access  Admin
 */
exports.getTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.getStats({});

    // Get average response time
    const responseTimeStats = await Ticket.aggregate([
      { $match: { firstResponseAt: { $exists: true } } },
      {
        $project: {
          responseTime: { $subtract: ['$firstResponseAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);

    // Get average resolution time
    const resolutionTimeStats = await Ticket.aggregate([
      { $match: { resolvedAt: { $exists: true } } },
      {
        $project: {
          resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTime' },
        },
      },
    ]);

    // Get satisfaction rating
    const satisfactionStats = await Ticket.aggregate([
      { $match: { satisfactionRating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$satisfactionRating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    // Get tickets by category
    const byCategory = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        avgResponseTime: responseTimeStats[0]?.avgResponseTime || 0,
        avgResolutionTime: resolutionTimeStats[0]?.avgResolutionTime || 0,
        avgSatisfactionRating: satisfactionStats[0]?.avgRating || 0,
        totalSatisfactionRatings: satisfactionStats[0]?.totalRatings || 0,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get/Create ticket templates
 * @route   GET/POST /api/admin/tickets/templates
 * @access  Admin
 */
exports.getTemplates = async (req, res) => {
  try {
    const { category, isAutoResponse } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (isAutoResponse !== undefined) query.isAutoResponse = isAutoResponse === 'true';

    const templates = await TicketTemplate.find(query)
      .populate('createdBy', 'email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message,
    });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await TicketTemplate.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template',
      error: error.message,
    });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await TicketTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error.message,
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await TicketTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message,
    });
  }
};
