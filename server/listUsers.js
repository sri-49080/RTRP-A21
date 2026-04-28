const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rtrp_db';

async function listUsers() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.model('UserList', userSchema);

    const users = await User.find().lean();
    console.log('Total users found:', users.length);
    users.forEach(u => {
      console.log('---');
      console.log('id:', u._id);
      console.log('name:', u.name);
      console.log('email:', u.email);
      console.log('username:', u.username);
      console.log('role:', u.role);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listing users:', err);
    process.exit(1);
  }
}

listUsers();
