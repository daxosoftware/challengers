import { supabase } from '../lib/supabase';
import { Tournament, Participant, Match, ChatMessage, Notification } from '../types';
import { DataSanitizer, ValidationSchemas, Validator } from '../utils/validation';

// Tournament operations
export const tournamentService = {
  async create(tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'organizer'>) {
    // Sanitize input data
    const sanitizedData = DataSanitizer.sanitizeObject(tournament, {
      name: 'string',
      description: 'string',
      format: 'string',
      max_participants: 'integer',
      current_participants: 'integer',
      status: 'string',
      start_date: 'string',
      organizer_id: 'string',
      prize_pool: 'string',
      entry_fee: 'number'
    });

    // Validate the sanitized data
    const validation = Validator.validate(sanitizedData, ValidationSchemas.tournament);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Données de tournoi invalides: ${errorMessages}`);
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert(sanitizedData)
      .select(`
        *,
        organizer:profiles!organizer_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getAll(filters?: {
    status?: string;
    organizer_id?: string;
    search?: string;
  }) {
    let query = supabase
      .from('tournaments')
      .select(`
        *,
        organizer:profiles!organizer_id(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      // Sanitize status filter
      const sanitizedStatus = DataSanitizer.sanitizeString(filters.status);
      query = query.eq('status', sanitizedStatus);
    }

    if (filters?.organizer_id) {
      // Sanitize organizer_id filter
      const sanitizedOrganizerId = DataSanitizer.sanitizeString(filters.organizer_id);
      query = query.eq('organizer_id', sanitizedOrganizerId);
    }

    if (filters?.search) {
      // Sanitize search term to prevent injection
      const sanitizedSearch = DataSanitizer.sanitizeString(filters.search);
      if (sanitizedSearch.length > 0) {
        query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    // Sanitize the ID parameter
    const sanitizedId = DataSanitizer.sanitizeString(id);
    if (!sanitizedId || sanitizedId.length === 0) {
      throw new Error('ID de tournoi invalide');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        organizer:profiles!organizer_id(*)
      `)
      .eq('id', sanitizedId)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tournament>) {
    // Sanitize the ID parameter
    const sanitizedId = DataSanitizer.sanitizeString(id);
    if (!sanitizedId || sanitizedId.length === 0) {
      throw new Error('ID de tournoi invalide');
    }

    // Sanitize update data
    const sanitizedUpdates = DataSanitizer.sanitizeObject(updates, {
      name: 'string',
      description: 'string',
      format: 'string',
      max_participants: 'integer',
      current_participants: 'integer',
      status: 'string',
      start_date: 'string',
      prize_pool: 'string',
      entry_fee: 'number'
    });

    // Validate the sanitized updates
    const allowedFields = ['name', 'description', 'format', 'max_participants', 'status', 'start_date', 'prize_pool', 'entry_fee'];
    const validatedUpdates = Object.fromEntries(
      Object.entries(sanitizedUpdates).filter(([key]) => allowedFields.includes(key))
    );

    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sanitizedId)
      .select(`
        *,
        organizer:profiles!organizer_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Sanitize the ID parameter
    const sanitizedId = DataSanitizer.sanitizeString(id);
    if (!sanitizedId || sanitizedId.length === 0) {
      throw new Error('ID de tournoi invalide');
    }

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', sanitizedId);

    if (error) throw error;
  },

  async subscribeToUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('tournaments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tournaments' },
        callback
      )
      .subscribe();
  }
};

// Participant operations
export const participantService = {
  async joinTournament(tournamentId: string, userId: string) {
    // Sanitize input parameters
    const sanitizedTournamentId = DataSanitizer.sanitizeString(tournamentId);
    const sanitizedUserId = DataSanitizer.sanitizeString(userId);
    
    if (!sanitizedTournamentId || !sanitizedUserId) {
      throw new Error('Paramètres invalides pour rejoindre le tournoi');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        tournament_id: sanitizedTournamentId,
        user_id: sanitizedUserId,
        status: 'registered',
      })
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;

    // Update tournament participant count
    await supabase.rpc('increment_participant_count', { tournament_id: sanitizedTournamentId });
    
    return data;
  },

  async leaveTournament(tournamentId: string, userId: string) {
    // Sanitize input parameters
    const sanitizedTournamentId = DataSanitizer.sanitizeString(tournamentId);
    const sanitizedUserId = DataSanitizer.sanitizeString(userId);
    
    if (!sanitizedTournamentId || !sanitizedUserId) {
      throw new Error('Paramètres invalides pour quitter le tournoi');
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('tournament_id', sanitizedTournamentId)
      .eq('user_id', sanitizedUserId);

    if (error) throw error;

    // Update tournament participant count
    await supabase.rpc('decrement_participant_count', { tournament_id: sanitizedTournamentId });
  },

  async getTournamentParticipants(tournamentId: string) {
    // Sanitize tournament ID
    const sanitizedTournamentId = DataSanitizer.sanitizeString(tournamentId);
    if (!sanitizedTournamentId) {
      throw new Error('ID de tournoi invalide');
    }

    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .eq('tournament_id', sanitizedTournamentId)
      .order('registered_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateParticipantStatus(participantId: string, status: string) {
    const { data, error } = await supabase
      .from('participants')
      .update({ status })
      .eq('id', participantId)
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }
};

// Match operations
export const matchService = {
  async createMatches(tournamentId: string, participants: Participant[]) {
    // This would implement the tournament bracket generation logic
    // For now, we'll create a simple single elimination bracket
    const rounds = Math.ceil(Math.log2(participants.length));
    const matches = [];

    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      
      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const { data, error } = await supabase
          .from('matches')
          .insert({
            tournament_id: tournamentId,
            round,
            match_number: matchNum,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        matches.push(data);
      }
    }

    return matches;
  },

  async getTournamentMatches(tournamentId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!player1_id(*),
        player2:profiles!player2_id(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateMatchResult(matchId: string, winnerId: string, player1Score: number, player2Score: number) {
    const { data, error } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        player1_score: player1Score,
        player2_score: player2Score,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select(`
        *,
        player1:profiles!player1_id(*),
        player2:profiles!player2_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async subscribeToMatchUpdates(tournamentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`matches:${tournamentId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
        callback
      )
      .subscribe();
  }
};

// Chat operations
export const chatService = {
  async sendMessage(tournamentId: string, userId: string, message: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        message,
      })
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(tournamentId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.reverse();
  },

  async subscribeToMessages(tournamentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${tournamentId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `tournament_id=eq.${tournamentId}` },
        callback
      )
      .subscribe();
  }
};

// User profile operations
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', updates.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Notification operations
export const notificationService = {
  async create(notification: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  async subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  }
};
