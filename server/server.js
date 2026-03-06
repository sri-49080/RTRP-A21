const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
