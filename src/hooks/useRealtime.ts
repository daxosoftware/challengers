import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export function useRealtimeSubscription(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
): RealtimeSubscription | null {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!callback) return;

    const channelName = filter ? `${table}:${filter}` : table;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        callback
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [table, filter, callback]);

  return channelRef.current ? {
    channel: channelRef.current,
    unsubscribe: () => channelRef.current?.unsubscribe(),
  } : null;
}

// Specific hooks for different entities
export function useTournamentUpdates(tournamentId: string, callback?: (payload: any) => void) {
  return useRealtimeSubscription('tournaments', `id=eq.${tournamentId}`, callback);
}

export function useMatchUpdates(tournamentId: string, callback?: (payload: any) => void) {
  return useRealtimeSubscription('matches', `tournament_id=eq.${tournamentId}`, callback);
}

export function useChatUpdates(tournamentId: string, callback?: (payload: any) => void) {
  return useRealtimeSubscription('chat_messages', `tournament_id=eq.${tournamentId}`, callback);
}

export function useNotificationUpdates(userId: string, callback?: (payload: any) => void) {
  return useRealtimeSubscription('notifications', `user_id=eq.${userId}`, callback);
}

export function useParticipantUpdates(tournamentId: string, callback?: (payload: any) => void) {
  return useRealtimeSubscription('participants', `tournament_id=eq.${tournamentId}`, callback);
}
