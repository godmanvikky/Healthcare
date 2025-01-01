import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Single Index
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Single Index
    date: { type: Date, default: Date.now, index: true }, // Single Index
    medicines: { type: [String], required: true }, // Array of medicines
    diagnosis: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Compound Index for Frequent Queries
PrescriptionSchema.index({ patient: 1, doctor: 1, date: -1 });

// ✅ Compound Index for Filtering by Date and Diagnosis
PrescriptionSchema.index({ date: -1, diagnosis: 1 });

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

export default Prescription;
