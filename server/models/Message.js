const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    attachments: [
      {
        url: { type: String },
        filename: { type: String },
        type: { type: String },
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fetching conversation messages
messageSchema.index({ conversation: 1, createdAt: -1 });

// Update conversation's last message after save
messageSchema.post('save', async function () {
  const Conversation = mongoose.model('Conversation');
  await Conversation.findByIdAndUpdate(this.conversation, {
    lastMessage: {
      content: this.content,
      sender: this.sender,
      createdAt: this.createdAt,
    },
  });
});

module.exports = mongoose.model('Message', messageSchema);
