import mongoose from 'mongoose';
import Prescription from '../src/models/Prescription.js';

describe('Prescription Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Force index creation
    await mongoose.connection.db.dropDatabase();
    await Prescription.ensureIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Prescription.deleteMany({});
  });

  // ✅ Test: Create a Prescription Successfully
  test('Should create a prescription successfully', async () => {
    const prescription = new Prescription({
      patient: new mongoose.Types.ObjectId(),
      doctor: new mongoose.Types.ObjectId(),
      date: new Date('2024-06-15'),
      medicines: ['Paracetamol', 'Amoxicillin'],
      diagnosis: 'Flu',
    });

    const savedPrescription = await prescription.save();

    expect(savedPrescription._id).toBeDefined();
    expect(savedPrescription.patient).toBeDefined();
    expect(savedPrescription.doctor).toBeDefined();
    expect(savedPrescription.date).toBeInstanceOf(Date);
    expect(savedPrescription.medicines).toContain('Paracetamol');
    expect(savedPrescription.diagnosis).toBe('Flu');
  });

  // ✅ Test: Validation for Required Fields
  test('Should throw a validation error if required fields are missing', async () => {
    const prescription = new Prescription({});

    await expect(prescription.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // ✅ Test: Duplicate Prescription for Same Patient, Doctor, and Date
  test('Should allow duplicate prescriptions for the same patient and doctor on different dates', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();

    const prescription1 = new Prescription({
      patient: patientId,
      doctor: doctorId,
      date: new Date('2024-06-15'),
      medicines: ['Paracetamol'],
      diagnosis: 'Flu',
    });

    const prescription2 = new Prescription({
      patient: patientId,
      doctor: doctorId,
      date: new Date('2024-06-16'),
      medicines: ['Ibuprofen'],
      diagnosis: 'Headache',
    });

    await expect(prescription1.save()).resolves.toBeDefined();
    await expect(prescription2.save()).resolves.toBeDefined();
  });

  // ✅ Test: Query by Patient, Doctor, and Date
  test('Should query prescriptions by patient, doctor, and date', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();

    await Prescription.create({
      patient: patientId,
      doctor: doctorId,
      date: new Date('2024-06-15'),
      medicines: ['Paracetamol'],
      diagnosis: 'Flu',
    });

    const prescriptions = await Prescription.find({
      patient: patientId,
      doctor: doctorId,
      date: new Date('2024-06-15'),
    });

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].diagnosis).toBe('Flu');
  });

  // ✅ Test: Query by Date and Diagnosis
  test('Should query prescriptions by date and diagnosis', async () => {
    await Prescription.create({
      patient: new mongoose.Types.ObjectId(),
      doctor: new mongoose.Types.ObjectId(),
      date: new Date('2024-06-15'),
      medicines: ['Paracetamol'],
      diagnosis: 'Flu',
    });

    const prescriptions = await Prescription.find({
      date: new Date('2024-06-15'),
      diagnosis: 'Flu',
    });

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].diagnosis).toBe('Flu');
  });
});
