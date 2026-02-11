const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const setupChatSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's room (for receiving messages)
    socket.join(socket.userId);

    // Join conversation rooms
    socket.on('join-conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId,
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, attachments } = data;

        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId,
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content,
          attachments,
          readBy: [socket.userId],
        });

        await message.populate('sender', 'profile.firstName profile.lastName profile.avatar');

        // Update conversation
        conversation.lastMessage = {
          content,
          sender: socket.userId,
          createdAt: message.createdAt,
        };

        // Update unread counts
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId) {
            const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
            conversation.unreadCount.set(participantId.toString(), currentCount + 1);
          }
        });

        await conversation.save();

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', message);

        // Emit notification to other participants
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId) {
            io.to(participantId.toString()).emit('message-notification', {
              conversationId,
              message,
            });
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { conversationId } = data;

        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            readBy: { $ne: socket.userId },
          },
          { $addToSet: { readBy: socket.userId } }
        );

        // Reset unread count
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${socket.userId}`]: 0,
        });

        // Notify sender that messages were read
        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId) {
            io.to(participantId.toString()).emit('messages-read', {
              conversationId,
              readBy: socket.userId,
            });
          }
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing-start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        conversationId,
        userId: socket.userId,
        user: socket.user.profile,
      });
    });

    socket.on('typing-stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = setupChatSocket;
