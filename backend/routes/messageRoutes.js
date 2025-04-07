const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', messageController.sendMessage);
router.get('/conversation/:contactId', messageController.getMessages);
router.get('/conversations', messageController.getRecentConversations);

module.exports = router;