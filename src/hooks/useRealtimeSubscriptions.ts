import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeStore } from '../stores';

export const useRealtimeSubscriptions = () => {
  const { user } = useAuth();
  const { 
    subscribeToTournaments, 
    subscribeToNotifications, 
    unsubscribeAll 
  } = useRealtimeStore();

  useEffect(() => {
    if (user) {
      // Subscribe to tournaments updates
      subscribeToTournaments();
      
      // Subscribe to user notifications
      subscribeToNotifications(user.id);
    }

    // Cleanup on unmount
    return () => {
      unsubscribeAll();
    };
  }, [user, subscribeToTournaments, subscribeToNotifications, unsubscribeAll]);
};
