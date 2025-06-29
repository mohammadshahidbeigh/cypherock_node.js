import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://shahid:shahid%4097.in@cypherock.eqhdurz.mongodb.net/cypherock?retryWrites=true&w=majority'
    );
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;


