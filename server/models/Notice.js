const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  type: {
    type: String,
    enum: ['new', 'urgent', 'event'],
    default: 'new',
  },
  category: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  visibilityDate: {
    type: Date,
  },
  hyperlink: {
    type: String,
  },
  section: {
    type: String,
    enum: ['notice', 'event'],
    required: true,
  },
  years: {
    type: [String], // Array of strings like '1st', '2nd'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Notice', noticeSchema);
