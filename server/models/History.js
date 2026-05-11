const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      id: String,
      title: String,
      description: String,
      link: String,
      startDate: Date,
      endDate: Date,
      isAttended: Boolean,
      clickedDate: Date,
      section: String,
      photo: String
    }
  ]
});

module.exports = mongoose.model('History', historySchema);
