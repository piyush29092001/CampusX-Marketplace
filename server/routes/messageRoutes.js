const express = require('express');
const { startConversation, sendMessage, getConversations, getMessages, deleteConversation, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All message routes are strictly protected
router.use(protect);

router.post('/start', startConversation);
router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.delete('/conversations/:conversationId', deleteConversation);
router.delete('/:messageId', deleteMessage);

module.exports = router;
