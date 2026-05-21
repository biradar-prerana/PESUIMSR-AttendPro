require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await User.findOne({ email: 'admin@cosec.com' });
  if (!exists) {
    await User.create({ name: 'System Admin', email: 'admin@cosec.com', password: 'admin123', role: 'admin' });
    console.log('✅ Admin user created: admin@cosec.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
  await mongoose.disconnect();
};

seed().catch(console.error);
