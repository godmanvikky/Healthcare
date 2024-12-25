import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  medicines: { type: [String], required: true }, // Changed from 'medication' to 'medicines'
  diagnosis: { type: String, required: true },
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
export default Prescription;
