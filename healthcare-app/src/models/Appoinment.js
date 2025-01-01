import mongoose from 'mongoose';

const appointmentSchema = mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Single Index
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Single Index
    date: { type: String, required: true, index: true }, // Single Index
    time: { type: String, required: true }, // No index (not frequently queried alone)
    status: { 
      type: String, 
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], 
      default: 'Pending' 
    }
  },
  { timestamps: true }
);

// ✅ Compound Index for Frequent Queries
appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

// ✅ Compound Index for Searching Appointments by Patient and Date
appointmentSchema.index({ patient: 1, date: 1 });

// ✅ Compound Index for Filtering by Status and Date
appointmentSchema.index({ status: 1, date: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export default Appointment;
