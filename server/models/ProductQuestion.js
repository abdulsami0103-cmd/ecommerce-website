const mongoose = require('mongoose');

const productQuestionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      maxlength: [500, 'Question cannot exceed 500 characters'],
      trim: true,
    },
    answer: {
      content: { type: String, trim: true, maxlength: 1000 },
      answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      answeredAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

productQuestionSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
