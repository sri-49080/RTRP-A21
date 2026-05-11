/**
 * autoNotificationService.js
 * ---------------------------
 * Background service that handles automatic email notifications.
 *
 * Triggers:
 *  1. Immediately when a notice/event is created (via triggerAutoNotification).
 *  2. Immediately when an existing notice/event is updated.
 *  3. Scheduled: every minute checks for notices whose visibility window just opened
 *     and sends notifications for those that haven't been notified yet.
 *
 * Anti-duplicate guard: stores the MongoDB _id of already-notified notices
 * in a Set (in-memory) so a restart can re-notify, which is intentional
 * since the system may have missed notifications after a crash.
 */

const { sendBulkEmails, buildHtmlEmail } = require('./emailService');

// Track which notice IDs have already been auto-notified this process lifetime
const notifiedIds = new Set();

/**
 * Fetch all users matching the given year list from the DB.
 * @param {mongoose.Model} UserModel
 * @param {string[]}       years  e.g. ['1st Year', '2nd Year']
 * @returns {Promise<string[]>} list of email addresses
 */
async function getUserEmailsByYear(UserModel, years) {
  console.log('[autoNotify] Fetching users for year(s):', years);

  let query;
  if (!years || years.length === 0) {
    // No year filter → all students
    query = UserModel.find({ role: 'Student' }, 'email name year department');
  } else {
    query = UserModel.find({ year: { $in: years }, role: 'Student' }, 'email name year department');
  }

  const users = await query.exec();
  console.log(`[autoNotify] Found ${users.length} users for year(s):`, years);

  // Group users by year
  const yearGroups = {};
  users.forEach(u => {
    const yr = u.year || 'Unknown';
    if (!yearGroups[yr]) yearGroups[yr] = [];
    yearGroups[yr].push(u);
  });
  Object.keys(yearGroups).forEach(yr => {
    console.log(`[autoNotify] ${yr} -> ${yearGroups[yr].length} users`);
  });

  // Optionally group by department as well
  /*
  const deptGroups = {};
  users.forEach(u => {
    const dept = u.department || 'Unknown';
    if (!deptGroups[dept]) deptGroups[dept] = [];
    deptGroups[dept].push(u);
  });
  Object.keys(deptGroups).forEach(dept => {
    console.log(`[autoNotify] Dept: ${dept} -> ${deptGroups[dept].length} users`);
  });
  */

  // Log all users
  users.forEach(u => {
    console.log(`[autoNotify] User:`, {
      name: u.name,
      email: u.email,
      year: u.year,
      department: u.department || 'N/A',
    });
  });

  const emails = users.map(u => u.email).filter(Boolean);
  return emails;
}

/**
 * Build the email content from a notice document.
 */
function buildNoticeEmailPayload(notice, port) {
  const sectionLabel = notice.section === 'event' ? 'Event' : 'Notice';
  const yearText     = Array.isArray(notice.years) && notice.years.length > 0
    ? notice.years.join(', ')
    : 'All Students';

  const firstPhoto = (notice.photos && notice.photos[0]) || {};
  const visibilityDate    = firstPhoto.visibilityDate    || notice.visibilityDate;
  const visibilityEndDate = firstPhoto.visibilityEndDate || notice.visibilityEndDate;
  const hyperlink         = firstPhoto.hyperlink         || notice.hyperlink;

  const subject = `[${sectionLabel}] ${notice.title || 'New ' + sectionLabel}`;

  const plainBody = [
    `Dear Student,`,
    ``,
    `A new ${sectionLabel.toLowerCase()} has been posted: "${notice.title || 'Untitled'}"`,
    ``,
    `For: ${yearText}`,
    visibilityDate    ? `Active from : ${new Date(visibilityDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` : null,
    visibilityEndDate ? `Active until: ${new Date(visibilityEndDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` : null,
    hyperlink ? `Link: ${hyperlink}` : null,
    ``,
    `Please check the notice board for full details.`,
    ``,
    `Regards,`,
    `Admin — Student Notice Board`,
  ].filter(l => l !== null).join('\n');

  const noticeData = {
    title:           notice.title,
    description:     notice.details || '',
    section:         notice.section,
    years:           notice.years,
    visibilityDate,
    visibilityEndDate,
    hyperlink,
  };

  return { subject, plainBody, noticeData };
}

