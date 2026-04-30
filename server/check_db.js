const mongoose = require('mongoose');

async function checkNotices() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rtrp_db');
    console.log('Connected to MongoDB');

    const notices = await mongoose.connection.db.collection('notices').find({}).toArray();
    console.log(`Found ${notices.length} notices:`);

    notices.forEach((notice, i) => {
      console.log(`Notice ${i+1}:`, {
        id: notice._id,
        title: notice.title,
        section: notice.section,
        years: notice.years,
        photosCount: notice.photos?.length || 0,
        createdAt: notice.createdAt
      });

      if (notice.photos && notice.photos.length > 0) {
        notice.photos.forEach((photo, j) => {
          console.log(`  Photo ${j+1}:`, {
            photoUrl: photo.photoUrl,
            visibilityDate: photo.visibilityDate,
            visibilityEndDate: photo.visibilityEndDate,
            hyperlink: photo.hyperlink
          });
        });
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNotices();