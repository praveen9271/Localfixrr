const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_RESENDS = Number(process.env.OTP_MAX_RESENDS || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);

const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(OTP_LENGTH, '0');

const isProduction = () => process.env.NODE_ENV === 'production';

const envFlag = (value) => String(value || '').trim().toLowerCase() === 'true';

const getSmtpPort = () => {
  const port = Number(process.env.SMTP_PORT);
  if (Number.isInteger(port) && port > 0) return port;
  return envFlag(process.env.SMTP_SECURE) ? 465 : 587;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const logDevEmailOtp = (email, otp, reason) => {
  if (reason) console.warn(`[DEV EMAIL OTP] ${reason}`);
  console.log(`[DEV EMAIL OTP] ${email}: ${otp}`);
};

const hashOtp = (otp, destination) =>
  crypto
    .createHmac('sha256', process.env.OTP_SECRET || process.env.JWT_SECRET || 'localfixr-otp-dev-secret')
    .update(`${destination}:${otp}`)
    .digest('hex');

const isOtpMatch = (otp, destination, otpHash) => {
  if (!otpHash) return false;

  const nextHash = hashOtp(otp, destination);
  const nextHashBuffer = Buffer.from(nextHash);
  const otpHashBuffer = Buffer.from(otpHash);

  if (nextHashBuffer.length !== otpHashBuffer.length) return false;

  return crypto.timingSafeEqual(nextHashBuffer, otpHashBuffer);
};

const getOtpExpiry = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

const canResend = (pending) => {
  const elapsedSeconds = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000;
  return elapsedSeconds >= OTP_RESEND_SECONDS;
};

const createTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure: envFlag(process.env.SMTP_SECURE),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
};

const sendEmailOtp = async ({ email, name, otp }) => {
  const transport = createTransport();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!transport || !from) {
    if (isProduction()) {
      throw new Error('Email OTP is not configured');
    }
    logDevEmailOtp(email, otp, 'SMTP is not configured. Using console OTP fallback.');
    return { sent: false, devOnly: true };
  }

  try {
    await transport.sendMail({
      from,
      to: email,
      subject: 'Verify your LocalFixr email',
      text: `Your LocalFixr email verification OTP is ${otp}. This code expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Verify your email</h2>
          <p>Hello ${escapeHtml(name || 'there')},</p>
          <p>Your LocalFixr email verification OTP is:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:6px">${escapeHtml(otp)}</p>
          <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        </div>
      `,
    });
  } catch (error) {
    if (isProduction()) {
      throw new Error(`Email OTP could not be sent: ${error.message}`);
    }
    logDevEmailOtp(email, otp, `Nodemailer failed: ${error.message}. Using console OTP fallback.`);
    return { sent: false, devOnly: true, error: error.message };
  }

  return { sent: true };
};

const sendResetPasswordOtp = async ({ email, name, otp }) => {
  const transport = createTransport();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!transport || !from) {
    if (isProduction()) {
      throw new Error('Password reset email is not configured');
    }
    logDevEmailOtp(email, otp, 'SMTP is not configured. Using console password reset OTP fallback.');
    return { sent: false, devOnly: true };
  }

  try {
    await transport.sendMail({
      from,
      to: email,
      subject: 'Reset Your Password - LocalFixr',
      text: `Your LocalFixr password reset OTP is ${otp}. This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12)">
            <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:28px 32px;color:#ffffff">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase">LocalFixr</p>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">Reset your password</h1>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 14px;font-size:16px">Hello ${escapeHtml(name || 'there')},</p>
              <p style="margin:0 0 22px;line-height:1.7;color:#475569">Use this one-time code to reset your LocalFixr password. For your security, the code expires in ${OTP_TTL_MINUTES} minutes.</p>
              <div style="margin:24px 0;padding:22px;border-radius:18px;background:#eef2ff;text-align:center">
                <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:3px;color:#4f46e5;text-transform:uppercase">OTP Code</p>
                <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:#111827">${escapeHtml(otp)}</p>
              </div>
              <p style="margin:20px 0 0;line-height:1.7;color:#64748b">If you did not request this password reset, ignore this email. Your current password will remain unchanged.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    if (isProduction()) {
      throw new Error(`Password reset email could not be sent: ${error.message}`);
    }
    logDevEmailOtp(email, otp, `Nodemailer failed: ${error.message}. Using console password reset OTP fallback.`);
    return { sent: false, devOnly: true, error: error.message };
  }

  return { sent: true };
};

const sendNewsletterSubscriptionEmail = async ({ email }) => {
  const transport = createTransport();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!transport || !from) {
    if (isProduction()) {
      throw new Error('Newsletter email is not configured');
    }
    console.log(`[DEV NEWSLETTER EMAIL] ${email}`);
    return { sent: false, devOnly: true };
  }

  try {
    await transport.sendMail({
      from,
      to: email,
      subject: 'Welcome to LocalFixr updates',
      text: 'Thanks for subscribing to LocalFixr. You will receive helpful home-service updates, offers, and platform news from us.',
      html: `
        <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12)">
            <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:28px 32px;color:#ffffff">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase">LocalFixr</p>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">Thanks for subscribing</h1>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 14px;font-size:16px">Hello,</p>
              <p style="margin:0 0 20px;line-height:1.7;color:#475569">You are now subscribed to LocalFixr updates. We will send useful home-service updates, offers, and marketplace news to this email address.</p>
              <div style="margin:24px 0;padding:18px;border-radius:18px;background:#eef2ff;color:#3730a3">
                <strong>Subscribed email:</strong> ${escapeHtml(email)}
              </div>
              <p style="margin:20px 0 0;line-height:1.7;color:#64748b">If this was not you, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    if (isProduction()) {
      throw new Error(`Newsletter email could not be sent: ${error.message}`);
    }
    console.warn(`[DEV NEWSLETTER EMAIL] Nodemailer failed for ${email}: ${error.message}`);
    return { sent: false, devOnly: true, error: error.message };
  }

  return { sent: true };
};

module.exports = {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  OTP_RESEND_SECONDS,
  OTP_TTL_MINUTES,
  canResend,
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpMatch,
  sendEmailOtp,
  sendNewsletterSubscriptionEmail,
  sendResetPasswordOtp,
};
