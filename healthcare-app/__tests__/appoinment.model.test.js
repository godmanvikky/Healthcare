import mongoose from 'mongoose';
import Appointment from '../src/models/Appoinment.js';

describe('Appointment Model', () => {
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
    await Appointment.deleteMany({});
  });

  // ✅ Test: Create an Appointment
  test('Should create an appointment successfully', async () => {
    const appointment = new Appointment({
      patient: new mongoose.Types.ObjectId(),
      doctor: new mongoose.Types.ObjectId(),
      date: '2024-06-15',
      time: '10:00 AM',
      status: 'Pending',
    });

    const savedAppointment = await appointment.save();

    expect(savedAppointment._id).toBeDefined();
    expect(savedAppointment.patient).toBeDefined();
    expect(savedAppointment.doctor).toBeDefined();
    expect(savedAppointment.date).toBe('2024-06-15');
    expect(savedAppointment.time).toBe('10:00 AM');
    expect(savedAppointment.status).toBe('Pending');
  });

  // ✅ Test: Appointment with Missing Required Fields
  test('Should throw an error if required fields are missing', async () => {
    const appointment = new Appointment({});

    await expect(appointment.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // ✅ Test: Duplicate Appointment for Same Doctor, Date, and Time

  // ✅ Test: Query Appointments by Patient and Date
  test('Should query appointments by patient and date', async () => {
    const patientId = new mongoose.Types.ObjectId();

    await Appointment.create({
      patient: patientId,
      doctor: new mongoose.Types.ObjectId(),
      date: '2024-06-15',
      time: '10:00 AM',
      status: 'Pending',
    });

    const appointments = await Appointment.find({ patient: patientId, date: '2024-06-15' });

    expect(appointments).toHaveLength(1);
    expect(appointments[0].patient.toString()).toBe(patientId.toString());
  });

  // ✅ Test: Query Appointments by Status and Date
  test('Should query appointments by status and date', async () => {
    await Appointment.create({
      patient: new mongoose.Types.ObjectId(),
      doctor: new mongoose.Types.ObjectId(),
      date: '2024-06-15',
      time: '10:00 AM',
      status: 'Confirmed',
    });

    const appointments = await Appointment.find({ status: 'Confirmed', date: '2024-06-15' });

    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toBe('Confirmed');
  });
});
