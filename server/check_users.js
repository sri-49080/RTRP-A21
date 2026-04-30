const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rtrp_db');
    console.log('Connected to MongoDB');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users:`);

    users.forEach((user, i) => {
      console.log(`User ${i+1}:`, {
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        year: user.year
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();