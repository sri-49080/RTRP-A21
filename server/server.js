const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rtrp_db';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Define Notice Schema
const noticeSchema = new mongoose.Schema({
    title: String,
    details: String,
    category: String,
    type: String,
    photoUrl: String,
    visibilityDate: Date,
    hyperlink: String,
    section: String,
    years: [String],  // Changed from [Number] to [String] to match frontend
    createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Test Database Connection
app.get('/api/health', async (req, res) => {
  try {
    res.json({ status: 'MongoDB connected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ============= USERS ROUTES =============

// Sign Up
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password, year } = req.body;
    // Note: In production, implement proper authentication
    res.json({ id: new mongoose.Types.ObjectId(), name, email, year });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Note: In production, implement proper authentication
    res.json({ id: new mongoose.Types.ObjectId(), email });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============= NOTICES ROUTES =============

// @route   POST /api/notices
// @desc    Create a new notice or event
app.post('/api/notices', upload.single('photo'), async (req, res) => {
    try {
        console.log('========== NEW REQUEST ==========');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { section, visibilityDate, hyperlink, years, title } = req.body;
        
        if (!section || !visibilityDate || !hyperlink) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                received: { section, visibilityDate, hyperlink, years, title }
            });
        }

        let noticeTitle = title || (section === 'notice' ? 'New Notice' : 'New Event');

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        let parsedYears = [];
        if (years) {
            try {
                console.log('Years raw value:', years, 'Type:', typeof years);
                parsedYears = typeof years === 'string' ? JSON.parse(years) : years;
                if (!Array.isArray(parsedYears)) {
                    parsedYears = [parsedYears];
                }
            } catch (e) {
                console.error('Error parsing years:', e);
                parsedYears = [];
            }
        }

        console.log('Creating notice with:', { 
            title: noticeTitle, 
            section, 
            photoUrl,
            years: parsedYears
        });

        const newNotice = new Notice({
            title: noticeTitle,
            details: section === 'event' ? 'date and venue' : undefined,
            category: section === 'notice' ? 'new notices' : undefined,
            type: section === 'notice' ? 'new' : 'event',
            photoUrl,
            visibilityDate: visibilityDate ? new Date(visibilityDate) : undefined,
            hyperlink,
            section,
            years: parsedYears
        });

        const savedNotice = await newNotice.save();
        console.log('Saved notice to MongoDB:', savedNotice._id);

        const responseItem = {
            id: savedNotice._id,
            title: savedNotice.title,
            details: savedNotice.details,
            category: savedNotice.category,
            type: savedNotice.type,
            photo: savedNotice.photoUrl ? `http://localhost:${PORT}${savedNotice.photoUrl}` : null,
            year: savedNotice.years,
            section: savedNotice.section,
            hyperlink: savedNotice.hyperlink
        };

        res.status(201).json(responseItem);
    } catch (error) {
        console.error('========== ERROR CREATING NOTICE ==========');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// @route   GET /api/notices
// @desc    Get all active notices and events (filtered by visibilityDate and user year)
app.get('/api/notices', async (req, res) => {
    try {
        const { year } = req.query; // Optional: filter by user's year
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('=== GET /api/notices ===');
        console.log('Query year parameter:', year);

        // First, delete expired notices (visibility date has passed)
        const deletedCount = await Notice.deleteMany({
            visibilityDate: { $lt: today }
        });
        console.log('Deleted expired notices:', deletedCount.deletedCount);

        // Build filter query
        let query = {
            $or: [
                { visibilityDate: { $gte: today } },
                { visibilityDate: { $exists: false } },
                { visibilityDate: null }
            ]
        };

        // If user year is provided, filter by year match
        if (year) {
            query.years = year; // Only show notices that include this year
            console.log('Filtering by year:', year);
        }

        console.log('Query object:', JSON.stringify(query, null, 2));

        const notices = await Notice.find(query).sort({ createdAt: -1 });
        
        console.log('Found notices count:', notices.length);
        console.log('Notices:', notices.map(n => ({ title: n.title, years: n.years })));

        const formattedNotices = notices.map(notice => ({
            id: notice._id,
            title: notice.title,
            details: notice.details,
            category: notice.category,
            type: notice.type,
            photo: notice.photoUrl ? `http://localhost:${PORT}${notice.photoUrl}` : null,
            year: notice.years,
            section: notice.section,
            hyperlink: notice.hyperlink,
            color: notice.section === 'notice' ? ['#90EE90', '#F0D872', '#FF9999', '#87CEEB', '#DDA0DD'][Math.floor(Math.random() * 5)] : undefined
        }));

        res.json(formattedNotices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Get notice by ID
app.get('/api/notices/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json(notice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notice', details: error.message });
  }
});

// Update notice
app.put('/api/notices/:id', async (req, res) => {
  try {
    const { title, details, photoUrl, hyperlink, visibilityDate, type, years } = req.body;
    const updatedNotice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, details, photoUrl, hyperlink, visibilityDate, type, years },
      { new: true }
    );
    res.json(updatedNotice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notice', details: error.message });
  }
});

// Delete notice
app.delete('/api/notices/:id', async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notice', details: error.message });
  }
});

// ============= SEARCH ROUTES =============

// Search
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchResults = await Notice.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { details: { $regex: q, $options: 'i' } }
      ]
    });

    const results = searchResults.map(notice => ({
      id: notice._id,
      title: notice.title,
      details: notice.details,
      type: notice.type,
      section: notice.section
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
