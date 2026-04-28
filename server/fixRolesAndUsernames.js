const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rtrp_db';

async function run() {
  try {
    await mongoose.connect(mongoURI);
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.model('UserFix', userSchema);

    const users = await User.find().lean();
    console.log('Users before:', users.map(u => ({ id: u._id, email: u.email, username: u.username, role: u.role })));

    let updated = 0;
    for (const u of users) {
      const updates = {};
      if (u.role && typeof u.role === 'string') {
        const rl = u.role.toLowerCase();
        if (rl === 'admin' && u.role !== 'Admin') updates.role = 'Admin';
        if (rl === 'student' && u.role !== 'Student') updates.role = 'Student';
      }

      if ((!u.username || u.username === '') && u.email) {
        // create username from email localpart
        const local = u.email.split('@')[0];
        // ensure uniqueness by appending short id if needed
        let candidate = local.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        if (!candidate) candidate = 'user' + String(u._id).slice(-4);
        updates.username = candidate;
      }

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: u._id }, { $set: updates });
        updated++;
        console.log('Updated', u._id, updates);
      }
    }

    console.log('Total updated records:', updated);
    const after = await User.find().lean();
    console.log('Users after:', after.map(u => ({ id: u._id, email: u.email, username: u.username, role: u.role })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
