const mongoose = require('mongoose');

const reviewReplySchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Edit allowed within 48 hours
    editDeadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One reply per review
reviewReplySchema.index({ review: 1 }, { unique: true });
reviewReplySchema.index({ vendor: 1, createdAt: -1 });

// Set edit deadline on creation
reviewReplySchema.pre('save', function (next) {
  if (this.isNew) {
    // Can edit within 48 hours
    this.editDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
  next();
});

// Check if edit is allowed
reviewReplySchema.methods.canEdit = function () {
  return new Date() < this.editDeadline;
};

module.exports = mongoose.model('ReviewReply', reviewReplySchema);
