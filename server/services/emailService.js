/**
 * emailService.js
 * ---------------
 * Handles all email delivery for the Digital Notice Board system.
 * - Reads SMTP credentials from environment variables (never hardcoded).
 * - Falls back to Ethereal fake SMTP when credentials are absent (dev mode).
 * - Sends bulk emails in batches to respect rate limits.
 * - Deduplicates recipients before sending.
 * - Generates rich HTML notice templates automatically.
 */

const nodemailer = require('nodemailer');

const BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE || '50', 10);
const BATCH_DELAY_MS = parseInt(process.env.EMAIL_BATCH_DELAY_MS || '1000', 10);

// ── Transporter factory ──────────────────────────────────────────────────────

let _transporter = null; // cached per-process (recreated if env changes)

async function createTransporter() {
  if (_transporter) return _transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('[emailService] Using configured SMTP:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    _transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Gmail requires this to avoid "Less secure app" issues with App Passwords
      tls: { rejectUnauthorized: false },
    });
  } else {
    console.log('[emailService] No EMAIL_USER/EMAIL_PASS — using Ethereal test account (dev mode)');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  // Verify connection on first use
  try {
    await _transporter.verify();
    console.log('[emailService] SMTP connection verified ✓');
  } catch (err) {
    console.error('[emailService] SMTP connection verification failed:', err.message);
    _transporter = null; // reset so next call retries
    throw new Error(`SMTP connection failed: ${err.message}`);
  }

  return _transporter;
}

// ── HTML template builder ────────────────────────────────────────────────────

