import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  // ✅ Test: Create a User Successfully
  test('Should create a user successfully', async () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'Patient',
    });

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe('john@example.com');
    expect(savedUser.name).toBe('John Doe');
    expect(savedUser.role).toBe('Patient');
  });

  // ✅ Test: Hash Password Before Saving
  test('Should hash the password before saving', async () => {
    bcrypt.hash.mockResolvedValue('hashedPassword');

    const user = new User({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'plainPassword',
      role: 'Patient',
    });

    const savedUser = await user.save();

    expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
    expect(savedUser.password).toBe('hashedPassword');
  });

  // ✅ Test: Password Comparison
  test('Should compare passwords correctly', async () => {
    bcrypt.compare.mockResolvedValue(true);

    const user = new User({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashedPassword',
      role: 'Patient',
    });

    const isMatch = await user.matchPassword('plainPassword');
    expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
    expect(isMatch).toBe(true);
  });

  // ✅ Test: Validation - Missing Required Fields
  test('Should throw validation error if required fields are missing', async () => {
    const user = new User({});

    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // ✅ Test: Validation - Specialization Required for Doctors
  test('Should throw error if Doctor role is missing specialization', async () => {
    const user = new User({
      name: 'Dr. Smith',
      email: 'drsmith@example.com',
      password: 'password123',
      role: 'Doctor',
    });

    await expect(user.save()).rejects.toThrow('Specialization is required for Doctor role');
  });


  // ✅ Test: Compound Index Validation (Role and Specialization)
  test('Should allow unique combinations of role and specialization', async () => {
    await User.create({
      name: 'Dr. Adams',
      email: 'adams@example.com',
      password: 'password123',
      role: 'Doctor',
      specialization: 'Cardiology',
    });

    const anotherDoctor = new User({
      name: 'Dr. Adams 2',
      email: 'adams2@example.com',
      password: 'password123',
      role: 'Doctor',
      specialization: 'Neurology',
    });

    await expect(anotherDoctor.save()).resolves.toBeDefined();
  });
});
