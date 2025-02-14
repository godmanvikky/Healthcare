import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, index: true }, // Index for frequent name-based searches
    email: { type: String, required: true, unique: true, index: true }, // Unique Index for email
    password: { type: String, required: true },
    role: { type: String, enum: ['Patient', 'Doctor'], required: true, index: true }, // Index for role
    specialization: { type: String, default: null }, // Only applicable for Doctors
    vitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vital' }],
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
    prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
  },
  { timestamps: true }
);

/**
 * ✅ Indexes for Optimized Queries
 */
// Compound Index for Doctor Searches
userSchema.index({ role: 1, specialization: 1 });

// Index for Patients by Email and Role
userSchema.index({ email: 1, role: 1 });

// Index for Frequent Searches by Name and Role
userSchema.index({ name: 1, role: 1 });

// ✅ Middleware: Hash Password Before Saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if password is modified

  try {
    console.log('✅ Hashing password:', this.password);
    this.password = await bcrypt.hash(this.password, 10);
    console.log('✅ Password hashed:', this.password);
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

/**
 * ✅ Middleware: Validate Specialization for Doctor Role
 */
userSchema.pre('save', function (next) {
  if (this.role === 'Doctor' && !this.specialization) {
    return next(new Error('Specialization is required for Doctor role'));
  }
  next();
});

/**
 * ✅ Method: Compare Passwords
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    console.log('🔑 Comparing passwords:', enteredPassword, this.password);
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('❌ Error comparing passwords:', error);
    throw error;
  }
};

// ✅ Ensure the model isn't recompiled during hot reload
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
