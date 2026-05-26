import express from 'express';
import { sendChatMessage } from '../controllers/chatController.js';
import { chatRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/', chatRateLimit, sendChatMessage);

export default router;
