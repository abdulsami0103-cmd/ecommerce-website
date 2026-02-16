const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// @desc    Get user's conversations
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'profile.firstName profile.lastName profile.avatar email role')
      .populate('lastMessage.sender', 'profile.firstName profile.lastName')
      .sort({ updatedAt: -1 });

    // Attach vendor store names for vendor participants
    const participantIds = [];
    conversations.forEach(c => {
      c.participants.forEach(p => {
        if (p._id && p.role === 'vendor') participantIds.push(p._id);
      });
    });

    if (participantIds.length > 0) {
      const vendors = await Vendor.find({ user: { $in: participantIds } }).select('user storeName logo');
      const vendorMap = {};
      vendors.forEach(v => { vendorMap[v.user.toString()] = v; });

      const convObjects = conversations.map(c => {
        const obj = c.toObject();
        obj.participants = obj.participants.map(p => {
          const vendor = vendorMap[p._id.toString()];
          if (vendor) {
            p.vendorStoreName = vendor.storeName;
            p.vendorLogo = vendor.logo;
          }
          return p;
        });
        return obj;
      });

      return res.status(200).json({
        success: true,
        data: convObjects,
      });
    }

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or get conversation
// @route   POST /api/conversations
// @access  Private
const startConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;

    if (participantId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself',
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
    }).populate('participants', 'profile.firstName profile.lastName profile.avatar email');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
      });

      await conversation.populate(
        'participants',
        'profile.firstName profile.lastName profile.avatar email'
      );
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation messages
// @route   GET /api/conversations/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'profile.firstName profile.lastName profile.avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments({ conversation: req.params.id });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;

    // Check if user is participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      content,
      attachments,
      readBy: [req.user.id],
    });

    await message.populate('sender', 'profile.firstName profile.lastName profile.avatar');

    // Update unread count for other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user.id) {
        const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    await conversation.save();

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
};
