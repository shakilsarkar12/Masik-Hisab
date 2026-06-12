const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Server will keep running. Retrying MongoDB connection in 5s...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
