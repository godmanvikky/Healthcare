import { useQuery, useMutation, gql } from '@apollo/client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';

// ✅ GraphQL Queries and Mutations
const GET_DOCTOR_APPOINTMENTS = gql`
  query GetAppointmentsByDate($date: String!) {
    getAppointmentsByDate(date: $date) {
      id
      patient {
        id
        name
      }
      doctor {
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
      patient {
        name
      }
      doctor {
        name
      }
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

const PRESCRIBE_MEDICINE = gql`
  mutation PrescribeMedicine($patientId: ID!, $doctorId: ID!, $medicines: [String!]!, $diagnosis: String!) {
    prescribeMedicine(patientId: $patientId, doctorId: $doctorId, medicines: $medicines, diagnosis: $diagnosis) {
      id
      patient {
        name
      }
      doctor {
        name
      }
      medicines
      diagnosis
      date
    }
  }
`;

// ✅ Shimmer Placeholder Component
const Shimmer = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
  </div>
);

export default function DoctorDashboard() {
  const [token, setToken] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [patientName, setPatientName] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [isEditingPrescription, setEditingPrescription] = useState(false); 
  const [isViewingPrescription, setIsViewingPrescription] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('token');
      setToken(userToken || '');
      setIsClient(true);

      // Decode token to get doctor ID
      const decoded = JSON.parse(atob(userToken.split('.')[1]));
      setDoctorId(decoded.id);
      setPatientName(decoded.name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setDoctorId('');
    setIsClient(false);
    window.location.href = '/auth/login';
  };

  // ✅ Fetch Doctor's Appointments
  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery(GET_DOCTOR_APPOINTMENTS, {
    variables: { date: selectedDate },
    skip: !isClient || !token,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  // ✅ Mutation for Updating Appointment Status
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
      console.error('❌ Update Status Error:', error.message);
      setErrorMessage(error.message);
    },
  });

  const { data: prescriptionData, loading: prescriptionLoading, refetch: refetchPrescription } = useQuery(GET_PRESCRIPTION, {
    skip: true,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });
  
  const handleViewPrescription = async (appointment) => {
    setSelectedAppointment(appointment);
    setIsViewingPrescription(true);
  
    try {
      const { data } = await refetchPrescription({
        patientId: appointment.patient.id,
        doctorId,
      });
  
      if (data?.getPrescription) {
        setPrescription(data.getPrescription);
      } else {
        setPrescription(null);
      }
    } catch (error) {
      console.error('❌ Error fetching prescription:', error.message);
    }
  };
  

  // ✅ Mutation for Prescribing Medicine
  const [prescribeMedicine, { loading: prescribingMedicine }] = useMutation(PRESCRIBE_MEDICINE, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    onCompleted: () => {
      alert('✅ Prescription added successfully!');
      setMedicines([]);
      setDiagnosis('');
      setSelectedAppointment(null);
    },
    onError: (error) => {
      console.error('❌ Prescription Error:', error.message);
      setErrorMessage(error.message);
    },
  });

  // ✅ Handle Appointment Status Update
  const handleUpdateStatus = () => {
    if (!selectedAppointment || !selectedStatus) {
      alert('❌ Please select a status to update.');
      return;
    }

    updateAppointmentStatus({
      variables: {
        appointmentId: selectedAppointment.id,
        status: selectedStatus,
      },
    });
  };

  // ✅ Handle Prescription Submission
  const handlePrescribeMedicine = () => {
    if (!selectedAppointment || medicines.length === 0 || !diagnosis) {
      alert('❌ Please add medicines and diagnosis.');
      return;
    }

    prescribeMedicine({
      variables: {
        patientId: selectedAppointment.patient.id,
        doctorId,
        medicines,
        diagnosis,
      },
    });
    setEditingPrescription(false)
  };

  // ✅ Render Appointments List
  const appointments = appointmentsData?.getAppointmentsByDate || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Patient Name and Logout */}
      <Header patientName={patientName} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">👨‍⚕️ Doctor Dashboard</h2>

        {/* 📆 Date Filter */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">📆 Filter Appointments by Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        {/* 🗓️ Appointments List */}
        {appointmentsLoading ? (
          <Shimmer />
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4 mb-2 shadow-sm">
              <p><strong>👤 Patient:</strong> {appointment.patient?.name}</p>
              <p><strong>⏰ Time:</strong> {appointment.time}</p>
              <p><strong>📋 Status:</strong> {appointment.status}</p>
              <div className="flex space-x-4">
  <button
    onClick={() => {
      setSelectedAppointment(appointment);
      setEditingPrescription(true);
    }}
    className="bg-blue-500 text-white px-4 py-1 rounded-md"
  >
    Edit / Prescribe
  </button>
  <button
    onClick={() => handleViewPrescription(appointment)}
    className="bg-green-500 text-white px-4 py-1 rounded-md hover:bg-green-600"
  >
    View Prescription
  </button>
</div>
            </div>
          ))
        )}

        {/* Modal for Status & Prescription */}
        {selectedAppointment && isEditingPrescription && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => {setSelectedAppointment(null);setEditingPrescription(false)}}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
      >
        ✖️
      </button>
      
      <h3 className="text-xl font-bold mb-4 text-blue-600 text-center">📝 Prescription & Status Update</h3>
      
      {/* Status Update Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">📋 Update Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">-- Select Status --</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Diagnosis Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">🩺 Diagnosis</label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter diagnosis details"
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
          rows="3"
        ></textarea>
      </div>

      {/* Medicines Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">💊 Medicines</label>
        <input
          type="text"
          value={medicines.join(', ')}
          onChange={(e) => setMedicines(e.target.value.split(',').map(item => item.trim()))}
          placeholder="Enter medicines (comma-separated)"
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={handleUpdateStatus}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition"
        >
          {updatingStatus ? '🔄 Updating Status...' : '✅ Update Status'}
        </button>
        <button
          onClick={handlePrescribeMedicine}
          className="w-full bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition"
        >
          {prescribingMedicine ? '🔄 Prescribing...' : '💊 Prescribe Medicine'}
        </button>
        <button
          onClick={() => {
            setSelectedAppointment(null)
          }}
          className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
        >
          ❌ Close
        </button>
      </div>
    </div>
  </div>
)}
{(selectedAppointment && isViewingPrescription) && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => {
          setSelectedAppointment(null);
          setIsViewingPrescription(false);
          setPrescription(null);
        }}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
      >
        ✖️
      </button>
      
      <h3 className="text-xl font-bold mb-4 text-blue-600 text-center">📜 Prescription Details</h3>
      
      {prescriptionLoading ? (
        <p>Loading prescription...</p>
      ) : prescription ? (
        <>
          <p><strong>👤 Patient:</strong> {prescription.patient.name}</p>
          <p><strong>👨‍⚕️ Doctor:</strong> {prescription.doctor.name}</p>
          <p><strong>📅 Date: </strong> 
  {prescription.date
    ? new Date(Number(prescription.date)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'}
</p>

          <p><strong>🩺 Diagnosis:</strong> {prescription.diagnosis}</p>
          <p><strong>💊 Medicines:</strong> {prescription.medicines.join(', ')}</p>
        </>
      ) : (
        <p>No prescription found for this appointment.</p>
      )}

      {/* Close Button */}
      <button
        onClick={() => {
          setSelectedAppointment(null);
          setIsViewingPrescription(false);
          setPrescription(null);
        }}
        className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Close
      </button>
    </div>
  </div>
)}

      </div>
    </div>
  );
}
