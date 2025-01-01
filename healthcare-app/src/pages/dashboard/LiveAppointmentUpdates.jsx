import React, { useEffect, useState } from 'react';
import { useAppointmentSubscription } from './useAppointmentSubscription';

const LiveAppointmentUpdates = ({ appointmentId }) => {
  const [liveUpdate, setLiveUpdate] = useState(null);
  const { data, error, loading } = useAppointmentSubscription(appointmentId);

  useEffect(() => {
    if (data?.appointmentStatusChanged) {
      setLiveUpdate(data.appointmentStatusChanged);
      alert(`🔄 Appointment ${data.appointmentStatusChanged.id} status updated to ${data.appointmentStatusChanged.status}`);
    }
  }, [data]);

  if (!appointmentId) return null;
  return (
    <div>
      {loading && <p>🔄 Waiting for live updates...</p>}
      {error && <p>❌ Error: {error.message}</p>}
      {liveUpdate && (
        <div className="p-4 bg-green-100 rounded-md">
          <p><strong>🟢 Live Update:</strong> Appointment {liveUpdate.id} status changed to {liveUpdate.status}</p>
        </div>
      )}
    </div>
  );
};

export default LiveAppointmentUpdates;
