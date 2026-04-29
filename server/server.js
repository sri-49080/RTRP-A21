const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { assignRoleByEmail, getAdminDomains } = require('./roleAssigner');
const { generateToken, authenticateToken, authorize } = require('./authMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Handle preflight requests
app.options('*', cors());

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
    photos: [{
        photoUrl: String,
        visibilityDate: Date,         // Start date when photo becomes visible
        visibilityEndDate: Date,      // End date when photo expires
        hyperlink: String
    }],
    // Legacy fields for backward compatibility
    photoUrl: String,
    visibilityDate: Date,
    visibilityEndDate: Date,         // Legacy end date field
    hyperlink: String,
    section: String,
    years: [String],  // Changed from [Number] to [String] to match frontend
    createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    id: String,
    year: String,
    password: String,
    role: {
        type: String,
        enum: ['Admin', 'Student'],
        default: 'Student'
    },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

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
const uploadFields = multer({ storage: storage }).fields([{ name: 'photo', maxCount: 1 }, { name: 'photo2', maxCount: 1 }]);

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
    const { name, email, username, password, id, year } = req.body;

    // Validate required fields
    if (!email || !username || !name) {
      return res.status(400).json({ error: 'Name, email, and username are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    // Assign role based on email domain
    const role = assignRoleByEmail(email);

    // Create new user
    const newUser = new User({
      name,
      email,
      username,
      password: password || '', // Optional password (no hashing for demo)
      id: id || '',
      year: year || '1st Year',
      role: role
    });

    const savedUser = await newUser.save();
    console.log('User saved to database:', savedUser._id, 'with role:', role);

    // Generate JWT token
    const token = generateToken(savedUser);

    res.status(201).json({
      token: token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        username: savedUser.username,
        year: savedUser.year,
        role: savedUser.role
      },
      message: 'Sign up successful'
    });
  } catch (error) {
    console.error('Error during sign up:', error);
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data with token
    res.json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        year: user.year || '1st Year',
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============= NOTICES ROUTES =============

// @route   POST /api/notices
// @desc    Create a new notice or event (Admin only)
app.post('/api/notices', authenticateToken, authorize('Admin'), uploadFields, async (req, res) => {
    try {
        console.log('========== NEW POST /api/notices REQUEST ==========');
        console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
        console.log('User from token:', req.user ? { email: req.user.email, role: req.user.role } : 'No user');
        console.log('Body keys:', Object.keys(req.body));
        console.log('Body:', req.body);
        console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

        const { section, visibilityDate, visibilityTime, hyperlink, visibilityDate2, visibilityTime2, hyperlink2, years, title, visibilityEndDate, visibilityEndTime, visibilityEndDate2, visibilityEndTime2 } = req.body;
        
        if (!section || !visibilityDate || !hyperlink) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                received: { section, visibilityDate, hyperlink, years, title }
            });
        }

        let noticeTitle = title || (section === 'notice' ? 'New Notice' : 'New Event');

        // Process photos array
        const photos = [];

        // Photo 1 (primary - mandatory)
        if (req.files && req.files.photo && req.files.photo[0]) {
            const photoUrl = `/uploads/${req.files.photo[0].filename}`;
            let visibilityDateTime;
            if (visibilityDate) {
                if (visibilityTime) {
                    const combined = `${visibilityDate}T${visibilityTime}`;
                    visibilityDateTime = new Date(combined);
                    if (isNaN(visibilityDateTime)) {
                        visibilityDateTime = new Date(visibilityDate);
                    }
                } else {
                    visibilityDateTime = new Date(visibilityDate);
                }
            }
            
            let visibilityEndDateTime;
            if (visibilityEndDate) {
                if (visibilityEndTime) {
                    const combined = `${visibilityEndDate}T${visibilityEndTime}`;
                    visibilityEndDateTime = new Date(combined);
                    if (isNaN(visibilityEndDateTime)) {
                        visibilityEndDateTime = new Date(visibilityEndDate);
                    }
                } else {
                    visibilityEndDateTime = new Date(visibilityEndDate);
                }
            }
            
            photos.push({
                photoUrl,
                visibilityDate: visibilityDateTime,
                visibilityEndDate: visibilityEndDateTime,
                hyperlink
            });
            console.log('Added photo 1:', { photoUrl, visibilityDate: visibilityDateTime, visibilityEndDate: visibilityEndDateTime, hyperlink });
        }

        // Photo 2 (optional secondary)
        if (req.files && req.files.photo2 && req.files.photo2[0]) {
            const photoUrl2 = `/uploads/${req.files.photo2[0].filename}`;
            let visibilityDateTime2;
            if (visibilityDate2) {
                if (visibilityTime2) {
                    const combined = `${visibilityDate2}T${visibilityTime2}`;
                    visibilityDateTime2 = new Date(combined);
                    if (isNaN(visibilityDateTime2)) {
                        visibilityDateTime2 = new Date(visibilityDate2);
                    }
                } else {
                    visibilityDateTime2 = new Date(visibilityDate2);
                }
            }
            
            let visibilityEndDateTime2;
            if (visibilityEndDate2) {
                if (visibilityEndTime2) {
                    const combined = `${visibilityEndDate2}T${visibilityEndTime2}`;
                    visibilityEndDateTime2 = new Date(combined);
                    if (isNaN(visibilityEndDateTime2)) {
                        visibilityEndDateTime2 = new Date(visibilityEndDate2);
                    }
                } else {
                    visibilityEndDateTime2 = new Date(visibilityEndDate2);
                }
            }
            
            photos.push({
                photoUrl: photoUrl2,
                visibilityDate: visibilityDateTime2,
                visibilityEndDate: visibilityEndDateTime2,
                hyperlink: hyperlink2
            });
            console.log('Added photo 2:', { photoUrl: photoUrl2, visibilityDate: visibilityDateTime2, visibilityEndDate: visibilityEndDateTime2, hyperlink: hyperlink2 });
        }

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
            photos,
            years: parsedYears
        });

        // Also set legacy fields for backward compatibility
        const firstPhoto = photos[0];

        const newNotice = new Notice({
          title: noticeTitle,
          details: section === 'event' ? 'date and venue' : undefined,
          category: section === 'notice' ? 'new notices' : undefined,
          type: section === 'notice' ? 'new' : 'event',
          photos: photos,
          photoUrl: firstPhoto?.photoUrl,
          visibilityDate: firstPhoto?.visibilityDate,
          hyperlink: firstPhoto?.hyperlink,
          section,
          years: parsedYears
        });

        const savedNotice = await newNotice.save();
        console.log('Saved notice to MongoDB:', savedNotice._id);
        console.log('Saved notice data:', savedNotice);

        const responseItem = {
            id: savedNotice._id,
            title: savedNotice.title,
            details: savedNotice.details,
            category: savedNotice.category,
            type: savedNotice.type,
            photo: savedNotice.photoUrl ? `http://localhost:${PORT}${savedNotice.photoUrl}` : null,
            year: savedNotice.years,
            section: savedNotice.section,
            hyperlink: savedNotice.hyperlink,
            visibilityDate: savedNotice.visibilityDate,
            photos: savedNotice.photos.map(p => ({
                photo: p.photoUrl ? `http://localhost:${PORT}${p.photoUrl}` : null,
                visibilityDate: p.visibilityDate,
                hyperlink: p.hyperlink
            }))
        };

        console.log('Sending response:', responseItem);
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
        const now = new Date();

        console.log('=== GET /api/notices ===');
        console.log('Query year parameter:', year);
        console.log('Current time:', now);

        // Build filter query - find notices that have at least one photo with valid visibility
        let query = {};

        // If user year is provided, filter by year match
        if (year) {
            query.years = year; // Only show notices that include this year
            console.log('Filtering by year:', year);
        }

        // Get all notices matching the year filter
        const allNotices = await Notice.find(query).sort({ createdAt: -1 });
        
        console.log('Found total notices count:', allNotices.length);

        // Filter notices based on whether they have any currently visible photos
        const formattedNotices = allNotices
            .map(notice => {
                // Helper function to find the currently visible photo
                const getVisiblePhoto = (photos) => {
                    if (!photos || photos.length === 0) {
                        // Fallback to legacy photoUrl if no photos array
                        console.log(`Notice "${notice.title}": No photos array, using legacy photoUrl`);
                        
                        // Check if legacy photo has expired
                        if (notice.visibilityEndDate) {
                            const endDate = new Date(notice.visibilityEndDate);
                            if (endDate <= now) {
                                console.log(`Legacy photo has expired on ${notice.visibilityEndDate}`);
                                return null;
                            }
                        }
                        
                        return {
                            photoUrl: notice.photoUrl,
                            hyperlink: notice.hyperlink,
                            visibilityDate: notice.visibilityDate,
                            visibilityEndDate: notice.visibilityEndDate
                        };
                    }

                    console.log(`\n--- Processing notice "${notice.title}" with ${photos.length} photos ---`);

                    // Sort photos by visibilityDate
                    const sortedPhotos = [...photos].sort((a, b) => {
                        const dateA = new Date(a.visibilityDate || 0);
                        const dateB = new Date(b.visibilityDate || 0);
                        return dateA - dateB;
                    });

                    console.log('Sorted photos:', sortedPhotos.map((p, i) => ({
                        index: i,
                        visDate: p.visibilityDate,
                        endDate: p.visibilityEndDate,
                        hasPhotoUrl: !!p.photoUrl
                    })));

                    // Find the currently visible photo (considering both start and end dates)
                    for (let i = sortedPhotos.length - 1; i >= 0; i--) {
                        const photo = sortedPhotos[i];
                        const visDate = new Date(photo.visibilityDate || 0);
                        const endDate = photo.visibilityEndDate ? new Date(photo.visibilityEndDate) : null;
                        
                        console.log(`Checking photo ${i}: visDate=${photo.visibilityDate}, endDate=${photo.visibilityEndDate}, now=${now}`);
                        
                        // Check if this photo's visibility date has passed
                        if (visDate <= now) {
                            // Check if the photo has expired
                            if (endDate && endDate <= now) {
                                console.log(`Photo ${i} has expired on ${photo.visibilityEndDate}`);
                                continue; // Skip this photo, it's expired
                            }
                            
                            // Check if there's a next photo
                            if (i === sortedPhotos.length - 1) {
                                // This is the last photo, so it's visible (if not expired)
                                console.log(`Photo ${i} is last and not expired - showing it`);
                                return photo;
                            } else {
                                // Check if the next photo's visibility date is in the future
                                const nextPhoto = sortedPhotos[i + 1];
                                const nextVisDate = new Date(nextPhoto.visibilityDate || 0);
                                console.log(`Photo ${i} has next photo with visDate=${nextPhoto.visibilityDate}, nextVisDate > now? ${nextVisDate > now}`);
                                if (nextVisDate > now) {
                                    // Next photo is not visible yet, so this one is visible (if not expired)
                                    console.log(`Next photo not visible yet - showing photo ${i}`);
                                    return photo;
                                }
                            }
                        }
                    }

                    // If no photo is visible based on dates, return the first one (if it exists and not expired)
                    console.log('No photo found by date logic, checking first photo');
                    if (sortedPhotos.length > 0) {
                        const firstPhoto = sortedPhotos[0];
                        const endDate = firstPhoto.visibilityEndDate ? new Date(firstPhoto.visibilityEndDate) : null;
                        if (!endDate || endDate > now) {
                            return firstPhoto;
                        }
                    }
                    return null;
                };

                const visiblePhoto = getVisiblePhoto(notice.photos);

                // Only include notices that have a visible photo
                if (!visiblePhoto || !visiblePhoto.photoUrl) {
                    return null;
                }

                // Calculate color based on remaining visibility duration
                let color = '#4CAF50'; // Default green
                if (visiblePhoto.visibilityDate && visiblePhoto.visibilityEndDate) {
                    const startDate = new Date(visiblePhoto.visibilityDate);
                    const endDate = new Date(visiblePhoto.visibilityEndDate);
                    
                    const totalDuration = endDate - startDate;
                    const timeRemaining = endDate - now;
                    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
                    
                    console.log(`Notice "${notice.title}": ${daysRemaining} days remaining (end: ${visiblePhoto.visibilityEndDate})`);
                    
                    // Red: 2 days or fewer remaining
                    if (daysRemaining <= 2) {
                        color = '#FF5252'; // Red
                        console.log(`  -> RED (${daysRemaining} days remaining)`);
                    }
                    // Orange: 50% or less remaining
                    else if (timeRemaining <= totalDuration * 0.5) {
                        color = '#FFA500'; // Orange
                        console.log(`  -> ORANGE (${(timeRemaining / totalDuration * 100).toFixed(1)}% remaining)`);
                    }
                    // Green: More than 50% remaining
                    else {
                        color = '#4CAF50'; // Green
                        console.log(`  -> GREEN (${(timeRemaining / totalDuration * 100).toFixed(1)}% remaining)`);
                    }
                }

                return {
                    id: notice._id,
                    title: notice.title,
                    details: notice.details,
                    category: notice.category,
                    type: notice.type,
                    photo: visiblePhoto.photoUrl ? `http://localhost:${PORT}${visiblePhoto.photoUrl}` : null,
                    year: notice.years,
                    section: notice.section,
                    hyperlink: visiblePhoto.hyperlink,
                    visibilityDate: visiblePhoto.visibilityDate,
                    visibilityEndDate: visiblePhoto.visibilityEndDate,
                    color: color
                };
            })
            .filter(notice => notice !== null); // Remove notices without visible photos

        console.log('Formatted and filtered notices count:', formattedNotices.length);
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

// Global error handler for multer and other errors
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size too large', details: err.message });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Too many files', details: err.message });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field', details: err.message });
  }
  
  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
    details: err.details || err.stack
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
