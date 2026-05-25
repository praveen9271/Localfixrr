const express = require('express');
const { subscribeNewsletter } = require('../controllers/newsletterController');
const { otpRateLimit } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/subscribe', otpRateLimit, subscribeNewsletter);

module.exports = router;
