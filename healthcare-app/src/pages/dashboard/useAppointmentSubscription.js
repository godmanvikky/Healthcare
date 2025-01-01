import { useSubscription, gql } from '@apollo/client';
import { useEffect, useState } from 'react';

/**
 * GraphQL Subscription for Appointment Status Changes
 */
const APPOINTMENT_STATUS_CHANGED = gql`
  subscription OnAppointmentStatusChanged($appointmentId: ID!) {
    appointmentStatusChanged(appointmentId: $appointmentId) {
      id
      status
      doctor {
        id
        name
      }
      patient {
        id
        name
      }
    }
  }
`;

/**
 * Custom Hook: useAppointmentSubscription
 * 
 * @param {string | null} appointmentId - The ID of the appointment to subscribe to.
 * @returns {object} - Returns subscription data, loading, and error states.
 */
export function useAppointmentSubscription(appointmentId) {
  const [liveUpdate, setLiveUpdate] = useState(null);

  const { data, loading, error } = useSubscription(APPOINTMENT_STATUS_CHANGED, {
    variables: { appointmentId },
    skip: !appointmentId, // Skip subscription if no valid appointmentId
    onSubscriptionData: ({ subscriptionData }) => {
      console.log('🔄 Subscription Data:', subscriptionData);
      if (subscriptionData?.data?.appointmentStatusChanged) {
        setLiveUpdate(subscriptionData.data.appointmentStatusChanged);
      }
    },
    onError: (error) => {
      console.error('❌ Subscription Error:', error.message);
    },
  });

  useEffect(() => {
    if (data?.appointmentStatusChanged) {
      console.log('✅ Live Update Received:', data.appointmentStatusChanged);
      setLiveUpdate(data.appointmentStatusChanged);
    }
  }, [data]);

  return {
    liveUpdate,  // Contains the latest live update data
    loading,     // Indicates if the subscription is active
    error,       // Contains error details if subscription fails
  };
}
