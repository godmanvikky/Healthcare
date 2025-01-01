import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';

// Mock mongoose.connect
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Ensure disconnect is called if available
    if (mongoose.disconnect) {
      await mongoose.disconnect();
    }
  });

  // ✅ Test: Successful MongoDB Connection
  test('Should successfully connect to MongoDB', async () => {
    mongoose.connect.mockResolvedValue({
      connection: {
        host: 'localhost',
      },
    });

    await expect(connectDB()).resolves.not.toThrow();
    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb://127.0.0.1:27017/healthcare'),
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      })
    );
  });

  // ✅ Test: Environment Variable Validation
  test('Should use the correct MongoDB URI from environment variables', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/testdb';

    mongoose.connect.mockResolvedValue({
      connection: {
        host: 'localhost',
      },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://127.0.0.1:27017/testdb',
      expect.any(Object)
    );

    delete process.env.MONGO_URI;
  });
});
