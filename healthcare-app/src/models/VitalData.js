import mongoose from 'mongoose';

const VitalDataSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  bloodPressure: String,
  heartRate: Number,
  temperature: Number,
});
const Vital = mongoose.models.VitalData || mongoose.model('VitalData', VitalDataSchema);;
export default Vital;
