import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useTournamentStore } from './tournamentStore';
import { useNotificationStore } from './notificationStore';

interface RealtimeState {
  // Connection state
  isConnected: boolean;
  subscriptions: Map<string, any>;
  
  // Actions
  subscribeToTournaments: () => void;
  subscribeToNotifications: (userId: string) => void;
  subscribeToTournament: (tournamentId: string) => void;
  unsubscribe: (channelName: string) => void;
  unsubscribeAll: () => void;
  setConnectionStatus: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      subscriptions: new Map(),

      // Actions
      subscribeToTournaments: () => {
        const { subscriptions } = get();
        const channelName = 'tournaments';
        
        if (subscriptions.has(channelName)) {
          return; // Already subscribed
        }

        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournaments'
            },
            (payload) => {
              const tournamentStore = useTournamentStore.getState();
              
              switch (payload.eventType) {
                case 'INSERT':
                  tournamentStore.fetchTournaments();
                  break;
                case 'UPDATE':
                  tournamentStore.fetchTournaments();
                  break;
                case 'DELETE':
                  tournamentStore.fetchTournaments();
                  break;
              }
            }
          )
          .subscribe((status) => {
            set({ isConnected: status === 'SUBSCRIBED' });
          });

        set(state => ({
          subscriptions: new Map(state.subscriptions).set(channelName, subscription)
        }));
      },

      subscribeToNotifications: (userId) => {
        const { subscriptions } = get();
        const channelName = `notifications:${userId}`;
        
        if (subscriptions.has(channelName)) {
          return; // Already subscribed
        }

        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              const notificationStore = useNotificationStore.getState();
              notificationStore.addNotification(payload.new as any);
            }
          )
          .subscribe();

        set(state => ({
          subscriptions: new Map(state.subscriptions).set(channelName, subscription)
        }));
      },

      subscribeToTournament: (tournamentId) => {
        const { subscriptions } = get();
        const channelName = `tournament:${tournamentId}`;
        
        if (subscriptions.has(channelName)) {
          return; // Already subscribed
        }

        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournaments',
              filter: `id=eq.${tournamentId}`
            },
            (payload) => {
              const tournamentStore = useTournamentStore.getState();
              tournamentStore.fetchTournamentById(tournamentId);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: `tournament_id=eq.${tournamentId}`
            },
            (payload) => {
              const tournamentStore = useTournamentStore.getState();
              tournamentStore.fetchTournamentById(tournamentId);
            }
          )
          .subscribe();

        set(state => ({
          subscriptions: new Map(state.subscriptions).set(channelName, subscription)
        }));
      },

      unsubscribe: (channelName) => {
        const { subscriptions } = get();
        const subscription = subscriptions.get(channelName);
        
        if (subscription) {
          supabase.removeChannel(subscription);
          set(state => {
            const newSubscriptions = new Map(state.subscriptions);
            newSubscriptions.delete(channelName);
            return { subscriptions: newSubscriptions };
          });
        }
      },

      unsubscribeAll: () => {
        const { subscriptions } = get();
        
        subscriptions.forEach((subscription) => {
          supabase.removeChannel(subscription);
        });
        
        set({ subscriptions: new Map(), isConnected: false });
      },

      setConnectionStatus: (connected) => set({ isConnected: connected }),
    }),
    {
      name: 'realtime-store',
    }
  )
);
