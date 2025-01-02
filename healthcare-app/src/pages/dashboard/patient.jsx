import { useQuery, useMutation, gql } from '@apollo/client';
import React,{ useEffect, useState, Suspense, lazy  } from 'react';
import LiveAppointmentUpdates from './LiveAppointmentUpdates';
const Header = lazy(() => import('../components/Header'));
const Shimmer = lazy(() => import('../components/Shimmer'));

// ✅ GraphQL Queries and Mutations
const GET_APPOINTMENTS = gql`
  query GetAppointmentsByDate($date: String!) {
  getAppointmentsByDate(date: $date) {
    id
    patient {
      id
      name
    }
    doctor {
      id
      name
      specialization
    }
    date
    time
    status
  }
}

`;
const GET_PRESCRIPTION = gql`
  query GetPrescription($patientId: ID!, $doctorId: ID!) {
    getPrescription(patientId: $patientId, doctorId: $doctorId) {
      id
      medicines
      diagnosis
      date
      doctor {
        name
      }
    }
  }
`;


const GET_DOCTORS = gql`
  query GetAvailableDoctors {
    getDoctors {
      id
      name
      specialization
    }
  }
`;
const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus($appointmentId: ID!, $status: String!) {
    updateAppointmentStatus(appointmentId: $appointmentId, status: $status) {
      id
      status
    }
  }
`;




const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($patientId: ID!, $doctorId: ID!, $date: String!, $time: String!) {
    bookAppointment(patientId: $patientId, doctorId: $doctorId, date: $date, time: $time) {
      id
      date
      time
      status
      doctor {
        id
        name
        specialization
      }
      patient {
        id
        name
      }
    }
  }
`;
const UPDATE_APPOINTMENT_DETAILS = gql`
  mutation UpdateAppointmentDetails(
    $appointmentId: ID!
    $newDoctorId: ID
    $newDate: String
    $newTime: String
  ) {
    updateAppointmentDetails(
      appointmentId: $appointmentId
      newDoctorId: $newDoctorId
      newDate: $newDate
      newTime: $newTime
    ) {
      id
      doctor {
        id
        name
        specialization
      }
      date
      time
      status
    }
  }
`;


