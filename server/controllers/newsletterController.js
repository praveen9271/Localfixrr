const { sendNewsletterSubscriptionEmail } = require('../services/otpService');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const subscribeNewsletter = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.',
      });
    }

    await sendNewsletterSubscriptionEmail({ email });

    return res.status(200).json({
      success: true,
      message: 'Subscription email sent successfully.',
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send subscription email right now.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

module.exports = {
  subscribeNewsletter,
};
