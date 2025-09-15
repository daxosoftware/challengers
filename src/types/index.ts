export interface User {
  id: string;
  email: string;
  username: string;
  role: 'organizer' | 'player';
  created_at: string;
  avatar_url?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  max_participants: number;
  current_participants: number;
  status: 'draft' | 'registration_open' | 'in_progress' | 'completed';
  start_date: string;
  organizer_id: string;
  organizer: User;
  created_at: string;
  updated_at: string;
  prize_pool?: string;
  entry_fee?: number;
  rules?: string;
}

export interface Participant {
  id: string;
  tournament_id: string;
  user_id: string;
  user: User;
  seed?: number;
  status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
  registered_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  player1?: User;
  player2?: User;
  winner_id?: string;
  player1_score?: number;
  player2_score?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  scheduled_at?: string;
  completed_at?: string;
  next_match_id?: string;
}

export interface ChatMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  user: User;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tournament_id?: string;
  title: string;
  message: string;
  type: 'match_start' | 'match_result' | 'tournament_update' | 'general';
  read: boolean;
  created_at: string;
}