function buildHtmlEmail({ title, description, section, years, visibilityDate, visibilityEndDate, hyperlink, department }) {
  const sectionLabel = section === 'event' ? 'Event' : 'Notice';
  const yearText = Array.isArray(years) && years.length > 0 ? years.join(', ') : 'All Students';
  const deptText = department || '';

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
    });
  };

  const accentColor = section === 'event' ? '#1a73e8' : '#34a853';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || 'New ' + sectionLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#000;padding:20px 24px;">
            <p style="margin:0;color:#fff;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Student Notice Board</p>
            <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">
              <span style="color:${accentColor};">●</span> New ${sectionLabel}
            </h1>
          </td>
        </tr>
        <!-- Badge row -->
        <tr>
          <td style="background:${accentColor};padding:8px 24px;">
            <span style="color:#fff;font-size:12px;font-weight:bold;">${sectionLabel.toUpperCase()}</span>
            ${yearText ? `<span style="color:rgba(255,255,255,.8);font-size:12px;margin-left:12px;">For: ${yearText}</span>` : ''}
            ${deptText ? `<span style="color:rgba(255,255,255,.8);font-size:12px;margin-left:12px;">Dept: ${deptText}</span>` : ''}
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 24px;">
            <h2 style="margin:0 0 12px;color:#111;font-size:20px;">${title || 'Untitled'}</h2>
            ${description ? `<p style="color:#444;line-height:1.7;margin:0 0 20px;white-space:pre-wrap;">${description.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>` : ''}
            <!-- Info table -->
            <table cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:6px;padding:16px;width:100%;">
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;width:140px;">📅 Visible From</td>
                <td style="padding:6px 0;color:#222;font-size:13px;font-weight:bold;">${formatDate(visibilityDate)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;">⏰ Visible Until</td>
                <td style="padding:6px 0;color:#222;font-size:13px;font-weight:bold;">${formatDate(visibilityEndDate)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;">🎓 For Year(s)</td>
                <td style="padding:6px 0;color:#222;font-size:13px;font-weight:bold;">${yearText}</td>
              </tr>
            </table>
            ${hyperlink ? `
            <div style="margin-top:24px;text-align:center;">
              <a href="${hyperlink}" style="display:inline-block;background:${accentColor};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;">
                View Details →
              </a>
            </div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#999;font-size:12px;">
              This is an automated notification from the Student Notice Board.<br/>
              Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Core send function ───────────────────────────────────────────────────────

/**
 * Send a single email (low-level).
 * @param {object} opts
 * @param {string|string[]} opts.to
 * @param {string}          opts.subject
 * @param {string}          opts.body       – plain text fallback
 * @param {string}          [opts.html]     – rich HTML body (auto-built if omitted)
 * @param {object}          [opts.notice]   – notice data for auto HTML template
 */
async function sendEmail({ to, subject, body, html, notice }) {
  console.log(`[emailService] sendEmail() → subject="${subject}", recipients=${Array.isArray(to) ? to.length : 1}`);

  const transporter = await createTransporter();

  const htmlContent = html || (notice
    ? buildHtmlEmail(notice)
    : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
         <div style="background:#000;padding:20px;text-align:center;">
           <h1 style="color:#fff;margin:0;font-size:20px;">Student Notice Board</h1>
         </div>
         <div style="padding:24px;background:#fff;border:1px solid #e0e0e0;">
           <p style="white-space:pre-wrap;color:#333;line-height:1.6;">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
         </div>
         <div style="padding:12px;background:#f5f5f5;text-align:center;font-size:12px;color:#888;">
           This is an automated notification. Please do not reply to this email.
         </div>
       </div>`);

  const fromName = process.env.EMAIL_FROM_NAME || 'Student Notice Board';
  const fromAddr = process.env.EMAIL_USER || 'noreply@rtrp.edu';

  const info = await transporter.sendMail({
    from:    `"${fromName}" <${fromAddr}>`,
    to:      Array.isArray(to) ? to.join(', ') : to,
    subject,
    text:    body,
    html:    htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log('[emailService] Preview URL:', previewUrl);
  }
  console.log(`[emailService] Sent ✓ messageId=${info.messageId}`);

  return { messageId: info.messageId, previewUrl };
}

// ── Bulk send with batching ──────────────────────────────────────────────────

/**
 * Send bulk notification emails to a list of recipients in batches.
 * Deduplicates addresses before sending.
 *
 * @param {object}   opts
 * @param {string[]} opts.recipients   – full list of email addresses
 * @param {string}   opts.subject
 * @param {string}   opts.body         – plain-text body
 * @param {object}   [opts.notice]     – notice object for rich HTML template
 * @returns {Promise<{sent:number, failed:number, errors:string[], previewUrls:string[]}>}
 */
async function sendBulkEmails({ recipients, subject, body, notice }) {
  console.log(`[emailService] sendBulkEmails() start — ${recipients.length} raw recipients`);

  // Deduplicate
  const unique = [...new Set(recipients.map(e => e.trim().toLowerCase()))].filter(Boolean);
  console.log(`[emailService] After dedup: ${unique.length} unique recipients`);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid   = unique.filter(e => emailRegex.test(e));
  const invalid = unique.filter(e => !emailRegex.test(e));

  if (invalid.length > 0) {
    console.warn(`[emailService] Skipping ${invalid.length} invalid address(es):`, invalid);
  }

  if (valid.length === 0) {
    console.warn('[emailService] No valid recipients — aborting bulk send');
    return { sent: 0, failed: 0, errors: ['No valid recipient emails found'], previewUrls: [] };
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    batches.push(valid.slice(i, i + BATCH_SIZE));
  }

  console.log(`[emailService] Sending in ${batches.length} batch(es) of up to ${BATCH_SIZE}`);

  let sent = 0;
  let failed = 0;
  const errors = [];
  const previewUrls = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`[emailService] Batch ${bi + 1}/${batches.length} → ${batch.length} recipients`);

    // Send individually so one failure doesn't block others
    const results = await Promise.allSettled(
      batch.map(email =>
        sendEmail({ to: email, subject, body, notice })
          .then(r => { if (r.previewUrl) previewUrls.push(r.previewUrl); return r; })
      )
    );

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const errMsg = `${batch[idx]}: ${r.reason?.message || 'unknown error'}`;
        errors.push(errMsg);
        console.error(`[emailService] Failed to send to ${batch[idx]}:`, r.reason?.message);
      }
    });

    // Delay between batches (skip after last)
    if (bi < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`[emailService] Bulk send complete — sent=${sent}, failed=${failed}`);
  return { sent, failed, errors, previewUrls };
}

module.exports = { sendEmail, sendBulkEmails, buildHtmlEmail };
