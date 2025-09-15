import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: 'organizer' | 'player';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role: 'organizer' | 'player';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: 'organizer' | 'player';
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          format: 'single_elimination' | 'double_elimination' | 'round_robin';
          max_participants: number;
          current_participants: number;
          status: 'draft' | 'registration_open' | 'in_progress' | 'completed';
          start_date: string;
          organizer_id: string;
          created_at: string;
          updated_at: string;
          prize_pool: string | null;
          entry_fee: number | null;
          rules: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          format: 'single_elimination' | 'double_elimination' | 'round_robin';
          max_participants: number;
          current_participants?: number;
          status?: 'draft' | 'registration_open' | 'in_progress' | 'completed';
          start_date: string;
          organizer_id: string;
          created_at?: string;
          updated_at?: string;
          prize_pool?: string | null;
          entry_fee?: number | null;
          rules?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          format?: 'single_elimination' | 'double_elimination' | 'round_robin';
          max_participants?: number;
          current_participants?: number;
          status?: 'draft' | 'registration_open' | 'in_progress' | 'completed';
          start_date?: string;
          organizer_id?: string;
          updated_at?: string;
          prize_pool?: string | null;
          entry_fee?: number | null;
          rules?: string | null;
        };
      };
      participants: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string;
          seed: number | null;
          status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
          registered_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id: string;
          seed?: number | null;
          status?: 'registered' | 'checked_in' | 'eliminated' | 'winner';
          registered_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          user_id?: string;
          seed?: number | null;
          status?: 'registered' | 'checked_in' | 'eliminated' | 'winner';
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          round: number;
          match_number: number;
          player1_id: string | null;
          player2_id: string | null;
          winner_id: string | null;
          player1_score: number | null;
          player2_score: number | null;
          status: 'pending' | 'in_progress' | 'completed' | 'bye';
          scheduled_at: string | null;
          completed_at: string | null;
          next_match_id: string | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round: number;
          match_number: number;
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          player1_score?: number | null;
          player2_score?: number | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'bye';
          scheduled_at?: string | null;
          completed_at?: string | null;
          next_match_id?: string | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round?: number;
          match_number?: number;
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          player1_score?: number | null;
          player2_score?: number | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'bye';
          scheduled_at?: string | null;
          completed_at?: string | null;
          next_match_id?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          user_id?: string;
          message?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: string | null;
          title: string;
          message: string;
          type: 'match_start' | 'match_result' | 'tournament_update' | 'general';
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tournament_id?: string | null;
          title: string;
          message: string;
          type: 'match_start' | 'match_result' | 'tournament_update' | 'general';
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tournament_id?: string | null;
          title?: string;
          message?: string;
          type?: 'match_start' | 'match_result' | 'tournament_update' | 'general';
          read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
