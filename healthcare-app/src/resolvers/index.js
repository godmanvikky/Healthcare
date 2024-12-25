import User from '../models/User.js';
import Appointment from '../models/Appoinment.js';
import Prescription from '../models/Prescription.js';
import Vital from '../models/VitalData.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { SPECIALIZATIONS } from './specialization.js';

export const resolvers = {
  Query: {
    getUser: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authorized');
      return await User.findById(id);
    },
    getAppointmentsByDate: async (_, { date }, { user }) => {
      try {
        console.log('🔍 Checking user authorization:', user);
    
        if (!user) {
          throw new Error('Not authorized');
        }
    
        console.log('🔍 Fetching appointments for date:', date, 'and user role:', user.role);
    
        let query = { date };
    
        if (user.role === 'Patient') {
          query.patient = user.id;
        } else if (user.role === 'Doctor') {
          query.doctor = user.id;
        } else {
          throw new Error('Invalid user role');
        }
    
        const appointments = await Appointment.find(query)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name email specialization');
    
        console.log('✅ Appointments fetched:', appointments);
    
        return appointments.map(appointment => ({
          id: appointment._id.toString(),
          patient: {
            id: appointment.patient._id.toString(),
            name: appointment.patient.name,
            email: appointment.patient.email,
          },
          doctor: {
            id: appointment.doctor._id.toString(),
            name: appointment.doctor.name,
            email: appointment.doctor.email,
            specialization: appointment.doctor.specialization,
          },
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
        }));
      } catch (error) {
        console.error('❌ Fetching Appointments Error:', error.message);
        throw new Error('Failed to fetch appointments');
      }
    },
        
    getVitals: async (_, { patientId }, { user }) => {
      if (!user) throw new Error('Not authorized');
      return await Vital.find({ patient: patientId });
    },
    getDoctors: async (_, __, { user }) => {
      try {
        console.log('🔍 Checking user authorization:', user);
    
        // 🛡️ Ensure the user is authenticated
        if (!user) {
          throw new Error('Not authorized');
        }
    
        console.log('🔍 Fetching doctors from the database');
    
        // 🩺 Fetch all doctors, including specialization
        const doctors = await User.find({ role: 'Doctor' }).select('id name email specialization');
    
        console.log('✅ Doctors fetched successfully:', doctors);
    
        return doctors.map((doctor) => ({
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization || 'Not Specified',
        }));
      } catch (error) {
        console.error('❌ Fetching Doctors Error:', error.message);
        throw new Error('Failed to fetch doctors');
      }
    },
    getSpecializations: async (_, __, {  }) => {
          try {
            console.log('✅ Fetching specializations...');
            return SPECIALIZATIONS;
          } catch (error) {
            console.error('❌ Fetching Specializations Error:', error.message);
            throw new Error('Failed to fetch specializations');
          }
        },
        // ✅ Fetch Prescription for a Specific Patient and Doctor
        getPrescription: async (_, { patientId, doctorId }, { user }) => {
          try {
            if (!user) {
              throw new Error('Not authorized');
            }
        
            // Fetch the prescription matching patient and doctor
            const prescription = await Prescription.findOne({
              patient: patientId,
              doctor: doctorId,
            })
              .select('medicines diagnosis date')
              .populate('patient', 'id name email')
              .populate('doctor', 'id name specialization');
        
            if (!prescription) {
              return null; // No prescription found
            }
        
            console.log('✅ Prescription fetched:', prescription);
        
            return prescription;
          } catch (error) {
            console.error('❌ Error fetching prescription:', error.message);
            throw new Error(error.message || 'Failed to fetch prescription');
          }
        }
        
  },

  Mutation: {
    // ✅ Register User with Password Hashing
    register: async (_, { name, email, password, role, specialization }) => {
      try {
        console.log('🔍 Checking if user exists with email:', email);
    
        // Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
          throw new Error('User already exists');
        }
    
        console.log('🔑 Plain Password:', password);
    
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('🔑 Hashed Password:', hashedPassword);
    
        // Prepare user object
        const userData = {
          name,
          email,
          password: hashedPassword,
          role,
        };
        console.log("Specialization", specialization)
        // Add specialization only if the role is 'Doctor'
        if (role === 'Doctor') {
          if (!specialization) {
            throw new Error('Specialization is required for doctors');
          }
          userData.specialization = specialization;
        }
    
        // Create a new user
        const user = new User(userData);
        console.log(user)
        await user.save();
    
        console.log('✅ User Registered Successfully:', user);
    
        return {
          message: 'User Registered Successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            specialization: user.specialization || null,
          },
        };
      } catch (error) {
        console.error('❌ Registration Error:', error.message);
        throw new Error(error.message || 'Failed to register user');
      }
    },
    login: async (_, { email, password }) => {
      try {
        console.log('🔍 Searching for user with email:', email);
    
        const user = await User.findOne({ email });
        console.log('✅ User found:', user);
    
        if (!user) {
          console.log('❌ User not found');
          throw new Error('Invalid Email or Password');
        }
    
        console.log('🔑 Plain Password:', password);
        console.log('🔑 Hashed Password:', user.password);
    
        try {
          console.log('🔑 Comparing:', password, user.password);
          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log('✅ Password Comparison Result:', isPasswordValid);
        
          if (!isPasswordValid) {
            console.error('❌ Password mismatch');
            throw new Error('Invalid Email or Password');
          }
        
          console.log('✅ Password matched successfully');
        } catch (error) {
          console.error('❌ bcrypt.compare Error:', error);
        }
        
    
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
    
        console.log('✅ Login successful');
    
        return {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error) {
        console.error('❌ Login Error:', error.message);
        throw new Error(error.message || 'Login failed');
      }
    },
    updateAppointmentDetails: async (_, { appointmentId, newDoctorId, newDate, newTime }, { user }) => {
      try {
        // 🛡️ Authorization Check
        if (!user) {
          throw new Error('Not authorized');
        }
    
        console.log('🔍 Fetching appointment for update...');
        // Fetch the appointment
        const appointment = await Appointment.findById(appointmentId)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name email specialization');
    
        if (!appointment) {
          throw new Error('Appointment not found');
        }
    
        // 🛡️ Authorization Logic
        const isPatient = appointment.patient._id.toString() === user.id;
        const isAdmin = user.role === 'Admin';
    
        if (!isPatient && !isAdmin) {
          throw new Error('You are not authorized to update this appointment');
        }
    
        // 🕒 Check for conflicting appointments for new doctor, date, and time
        const query = {
          _id: { $ne: appointmentId }, // Exclude current appointment
        };
    
        if (newDoctorId) query.doctor = newDoctorId;
        if (newDate) query.date = newDate;
        if (newTime) query.time = newTime;
    
        if (newDoctorId || newDate || newTime) {
          const conflict = await Appointment.findOne(query);
    
          if (conflict) {
            throw new Error('The selected doctor is not available at the specified date and time.');
          }
        }
    
        // ✅ Update fields if provided
        if (newDoctorId) appointment.doctor = newDoctorId;
        if (newDate) appointment.date = newDate;
        if (newTime) appointment.time = newTime;
    
        appointment.status = 'Pending'; // Reset status after update
        await appointment.save();
    
        console.log('✅ Appointment successfully updated:', appointment);
    
        // Return the updated appointment with populated fields
        const updatedAppointment = await Appointment.findById(appointmentId)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name email specialization');
    
        return updatedAppointment;
      } catch (error) {
        console.error('❌ Update Appointment Error:', error.message);
        throw new Error(error.message || 'Failed to update appointment details');
      }
    },    
    cancelAppointment: async (_, { appointmentId }, { user }) => {
      try {
        if (!user) {
          throw new Error('Not authorized');
        }

        // Fetch the appointment
        const appointment = await Appointment.findById(appointmentId)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name email');

        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Ensure only the patient or doctor can cancel the appointment
        if (
          appointment.patient._id.toString() !== user.id &&
          appointment.doctor._id.toString() !== user.id
        ) {
          throw new Error('You are not authorized to cancel this appointment');
        }

        // Update the appointment status to 'Cancelled'
        appointment.status = 'Cancelled';
        await appointment.save();

        console.log('✅ Appointment Cancelled:', appointment);

        return appointment;
      } catch (error) {
        console.error('❌ Cancel Appointment Error:', error.message);
        throw new Error(error.message || 'Failed to cancel appointment');
      }
    },

    // ✅ Book Appointment with Time
    bookAppointment: async (_, { patientId, doctorId, date, time }, { user }) => {
      try {
        // 🛡️ Authorization Check
        if (!user) {
          throw new Error('Not authorized');
        }
    
        // 🛡️ Ensure the user is the same as the patient
        if (user.id !== patientId) {
          throw new Error('You are not authorized to book an appointment for this patient');
        }
    
        // 🕒 Check for duplicate time slot with the same doctor and patient
        const timeConflict = await Appointment.findOne({
          patient: patientId,
          doctor: doctorId,
          date,
          time,
        });
    
        if (timeConflict) {
          throw new Error('You already have an appointment with this doctor at the selected time.');
        }
    
        // 📅 Check if the patient has more than 3 bookings on the same day
        const dailyAppointments = await Appointment.countDocuments({
          patient: patientId,
          date,
        });
    
        if (dailyAppointments >= 3) {
          throw new Error('You cannot book more than 3 appointments on the same day.');
        }
    
        // ✅ Create a new appointment
        const appointment = new Appointment({
          patient: patientId,
          doctor: doctorId,
          date,
          time,
          status: 'Pending',
        });
    
        await appointment.save();
    
        // ✅ Populate patient and doctor details
        const populatedAppointment = await Appointment.findById(appointment._id)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name email specialization');
    
        console.log('✅ Appointment successfully booked:', populatedAppointment);
    
        return populatedAppointment;
      } catch (error) {
        console.error('❌ Booking Appointment Error:', error.message);
        throw new Error(error.message || 'Failed to book appointment');
      }
    },
    
    
    

    // Update Appointment Status
    updateAppointmentStatus: async (_, { appointmentId, status }) => {
      try {
        if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
          throw new Error('Invalid status value');
        }

        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { status },
          { new: true }
        ).select('id patient doctor date time status') // Explicitly select `time`
        .populate('patient', 'id name email')
         .populate('doctor', 'id name email');

        if (!appointment) {
          throw new Error('Appointment not found');
        }
        return appointment;
      } catch (error) {
        console.error('❌ Update Status Error:', error.message);
        throw new Error('Failed to update appointment status');
      }
    }, 

    // ✅ Prescribe Medicine
    // ✅ Prescribe Medicine Resolver
    prescribeMedicine: async (_, { patientId, doctorId, medicines, diagnosis }, { user }) => {
      try {
        console.log('🔍 Checking user authorization:', user);
    
        // 🛡️ Authorization Check
        if (!user || user.role !== 'Doctor') {
          throw new Error('Not authorized to prescribe medicine');
        }
    
        // 🛡️ Ensure the requesting doctor matches the provided doctorId
        if (user.id !== doctorId) {
          throw new Error('You can only prescribe medicine for your patients');
        }
    
        // 📋 Validate Required Fields
        if (!patientId || !doctorId || !medicines || medicines.length === 0 || !diagnosis) {
          throw new Error('All fields (patientId, doctorId, medicines, and diagnosis) are required');
        }
    
        // ✅ Create and Save Prescription
        const prescription = new Prescription({
          patient: patientId,
          doctor: doctorId,
          medicines,
          diagnosis,
          date: new Date(),
        });
    
        await prescription.save();
    
        // ✅ Update Appointment Status (if applicable)
        const appointment = await Appointment.findOne({
          patient: patientId,
          doctor: doctorId,
          date: new Date().toISOString().split('T')[0], // Match today's date
        });
    
        if (appointment) {
          appointment.status = 'Completed'; // Automatically set status to 'Completed' after prescribing
          await appointment.save();
        }
    
        // ✅ Populate Prescription Details
        const populatedPrescription = await Prescription.findById(prescription._id)
          .populate('patient', 'id name email')
          .populate('doctor', 'id name specialization');
    
        if (!populatedPrescription) {
          throw new Error('Prescription not found after saving');
        }
    
        console.log('✅ Prescription successfully saved:', populatedPrescription);
    
        return populatedPrescription;
      } catch (error) {
        console.error('❌ Prescription Error:', error.message);
        throw new Error(error.message || 'Failed to prescribe medicine');
      }
    },
    

  },
};
