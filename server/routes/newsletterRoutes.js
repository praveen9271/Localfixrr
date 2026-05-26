import express from 'express';
import { subscribeNewsletter } from '../controllers/newsletterController.js';
import { otpRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/subscribe', otpRateLimit, subscribeNewsletter);

export default router;
