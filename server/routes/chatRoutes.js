const express = require('express');
const { sendChatMessage } = require('../controllers/chatController');
const { chatRateLimit } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/', chatRateLimit, sendChatMessage);

module.exports = router;
