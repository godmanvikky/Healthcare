import mongoose from 'mongoose';

const VitalDataSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Single Index
    date: { type: Date, required: true, index: true }, // Single Index for Date-based Queries
    bloodPressure: { type: String },
    heartRate: { type: Number },
    temperature: { type: Number },
  },
  { timestamps: true }
);

/**
 * ✅ Compound Indexes for Frequent Queries
 */
// Query by patient and date range
VitalDataSchema.index({ patient: 1, date: -1 });

// Query by patient and specific health metric
VitalDataSchema.index({ patient: 1, bloodPressure: 1 });
VitalDataSchema.index({ patient: 1, heartRate: 1 });
VitalDataSchema.index({ patient: 1, temperature: 1 });

// Query by date range for global health metrics analysis
VitalDataSchema.index({ date: -1 });

const Vital = mongoose.models.VitalData || mongoose.model('VitalData', VitalDataSchema);
export default Vital;
