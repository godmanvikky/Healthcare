import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI||"mongodb://127.0.0.1:27017/healthcare", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Reduce timeout to 5s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000 // Timeout after 10s
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
