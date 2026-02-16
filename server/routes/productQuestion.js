const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProductQuestions,
  askQuestion,
  getVendorQuestions,
  answerQuestion,
} = require('../controllers/productQuestionController');

// Public: get questions for a product
router.get('/products/:productId/questions', getProductQuestions);

// Private: ask a question
router.post('/products/:productId/questions', protect, askQuestion);

// Vendor: get all questions for vendor's products
router.get('/vendor/questions', protect, authorize('vendor'), getVendorQuestions);

// Vendor: answer a question
router.put('/vendor/questions/:id/answer', protect, authorize('vendor'), answerQuestion);

module.exports = router;
