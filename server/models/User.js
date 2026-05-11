const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  id: { type: String },
  year: { type: String },
  department: { type: String },
  password: { type: String }, // For future use if needed
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