export default function PatientDashboard() {
  const [token, setToken] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatienName] = useState('')
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null); // For editing modal
  const [prescriptionAppointment, setPrescriptionAppointment] = useState(null); // For prescription modal
  const [viewingPrescription, setViewingPrescription] = useState(false); // Control prescription modal visibility
  const [prescriptionDetails, setPrescriptionDetails] = useState(null); // Store prescription details
  const [liveUpdate, setLiveUpdate] = useState(false)
 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('token');
      setToken(userToken || '');
      setIsClient(true);

      // Decode token to get patient ID
      const decoded = JSON.parse(atob(userToken.split('.')[1]));
      setPatientId(decoded.id);
      setPatienName(decoded.name)
    }
  }, []);

  // ✅ Fetch Appointments for Selected Date
  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery(GET_APPOINTMENTS, {
    variables: { date: selectedDate },
    skip: !isClient || !token,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  // ✅ Fetch Doctors
  const { data: doctorsData, loading: doctorsLoading } = useQuery(GET_DOCTORS, {
    skip: !isClient || !token,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  // ✅ Mutation for Booking Appointment
  const [bookAppointment, { loading: bookingLoading }] = useMutation(BOOK_APPOINTMENT, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    onCompleted: () => {
      alert('✅ Appointment booked successfully!');
      refetchAppointments(); // Automatically refetch appointments after booking
    },
    onError: (error) => {
      console.error('❌ Booking Error:', error.message);
      setErrorMessage(error.message);
    },
  });


   // ✅ Update Appointment Mutation
   const [updateAppointmentDetails] = useMutation(UPDATE_APPOINTMENT_DETAILS, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    onCompleted: () => {
      alert('✅ Appointment updated successfully!');
      setSelectedAppointment(null);
      refetchAppointments();
    },
    onError: (error) => {
      console.error('❌ Update Error:', error.message);
      setErrorMessage(error.message);
    },
  });

    const [updateAppointmentStatus, { loading: updatingStatus }] = useMutation(UPDATE_APPOINTMENT_STATUS, {
      context: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
      onCompleted: () => {
        alert('✅ Appointment status updated successfully!');
        refetchAppointments();
        setSelectedAppointment(null);
      },
      onError: (error) => {
        console.error('❌ Update Error:', error.message);
        setErrorMessage(error.message);
      },
    });

    const { data: prescriptionData, loading: prescriptionLoading, refetch: refetchPrescription } = useQuery(
      GET_PRESCRIPTION,
      {
        skip: !prescriptionAppointment, // Skip unless prescriptionAppointment exists
        variables: {
          patientId: prescriptionAppointment?.patient?.id || '',
          doctorId: prescriptionAppointment?.doctor?.id || '',
        },
        context: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
        onCompleted: (data) => {
          setPrescriptionDetails(data?.getPrescription || null);
          setViewingPrescription(true); // Show the Prescription Modal
        },
        onError: (error) => {
          console.error('❌ Prescription Fetch Error:', error.message);
        },
      }
    );
    
    

    // ✅ Handle Appointment Status Update
  // ✅ Handle Appointment Status Update with Subscription Support
const handleUpdateStatus = async () => {
  if (!selectedAppointment || !selectedStatus) {
    alert('❌ Please select a status to update.');
    return;
  }

  try {
    console.log('🔄 Updating appointment status...');

    await updateAppointmentStatus({
      variables: {
        appointmentId: selectedAppointment.id,
        status: selectedStatus,
      },
    });

    console.log('✅ Appointment status updated successfully.');


    setLiveUpdate(true)
    alert('✅ Appointment status updated successfully!');
  } catch (error) {
    console.error('❌ Error updating appointment status:', error.message);
    alert(`❌ Failed to update status: ${error.message}`);
  }
};

  // ✅ Handle Appointment Selection for Editing
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDoctor(appointment.doctor?.id || '');
    setSelectedTime(appointment.time || '');
    setSelectedAppointmentId(appointment.id);
    setSelectedStatus(appointment.status)
    setViewingPrescription(false); // Ensure Prescription Modal is closed
    setPrescriptionDetails(null); // Clear Prescription Details
  setPrescriptionAppointment(null); // Ensure Prescription Modal is closed
  };
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    
    // Clear state variables
    setToken('');
    setPatientId('');
    setIsClient(false);
  
    // Optionally, redirect to login page
    window.location.href = '/auth/login';
  };
  
  const handleViewPrescription = (appointment) => {
    console.log(appointment)
    if (!appointment || !appointment.doctor?.id) {
      alert('❌ Invalid appointment selected for prescription view.');
      return;
    }
    setPrescriptionAppointment(appointment); // Open Prescription Modal
    setSelectedAppointment(null);
    setViewingPrescription(true);
    console.log(appointment)
    refetchPrescription({
      variables: {
        patientId: appointment.patient.id,
        doctorId: appointment.doctor.id,
      },
    });
  };
  
  
   // ✅ Handle Update Appointment
   const handleUpdateAppointment = () => {
    if (!selectedAppointmentId) {
      alert('❌ No appointment selected for updating.');
      return;
    }
    
    updateAppointmentDetails({
      variables: {
        appointmentId: selectedAppointmentId,
        newDoctorId: selectedDoctor || null,
        newDate: selectedDate || null,
        newTime: selectedTime || null,
      },
    });
  };
  // ✅ Handle Appointment Booking
  const handleBookAppointment = () => {
    setErrorMessage(''); // Reset error message
    if (!selectedDate || !selectedTime || !selectedDoctor) {
      alert('❌ Please select a date, time, and doctor.');
      return;
    }

    bookAppointment({
      variables: {
        patientId,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
      },
    });
  };
  

  // ✅ Render Appointments List
  const appointments = appointmentsData?.getAppointmentsByDate || [];
  const doctors = doctorsData?.getDoctors || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Patient Name and Logout */}
      <Suspense fallback={<Shimmer />}>
          <Header patientName={patientName} onLogout={handleLogout}/>
        </Suspense>
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">📅 Patient Dashboard</h2>
         {/* Error Message */}
         {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
        {/* 🩺 Appointment Booking Section */}
        <div className="mb-8 bg-green-50 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">🩺 Book an Appointment</h3>
          {/* Date Picker */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">📅 Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Time Picker */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">⏰ Select Time:</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Doctor Selection */}
          <Suspense fallback={<Shimmer />}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">👨‍⚕️ Select Doctor:</label>
            {doctorsLoading ? (
              <Shimmer />
            ) : (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="">-- Select a Doctor --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.specialization})
                  </option>
                ))}
              </select>
            )}
          </div>
           </Suspense>
          {/* Book Appointment Button */}
          <button
            onClick={handleBookAppointment}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition"
            disabled={bookingLoading}
          >
            {bookingLoading ? '🔄 Booking...' : '✅ Book Appointment'}
          </button>
        </div>

        {/* 📅 Date Filter */}
        <div className="mb-8 p-4 bg-yellow-50 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">📆 Filter Appointments by Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        {/* 🗓️ Appointment List Section */}
        <Suspense fallback={<Shimmer />}>
        <div>
          <h3 className="text-xl font-semibold mb-4">🗓️ Appointments for {selectedDate}</h3>
          {appointmentsLoading ? (
            <Shimmer />
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
              key={appointment.id}
              className="border rounded-lg p-4 mb-2 shadow-sm flex justify-between items-center"
            >
              <div>
                <p><strong>👨‍⚕️ Doctor:</strong> {appointment.doctor?.name} ({appointment.doctor?.specialization})</p>
                <p><strong>⏰ Time:</strong> {appointment.time}</p>
                <p><strong>📋 Status:</strong> {appointment.status}</p>
              </div>
              <button
  onClick={() => handleEditAppointment(appointment)}
  className="bg-yellow-500 text-white px-4 py-1 rounded-md"
>
  Edit
</button>
<button
  onClick={() => handleViewPrescription(appointment)}
  className="bg-green-500 text-white px-4 py-1 rounded-md hover:bg-green-600 ml-2"
>
  View Prescription
</button>

            </div>
            
            ))
            
          ) : (
            <p className="text-center text-gray-500">No appointments found for the selected date.</p>
          )}
             {/* ✏️ Edit Appointment Modal */}
             {selectedAppointment && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg relative w-96">
      {/* ❌ Close Button */}
      <button
        onClick={() => setSelectedAppointment(null)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
      >
        ✖
      </button>

      <h3 className="text-lg font-semibold mb-4">✏️ Update Appointment</h3>
      
      {/* Doctor Selection */}
      <select
        value={selectedDoctor}
        onChange={(e) => setSelectedDoctor(e.target.value)}
        className="w-full mb-4 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
      >
        <option value="">-- Select a Doctor --</option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name} ({doctor.specialization})
          </option>
        ))}
      </select>
      
      {/* Time Picker */}
      <input
        type="time"
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
        className="w-full mb-4 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
      />
      
      {/* Date Picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full mb-4 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
      />
      
      {/* Status Selection */}
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="w-full mb-4 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
      >
        <option value="">-- Select Status --</option>
        <option value="Pending">Pending</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      
      {/* Update Button */}
      <button
        onClick={() => {
          handleUpdateAppointment();
          handleUpdateStatus();
        }}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Update
      </button>
    </div>
  </div>
)}


