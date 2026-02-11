const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

router.use(protect);

router.route('/').get(getConversations).post(startConversation);

router.route('/:id/messages').get(getMessages).post(sendMessage);

module.exports = router;