/**
 * Core auto-notify function — call this after any notice creation/update.
 *
 * @param {object} notice        – Mongoose document or plain object with notice fields
 * @param {object} UserModel     – Mongoose User model
 * @param {number} port          – Server port (for building URLs)
 * @param {string} [reason]      – Log label: 'created' | 'updated' | 'scheduler'
 */
async function triggerAutoNotification(notice, UserModel, port, reason = 'created') {
  const noticeId = (notice._id || notice.id || '').toString();

  console.log(`[autoNotify] ▶ Triggered (${reason}) for notice "${notice.title}" id=${noticeId}`);

  // Guard against duplicate notifications within same process run
  if (reason !== 'scheduler' && notifiedIds.has(noticeId)) {
    console.log(`[autoNotify] Already notified id=${noticeId} — skipping`);
    return;
  }

  try {
    // Determine target years
    const targetYears = Array.isArray(notice.years) ? notice.years : [];


    // Fetch recipient emails
    const emails = await getUserEmailsByYear(UserModel, targetYears);

    if (emails.length === 0) {
      console.warn(`[autoNotify] No eligible users found for years: ${targetYears.join(', ') || 'all'} — no emails sent`);
      notifiedIds.add(noticeId);
      return;
    }

    // Log recipient email list before sending
    console.log(`[autoNotify] Recipient email list:`, emails);

    const { subject, plainBody, noticeData } = buildNoticeEmailPayload(notice, port);

    console.log(`[autoNotify] Sending to ${emails.length} recipient(s), subject="${subject}"`);

    const result = await sendBulkEmails({
      recipients: emails,
      subject,
      body:       plainBody,
      notice:     noticeData,
    });

    console.log(`[autoNotify] ✓ Bulk send complete — sent=${result.sent}, failed=${result.failed}`);
    if (result.errors.length > 0) {
      console.error('[autoNotify] Delivery errors:', result.errors);
    }
    if (result.previewUrls.length > 0) {
      console.log('[autoNotify] Preview URLs:', result.previewUrls);
    }

    notifiedIds.add(noticeId);

  } catch (err) {
    console.error(`[autoNotify] ✗ Failed for notice id=${noticeId}:`, err.message);
    console.error(err.stack);
    // Do NOT add to notifiedIds so a retry can happen on next scheduler tick
  }
}

/**
 * Start the background scheduler.
 * Checks every 60 s for notices that just became visible and haven't been notified.
 *
 * @param {object} NoticeModel – Mongoose Notice model
 * @param {object} UserModel   – Mongoose User model
 * @param {number} port        – Server port
 */
function startNotificationScheduler(NoticeModel, UserModel, port) {
  const INTERVAL_MS = parseInt(process.env.NOTIFY_SCHEDULER_INTERVAL_MS || '60000', 10);

  console.log(`[autoNotify] Scheduler started — checking every ${INTERVAL_MS / 1000}s`);

  const tick = async () => {
    console.log('[autoNotify] Scheduler tick —', new Date().toISOString());
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - INTERVAL_MS); // last tick window

      // Find notices whose visibility window just opened (between last tick and now)
      const recentlyActivated = await NoticeModel.find({
        $or: [
          { visibilityDate: { $gte: windowStart, $lte: now } },
          { 'photos.visibilityDate': { $gte: windowStart, $lte: now } },
        ]
      });

      console.log(`[autoNotify] Scheduler found ${recentlyActivated.length} recently-activated notice(s)`);

      for (const notice of recentlyActivated) {
        const id = notice._id.toString();
        if (!notifiedIds.has(id)) {
          await triggerAutoNotification(notice, UserModel, port, 'scheduler');
        }
      }
    } catch (err) {
      console.error('[autoNotify] Scheduler tick error:', err.message);
    }
  };

  // Run immediately on startup, then on interval
  tick();
  const timer = setInterval(tick, INTERVAL_MS);

  // Return stop function for graceful shutdown
  return () => {
    clearInterval(timer);
    console.log('[autoNotify] Scheduler stopped');
  };
}

module.exports = { triggerAutoNotification, startNotificationScheduler };
