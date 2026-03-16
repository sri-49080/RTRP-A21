const express = require('express');
<<<<<<< HEAD
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
=======
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
>>>>>>> daccf17f132f393b07533a1c04b225f2b26b9d6e

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
<<<<<<< HEAD
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const mongoURI = 'mongodb://127.0.0.1:27017/noticeboard';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Models
const Notice = require('./models/Notice');


// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Multer for file uploads
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});
const upload = multer({ storage: storage });

// @route   POST /api/notices
// @desc    Create a new notice or event
app.post('/api/notices', upload.single('photo'), async (req, res) => {
    try {
        console.log('Received Notice Form Data:', req.body);
        console.log('Received File:', req.file);

        const { section, visibilityDate, hyperlink, years } = req.body;
        let title = req.body.title;

        if (!title) {
            title = section === 'notice' ? 'New Notice' : 'New Event';
        }

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        let parsedYears = [];
        if (years) {
            try {
                parsedYears = JSON.parse(years);
            } catch (e) {
                parsedYears = Array.isArray(years) ? years : [years];
            }
        }

        const newNotice = new Notice({
            title,
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
        console.error('Error creating notice:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// @route   GET /api/notices
// @desc    Get all active notices and events (filtered by visibilityDate)
app.get('/api/notices', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find notices where visibilityDate is greater than or equal to today, or where it's not set
        const notices = await Notice.find({
            $or: [
                { visibilityDate: { $gte: today } },
                { visibilityDate: { $exists: false } },
                { visibilityDate: null }
            ]
        }).sort({ createdAt: -1 });

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
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
=======
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rtrp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Database Connection
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'Database connected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ============= USERS ROUTES =============

// Sign Up
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password, year } = req.body;
    const connection = await pool.getConnection();

    // Check if user exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, year) VALUES (?, ?, ?, ?)',
      [name, email, password, year]
    );

    connection.release();
    res.json({ id: result.insertId, name, email, year });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, year FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============= EVENTS ROUTES =============

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [events] = await connection.query('SELECT * FROM events ORDER BY created_at DESC');
    connection.release();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [events] = await connection.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    connection.release();

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const { title, details, photo, hyperlink, visibility_date, year_levels } = req.body;
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO events (title, details, photo, hyperlink, visibility_date, year_levels) VALUES (?, ?, ?, ?, ?, ?)',
      [title, details, photo, hyperlink, visibility_date, JSON.stringify(year_levels)]
    );

    connection.release();
    res.json({ id: result.insertId, title, details, photo, hyperlink, visibility_date, year_levels });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { title, details, photo, hyperlink, visibility_date, year_levels } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE events SET title = ?, details = ?, photo = ?, hyperlink = ?, visibility_date = ?, year_levels = ? WHERE id = ?',
      [title, details, photo, hyperlink, visibility_date, JSON.stringify(year_levels), req.params.id]
    );

    connection.release();
    res.json({ id: req.params.id, title, details, photo, hyperlink, visibility_date, year_levels });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// ============= NOTICES ROUTES =============

// Get all notices
app.get('/api/notices', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [notices] = await connection.query('SELECT * FROM notices ORDER BY created_at DESC');
    connection.release();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices', details: error.message });
  }
});

// Get notice by ID
app.get('/api/notices/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [notices] = await connection.query('SELECT * FROM notices WHERE id = ?', [req.params.id]);
    connection.release();

    if (notices.length === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notices[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notice', details: error.message });
  }
});

// Create notice
app.post('/api/notices', async (req, res) => {
  try {
    const { title, details, photo, hyperlink, visibility_date, type, year_levels } = req.body;
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO notices (title, details, photo, hyperlink, visibility_date, type, year_levels) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, details, photo, hyperlink, visibility_date, type, JSON.stringify(year_levels)]
    );

    connection.release();
    res.json({ id: result.insertId, title, details, photo, hyperlink, visibility_date, type, year_levels });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notice', details: error.message });
  }
});

// Update notice
app.put('/api/notices/:id', async (req, res) => {
  try {
    const { title, details, photo, hyperlink, visibility_date, type, year_levels } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE notices SET title = ?, details = ?, photo = ?, hyperlink = ?, visibility_date = ?, type = ?, year_levels = ? WHERE id = ?',
      [title, details, photo, hyperlink, visibility_date, type, JSON.stringify(year_levels), req.params.id]
    );

    connection.release();
    res.json({ id: req.params.id, title, details, photo, hyperlink, visibility_date, type, year_levels });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notice', details: error.message });
  }
});

// Delete notice
app.delete('/api/notices/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notice', details: error.message });
  }
});

// ============= HISTORY ROUTES =============

// Get user history
app.get('/api/history/:userId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [history] = await connection.query(
      'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    connection.release();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Add to history
app.post('/api/history', async (req, res) => {
  try {
    const { user_id, item_id, item_type, title } = req.body;
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO search_history (user_id, item_id, item_type, title) VALUES (?, ?, ?, ?)',
      [user_id, item_id, item_type, title]
    );

    connection.release();
    res.json({ id: result.insertId, user_id, item_id, item_type, title });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to history', details: error.message });
  }
});

// Delete history entry
app.delete('/api/history/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM search_history WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history', details: error.message });
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

    const connection = await pool.getConnection();
    
    const searchTerm = `%${q}%`;
    
    const [events] = await connection.query(
      'SELECT id, title, details as details, "event" as type FROM events WHERE title LIKE ? OR details LIKE ?',
      [searchTerm, searchTerm]
    );

    const [notices] = await connection.query(
      'SELECT id, title, details as details, "notice" as type FROM notices WHERE title LIKE ? OR details LIKE ?',
      [searchTerm, searchTerm]
    );

    connection.release();

    const results = [...events, ...notices];
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
>>>>>>> daccf17f132f393b07533a1c04b225f2b26b9d6e