{viewingPrescription && prescriptionAppointment && prescriptionDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => {
          setViewingPrescription(false);
          setPrescriptionAppointment(null);
          setPrescriptionDetails(null);
        }}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
      >
        ✖️
      </button>
      
      <h3 className="text-xl font-bold mb-4 text-blue-600 text-center">💊 Prescription Details</h3>
      <p><strong>👨‍⚕️ Doctor:</strong> {prescriptionDetails.doctor.name}</p>
      <p><strong>🩺 Diagnosis:</strong> {prescriptionDetails.diagnosis}</p>
      <p><strong>💊 Medicines:</strong> {prescriptionDetails.medicines.join(', ')}</p>
      <p><strong>📅 Date:</strong> {new Date(Number(prescriptionDetails.date)).toLocaleDateString()}</p>
      
      {/* Close Button */}
      <button
        onClick={() => {
          setViewingPrescription(false);
          setPrescriptionAppointment(null);
          setPrescriptionDetails(null);
        }}
        className="w-full bg-red-500 text-white px-4 py-2 mt-4 rounded-lg hover:bg-red-600"
      >
        Close
      </button>
    </div>
  </div>
)}




        </div>
        </Suspense>
         {/* 📡 Live Updates Section */}
         {liveUpdate && selectedAppointmentId && (
          <div className="mt-6">
            <LiveAppointmentUpdates appointmentId={selectedAppointmentId} />
          </div>
        )}
      </div>
    </div>
  );
}
