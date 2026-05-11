const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * Reads credentials from environment variables:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS
 *
 * Falls back to Ethereal (fake SMTP) in development when credentials are absent.
 */
async function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production / configured SMTP (e.g. Gmail, SendGrid, custom SMTP)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Development fallback — Ethereal captures messages without sending real mail
  const testAccount = await nodemailer.createTestAccount();
  console.log('[emailService] No EMAIL_USER/EMAIL_PASS set — using Ethereal test account');
  console.log('[emailService] Preview URL will be logged after each send');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Sends an email notification.
 *
 * @param {Object} options
 * @param {string|string[]} options.to       – Recipient(s)
 * @param {string}          options.subject  – Email subject
 * @param {string}          options.body     – Plain-text body
 * @param {string}          [options.html]   – Optional HTML body (auto-generated if omitted)
 * @returns {Promise<{messageId: string, previewUrl: string|null}>}
 */
async function sendEmail({ to, subject, body, html }) {
  const transporter = await createTransporter();

  // Auto-generate a simple HTML version if none provided
  const htmlContent =
    html ||
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <div style="background: #000; padding: 20px; text-align: center;">
         <h1 style="color: #fff; margin: 0; font-size: 20px;">Student Notice Board</h1>
       </div>
       <div style="padding: 24px; background: #fff; border: 1px solid #e0e0e0;">
         <p style="white-space: pre-wrap; color: #333; line-height: 1.6;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
       </div>
       <div style="padding: 12px; background: #f5f5f5; text-align: center; font-size: 12px; color: #888;">
         This is an automated notification. Please do not reply to this email.
       </div>
     </div>`;

  const fromName = process.env.EMAIL_FROM_NAME || 'Student Notice Board';
  const fromAddr = process.env.EMAIL_USER || 'noreply@rtrp.edu';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text: body,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log('[emailService] Preview URL:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendEmail };
