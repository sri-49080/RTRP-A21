/**
 * server.js — Digital Notice Board Backend
 * =========================================
 * Fixes applied:
 *  1. AUTO EMAIL MODE   — auto-notification fires on create/update via service
 *  2. FETCH USERS       — real DB query with year segregation
 *  3. YEAR SEGREGATION  — notices/users filtered by year correctly
 *  4. BULK EMAIL        — batched, deduped, async via autoNotificationService
 *  5. POST SAVING       — schema + controller validated and corrected
 *  6. DASHBOARD         — correct response shape, color coding, 10-s polling intact
 *  7. HISTORY/VISIBILITY— upcoming / active / past correctly computed
 *  8. LOGGING           — detailed logs throughout
 *  9. CODE QUALITY      — env vars, modular services, error handling
 */

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');
const fs         = require('fs');
const multer     = require('multer');

const { assignRoleByEmail } = require('./roleAssigner');
const { generateToken, authenticateToken, authorize } = require('./authMiddleware');
const { sendEmail, sendBulkEmails } = require('./services/emailService');
const { triggerAutoNotification, startNotificationScheduler } = require('./services/autoNotificationService');

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.options('*', cors());

// MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rtrp_db';

// Schemas
const photoSubSchema = new mongoose.Schema({
  photoUrl:          { type: String },
  visibilityDate:    { type: Date },
  visibilityEndDate: { type: Date },
  hyperlink:         { type: String },
}, { _id: false });

const noticeSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  details:  { type: String },
  category: { type: String },
  type:     { type: String, enum: ['new', 'urgent', 'event'], default: 'new' },
  photos:   [photoSubSchema],
  photoUrl:          { type: String },
  visibilityDate:    { type: Date },
  visibilityEndDate: { type: Date },
  hyperlink:         { type: String },
  section:  { type: String, enum: ['notice', 'event'], required: true },
  years:    { type: [String], default: [] },
  autoEmailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
noticeSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  id:       { type: String },
  year:     { type: String },
  password: { type: String },
  role:     { type: String, enum: ['Admin', 'Student'], default: 'Student' },
  createdAt: { type: Date, default: Date.now },
});

const Notice = mongoose.model('Notice', noticeSchema);
const User   = mongoose.model('User',   userSchema);

// Connect DB then start scheduler
mongoose.connect(mongoURI)
  .then(() => {
    console.log('[DB] MongoDB connected:', mongoURI);
    startNotificationScheduler(Notice, User, PORT);
  })
  .catch(err => { console.error('[DB] Connection error:', err.message); process.exit(1); });

// File uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file,  cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadFields = multer({ storage }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
]);
app.use('/uploads', express.static(uploadDir));

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const d = new Date(combined);
    return isNaN(d) ? new Date(dateStr) : d;
  } catch { return null; }
}

function getActivePhoto(notice, now) {
  const photos = notice.photos;
  if (!photos || photos.length === 0) {
    if (notice.visibilityEndDate && new Date(notice.visibilityEndDate) <= now) return null;
    if (!notice.photoUrl) return null;
    return { photoUrl: notice.photoUrl, hyperlink: notice.hyperlink,
             visibilityDate: notice.visibilityDate, visibilityEndDate: notice.visibilityEndDate };
  }
  const sorted = [...photos].sort((a, b) => new Date(a.visibilityDate || 0) - new Date(b.visibilityDate || 0));
  for (let i = sorted.length - 1; i >= 0; i--) {
    const photo = sorted[i];
    const start = new Date(photo.visibilityDate || 0);
    const end   = photo.visibilityEndDate ? new Date(photo.visibilityEndDate) : null;
    if (start > now) continue;
    if (end && end <= now) continue;
    const next = sorted[i + 1];
    if (next && new Date(next.visibilityDate || 0) <= now) continue;
    return photo;
  }
  return null;
}

function computeColor(photo, now) {
  if (!photo.visibilityDate || !photo.visibilityEndDate) return '#4CAF50';
  const start = new Date(photo.visibilityDate);
  const end   = new Date(photo.visibilityEndDate);
  const total = end - start;
  const remaining = end - now;
  const daysRemaining = Math.ceil(remaining / 86400000);
  if (daysRemaining <= 2) return '#FF5252';
  if (remaining <= total * 0.5) return '#FFA500';
  return '#4CAF50';
}

function buildNoticeResponse(notice, port) {
  const fp = (notice.photos && notice.photos[0]) || {};
  return {
    id: notice._id,
    title: notice.title,
    details: notice.details,
    category: notice.category,
    type: notice.type,
    photo: fp.photoUrl ? `http://localhost:${port}${fp.photoUrl}` : null,
    year: notice.years,
    section: notice.section,
    hyperlink: fp.hyperlink || notice.hyperlink,
    visibilityDate: fp.visibilityDate || notice.visibilityDate,
    visibilityEndDate: fp.visibilityEndDate || notice.visibilityEndDate,
    createdAt: notice.createdAt,
    autoEmailSent: notice.autoEmailSent,
    photos: (notice.photos || []).map(p => ({
      photo: p.photoUrl ? `http://localhost:${port}${p.photoUrl}` : null,
      visibilityDate: p.visibilityDate,
      visibilityEndDate: p.visibilityEndDate,
      hyperlink: p.hyperlink,
    })),
  };
}

// Health
app.get('/api/health', (_req, res) => {
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({ status: states[mongoose.connection.readyState] || 'unknown' });
});

// ── USERS ────────────────────────────────────────────────────────────────────

app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, username, password, id, year } = req.body;
    if (!email || !username || !name) return res.status(400).json({ error: 'Name, email, username required' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'Email or username already registered' });
    const role = assignRoleByEmail(email);
    const saved = await new User({ name, email, username, password: password||'', id: id||'', year: year||'1st Year', role }).save();
    console.log('[signup] User saved:', saved._id, 'role:', role);
    res.status(201).json({ token: generateToken(saved), user: { id: saved._id, name: saved.name, email: saved.email, username: saved.username, year: saved.year, role: saved.role }, message: 'Sign up successful' });
  } catch (err) { console.error('[signup]', err.message); res.status(500).json({ error: 'Failed to sign up', details: err.message }); }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email && !username) return res.status(400).json({ error: 'Email or username required' });
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ token: generateToken(user), user: { id: user._id, name: user.name, email: user.email, username: user.username, year: user.year||'1st Year', role: user.role }, message: 'Login successful' });
  } catch (err) { res.status(500).json({ error: 'Login failed', details: err.message }); }
});

// FIX: Fetch real users from DB by year
app.get('/api/users/by-year', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { years } = req.query;
    console.log('[users/by-year] year query:', years);
    let users;
    if (!years || !years.trim()) {
      users = await User.find({ role: 'Student' }, 'email name year');
    } else {
      const yearList = years.split(',').map(y => y.trim()).filter(Boolean);
      users = await User.find({ year: { $in: yearList }, role: 'Student' }, 'email name year');
    }
    console.log('[users/by-year] Found:', users.length);
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users', details: err.message }); }
});

app.get('/api/users', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find({}, 'name email username year role createdAt');
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users', details: err.message }); }
});

// ── NOTICES ───────────────────────────────────────────────────────────────────

// FIX: Correct field mapping, proper DB save, auto email trigger
app.post('/api/notices', authenticateToken, authorize('Admin'), uploadFields, async (req, res) => {
  try {
    console.log('\n[notices POST] CREATE — user:', req.user?.email);
    console.log('[notices POST] body:', req.body);

    const { section, title, visibilityDate, visibilityTime, visibilityEndDate, visibilityEndTime, hyperlink,
            visibilityDate2, visibilityTime2, visibilityEndDate2, visibilityEndTime2, hyperlink2, years } = req.body;

    if (!section)         return res.status(400).json({ message: 'Missing: section' });
    if (!visibilityDate)  return res.status(400).json({ message: 'Missing: visibilityDate' });
    if (!hyperlink)       return res.status(400).json({ message: 'Missing: hyperlink' });

    const noticeTitle = (title||'').trim() || (section === 'notice' ? 'New Notice' : 'New Event');

    let parsedYears = [];
    if (years) {
      try { parsedYears = typeof years === 'string' ? JSON.parse(years) : years; }
      catch { parsedYears = typeof years === 'string' ? [years] : []; }
      if (!Array.isArray(parsedYears)) parsedYears = [parsedYears];
    }

    const photos = [];
    if (req.files?.photo?.[0]) {
      photos.push({
        photoUrl: `/uploads/${req.files.photo[0].filename}`,
        visibilityDate: parseDateTime(visibilityDate, visibilityTime),
        visibilityEndDate: parseDateTime(visibilityEndDate, visibilityEndTime),
        hyperlink,
      });
    }
    if (req.files?.photo2?.[0]) {
      photos.push({
        photoUrl: `/uploads/${req.files.photo2[0].filename}`,
        visibilityDate: parseDateTime(visibilityDate2, visibilityTime2),
        visibilityEndDate: parseDateTime(visibilityEndDate2, visibilityEndTime2),
        hyperlink: hyperlink2 || hyperlink,
      });
    }

    const fp = photos[0] || {};
    const saved = await new Notice({
      title: noticeTitle,
      details: section === 'event' ? 'date and venue' : undefined,
      category: section === 'notice' ? 'new notices' : undefined,
      type: section === 'notice' ? 'new' : 'event',
      photos,
      photoUrl: fp.photoUrl,
      visibilityDate: fp.visibilityDate,
      visibilityEndDate: fp.visibilityEndDate,
      hyperlink: fp.hyperlink,
      section,
      years: parsedYears,
      autoEmailSent: false,
    }).save();

    console.log('[notices POST] Saved to DB:', saved._id);

    res.status(201).json(buildNoticeResponse(saved, PORT));

    // AUTO EMAIL — background, non-blocking
    setImmediate(async () => {
      try {
        await triggerAutoNotification(saved, User, PORT, 'created');
        await Notice.findByIdAndUpdate(saved._id, { autoEmailSent: true });
      } catch (err) { console.error('[notices POST] Auto email error:', err.message); }
    });

  } catch (err) {
    console.error('[notices POST] ERROR:', err.message, err.stack);
    res.status(500).json({ message: 'Server error creating notice', details: err.message });
  }
});

// FIX: Dashboard fetch — correct year filter, color coding
app.get('/api/notices', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    const now      = new Date();
    const userRole = req.user.role;
    console.log('[notices GET] role:', userRole, 'year:', year);

    const dbQuery = {};
    if (userRole !== 'Admin' && year) {
      dbQuery.years = { $in: [year, 'All'] };
    }

    const all = await Notice.find(dbQuery).sort({ createdAt: -1 });
    console.log('[notices GET] DB count:', all.length);

    const result = all.map(notice => {
      const vp = getActivePhoto(notice, now);
      if (!vp || !vp.photoUrl) return null;
      return {
        id: notice._id,
        title: notice.title,
        details: notice.details,
        category: notice.category,
        type: notice.type,
        photo: `http://localhost:${PORT}${vp.photoUrl}`,
        year: notice.years,
        section: notice.section,
        hyperlink: vp.hyperlink,
        visibilityDate: vp.visibilityDate,
        visibilityEndDate: vp.visibilityEndDate,
        color: computeColor(vp, now),
        createdAt: notice.createdAt,
      };
    }).filter(Boolean);

    console.log('[notices GET] Visible notices:', result.length);
    res.json(result);
  } catch (err) { console.error('[notices GET]', err.message); res.status(500).json({ message: 'Server error', details: err.message }); }
});

// FIX: History/Visibility feed — Upcoming, Active, Past
app.get('/api/notices/history-feed', authenticateToken, async (req, res) => {
  try {
    const now      = new Date();
    const userRole = req.user.role;
    const userYear = req.query.year;
    const dbQuery  = {};
    if (userRole !== 'Admin' && userYear) {
      dbQuery.years = { $in: [userYear, 'All'] };
    }

    const all = await Notice.find(dbQuery).sort({ createdAt: -1 });
    const upcoming = [], active = [], past = [];

    for (const notice of all) {
      const fp = (notice.photos && notice.photos[0]) || {};
      const start = fp.visibilityDate    ? new Date(fp.visibilityDate)    : (notice.visibilityDate ? new Date(notice.visibilityDate) : null);
      const end   = fp.visibilityEndDate ? new Date(fp.visibilityEndDate) : (notice.visibilityEndDate ? new Date(notice.visibilityEndDate) : null);
      const item  = {
        id: notice._id, title: notice.title, details: notice.details, section: notice.section,
        years: notice.years, createdAt: notice.createdAt,
        photo: fp.photoUrl ? `http://localhost:${PORT}${fp.photoUrl}` : null,
        hyperlink: fp.hyperlink || notice.hyperlink,
        visibilityDate: start, visibilityEndDate: end,
      };

      if (end && end <= now) {
        past.push({ ...item, status: 'past', isAttended: false });
      } else if (start && start > now) {
        upcoming.push({ ...item, status: 'upcoming' });
      } else {
        active.push({ ...item, status: 'active' });
      }
    }

    res.json({ upcoming, active, past });
  } catch (err) { res.status(500).json({ message: 'Server error', details: err.message }); }
});

app.get('/api/notices/all', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices.map(n => buildNoticeResponse(n, PORT)));
  } catch (err) { res.status(500).json({ message: 'Server error', details: err.message }); }
});

app.get('/api/notices/:id', authenticateToken, async (req, res) => {
  try {
    const n = await Notice.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'Notice not found' });
    res.json(buildNoticeResponse(n, PORT));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notice', details: err.message }); }
});

app.put('/api/notices/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { title, details, photoUrl, hyperlink, visibilityDate, visibilityEndDate, type, years, section } = req.body;
    const updated = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, details, photoUrl, hyperlink, visibilityDate, visibilityEndDate, type, years, section, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Notice not found' });
    res.json(buildNoticeResponse(updated, PORT));
    setImmediate(async () => {
      try { await triggerAutoNotification(updated, User, PORT, 'updated'); } catch (e) { console.error('[notices PUT] auto email err:', e.message); }
    });
  } catch (err) { res.status(500).json({ error: 'Failed to update notice', details: err.message }); }
});

app.delete('/api/notices/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete notice', details: err.message }); }
});

// ── EMAIL ────────────────────────────────────────────────────────────────────

app.post('/api/notices/send-email', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    console.log('[send-email] Manual send — recipients:', Array.isArray(to) ? to.length : 1);

    if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) return res.status(400).json({ error: 'Recipients required' });
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject required' });
    if (!body?.trim())    return res.status(400).json({ error: 'Body required' });

    const recipients = (Array.isArray(to) ? to : [to]).map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = recipients.filter(e => !emailRegex.test(e));
    if (invalid.length > 0) return res.status(400).json({ error: 'Invalid emails', invalid });

    if (recipients.length === 1) {
      const r = await sendEmail({ to: recipients[0], subject: subject.trim(), body: body.trim() });
      return res.json({ success: true, message: 'Email sent to 1 recipient', messageId: r.messageId, ...(r.previewUrl ? { previewUrl: r.previewUrl } : {}) });
    }

    const r = await sendBulkEmails({ recipients, subject: subject.trim(), body: body.trim() });
    res.json({ success: r.sent > 0, message: `Sent: ${r.sent}, Failed: ${r.failed}`, sent: r.sent, failed: r.failed, errors: r.errors, ...(r.previewUrls.length > 0 ? { previewUrls: r.previewUrls } : {}) });
  } catch (err) { console.error('[send-email]', err.message); res.status(500).json({ error: 'Failed to send email', details: err.message }); }
});

app.post('/api/notices/auto-email/:id', authenticateToken, authorize('Admin'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });
    triggerAutoNotification(notice, User, PORT, 'manual-trigger')
      .then(() => Notice.findByIdAndUpdate(notice._id, { autoEmailSent: true }))
      .catch(e => console.error('[auto-email re-trigger]', e.message));
    res.json({ success: true, message: 'Auto email queued' });
  } catch (err) { res.status(500).json({ error: 'Failed to trigger', details: err.message }); }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────
const historyRouter = require('./routes/history');
app.use('/api/history', historyRouter);

// ── SEARCH ────────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await Notice.find({ $or: [{ title: { $regex: q, $options: 'i' } }, { details: { $regex: q, $options: 'i' } }] });
    res.json(results.map(n => ({ id: n._id, title: n.title, details: n.details, type: n.type, section: n.section })));
  } catch (err) { res.status(500).json({ error: 'Search failed', details: err.message }); }
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[globalError]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE')       return res.status(400).json({ message: 'File too large' });
  if (err.code === 'LIMIT_FILE_COUNT')      return res.status(400).json({ message: 'Too many files' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Unexpected file field' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`   MongoDB : ${mongoURI}`);
  console.log(`   Email   : ${process.env.EMAIL_USER || 'Ethereal (dev)'}\n`);
});

module.exports = app;
