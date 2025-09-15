import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tournamentService, participantService, matchService, notificationService, chatService, fetchUserProfile, updateUserProfile } from '../database';
import { supabase } from '../../lib/supabase';

// Mock Supabase with all functions defined inside the factory
const { mocks } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockChannel = vi.fn();
  const mockOn = vi.fn();
  const mockSubscribe = vi.fn();
  const mockRpc = vi.fn();

  return {
    mocks: {
      mockSelect,
      mockInsert,
      mockUpdate,
      mockDelete,
      mockEq,
      mockSingle,
      mockOrder,
      mockChannel,
      mockOn,
      mockSubscribe,
      mockRpc,
    },
  };
});

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: mocks.mockSelect,
        insert: mocks.mockInsert,
        update: mocks.mockUpdate,
        delete: mocks.mockDelete,
      })),
      channel: mocks.mockChannel,
      rpc: mocks.mockRpc,
    },
  };
});

const mockTournament = {
  id: '1',
  name: 'Test Tournament',
  description: 'A test tournament',
  format: 'single_elimination' as const,
  max_participants: 16,
  current_participants: 0,
  status: 'draft' as const,
  start_date: '2024-12-01T00:00:00Z',
  organizer_id: 'organizer-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  prize_pool: null,
  entry_fee: null,
  rules: null,
};

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'player' as const,
  created_at: '2024-01-01T00:00:00Z',
  avatar_url: undefined as string | undefined,
};

const mockParticipant = {
  id: 'participant-1',
  tournament_id: '1',
  user_id: 'user-1',
  seed: 1,
  status: 'registered' as const,
  registered_at: '2024-01-01T00:00:00Z',
};

describe('Database Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a flexible mock chain that can handle any combination of methods
    const createMockChain = () => ({
      eq: vi.fn().mockReturnThis(),
      single: mocks.mockSingle,
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    });

    // Setup mock functions to return chainable objects
    mocks.mockSelect.mockImplementation(() => createMockChain());
    mocks.mockInsert.mockImplementation(() => ({ select: () => createMockChain() }));
    mocks.mockUpdate.mockImplementation(() => ({ eq: () => ({ select: () => createMockChain() }) }));
    mocks.mockDelete.mockImplementation(() => ({ eq: () => createMockChain() }));
    mocks.mockEq.mockImplementation(() => createMockChain());
    mocks.mockOrder.mockImplementation(() => createMockChain());

    mocks.mockChannel.mockReturnValue({
      on: mocks.mockOn.mockReturnValue({
        subscribe: mocks.mockSubscribe,
      }),
    });

    // Default resolved values
    mocks.mockSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tournamentService', () => {
    it('creates a tournament successfully', async () => {
      const tournamentData = {
        name: 'New Tournament',
        description: 'Test description',
        format: 'single_elimination' as const,
        max_participants: 16,
        current_participants: 0,
        status: 'draft' as const,
        start_date: '2024-12-01T00:00:00Z',
        organizer_id: 'organizer-1',
      };

      const expectedTournament = { ...mockTournament, ...tournamentData };

      mocks.mockSingle.mockResolvedValue({
        data: expectedTournament,
        error: null,
      });

      const result = await tournamentService.create(tournamentData);

      expect(supabase.from).toHaveBeenCalledWith('tournaments');
      expect(mocks.mockInsert).toHaveBeenCalledWith(tournamentData);
      expect(result).toEqual(expectedTournament);
    });

    it('handles tournament creation error', async () => {
      const tournamentData = {
        name: 'New Tournament',
        format: 'single_elimination' as const,
        max_participants: 16,
        current_participants: 0,
        status: 'draft' as const,
        start_date: '2024-12-01T00:00:00Z',
        organizer_id: 'organizer-1',
      };

      const error = new Error('Database error');
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error,
      });

      await expect(tournamentService.create(tournamentData)).rejects.toThrow('Database error');
    });

    it('fetches all tournaments successfully', async () => {
      const tournaments = [mockTournament];

      // Reset mockSelect for this specific test
      mocks.mockSelect.mockReturnValue({
        order: mocks.mockOrder.mockResolvedValue({
          data: tournaments,
          error: null,
        }),
      });

      const result = await tournamentService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('tournaments');
      expect(mocks.mockSelect).toHaveBeenCalledWith(expect.stringContaining('organizer:profiles'));
      expect(result).toEqual(tournaments);
    });

    it('fetches tournaments with filters', async () => {
      const tournaments = [mockTournament];
      const filters = { status: 'registration_open', search: 'test' };

      // Create a mock chain that supports filtering
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: tournaments, error: null }),
      };

      mocks.mockSelect.mockReturnValue({
        order: mocks.mockOrder.mockReturnValue(mockQuery),
      });

      const result = await tournamentService.getAll(filters);

      expect(result).toEqual(tournaments);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'registration_open');
      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('test'));
    });

    it('fetches tournament by ID successfully', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: mockTournament,
        error: null,
      });

      const result = await tournamentService.getById('1');

      expect(supabase.from).toHaveBeenCalledWith('tournaments');
      expect(mocks.mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockTournament);
    });

    it('updates tournament successfully', async () => {
      const updates = { name: 'Updated Tournament' };
      const updatedTournament = { ...mockTournament, ...updates };

      mocks.mockSingle.mockResolvedValue({
        data: updatedTournament,
        error: null,
      });

      const result = await tournamentService.update('1', updates);

      expect(mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        ...updates,
        updated_at: expect.any(String),
      }));
      expect(mocks.mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedTournament);
    });

    it('deletes tournament successfully', async () => {
      mocks.mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      await tournamentService.delete('1');

      expect(supabase.from).toHaveBeenCalledWith('tournaments');
      expect(mocks.mockDelete).toHaveBeenCalled();
      expect(mocks.mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('subscribes to tournament updates', async () => {
      const callback = vi.fn();
      
      await tournamentService.subscribeToUpdates(callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith('tournaments');
      expect(mocks.mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        callback
      );
      expect(mocks.mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('participantService', () => {
    it('joins tournament successfully', async () => {
      const participantWithUser = {
        ...mockParticipant,
        user: mockUser,
      };

      mocks.mockSingle.mockResolvedValue({
        data: participantWithUser,
        error: null,
      });

      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await participantService.joinTournament('1', 'user-1');

      expect(mocks.mockInsert).toHaveBeenCalledWith({
        tournament_id: '1',
        user_id: 'user-1',
        status: 'registered',
      });

      expect(mocks.mockRpc).toHaveBeenCalledWith('increment_participant_count', {
        tournament_id: '1',
      });

      expect(result).toEqual(participantWithUser);
    });

    it('leaves tournament successfully', async () => {
      mocks.mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await participantService.leaveTournament('1', 'user-1');

      expect(mocks.mockDelete).toHaveBeenCalled();
      expect(mocks.mockEq).toHaveBeenCalledWith('tournament_id', '1');
      expect(mocks.mockRpc).toHaveBeenCalledWith('decrement_participant_count', {
        tournament_id: '1',
      });
    });

    it('gets tournament participants successfully', async () => {
      const participants = [{ ...mockParticipant, user: mockUser }];

      mocks.mockOrder.mockResolvedValue({
        data: participants,
        error: null,
      });

      const result = await participantService.getTournamentParticipants('1');

      expect(supabase.from).toHaveBeenCalledWith('participants');
      expect(mocks.mockEq).toHaveBeenCalledWith('tournament_id', '1');
      expect(mocks.mockOrder).toHaveBeenCalledWith('registered_at', { ascending: true });
      expect(result).toEqual(participants);
    });

    it('updates participant status successfully', async () => {
      const updatedParticipant = {
        ...mockParticipant,
        status: 'checked_in' as const,
        user: mockUser,
      };

      mocks.mockSingle.mockResolvedValue({
        data: updatedParticipant,
        error: null,
      });

      const result = await participantService.updateParticipantStatus('participant-1', 'checked_in');

      expect(mocks.mockUpdate).toHaveBeenCalledWith({ status: 'checked_in' });
      expect(mocks.mockEq).toHaveBeenCalledWith('id', 'participant-1');
      expect(result).toEqual(updatedParticipant);
    });
  });

  describe('notificationService', () => {
    const mockNotification = {
      id: '1',
      user_id: 'user-1',
      tournament_id: '1',
      title: 'Test Notification',
      message: 'Test message',
      type: 'general' as const,
      read: false,
      created_at: '2024-01-01T00:00:00Z',
    };

    it('gets user notifications successfully', async () => {
      const notifications = [mockNotification];

      mocks.mockOrder.mockResolvedValue({
        data: notifications,
        error: null,
      });

      const result = await notificationService.getUserNotifications('user-1');

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mocks.mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(notifications);
    });

    it('marks notification as read successfully', async () => {
      mocks.mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      await notificationService.markAsRead('1');

      expect(mocks.mockUpdate).toHaveBeenCalledWith({ read: true });
      expect(mocks.mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('marks all notifications as read successfully', async () => {
      mocks.mockEq.mockReturnValue({
        eq: mocks.mockEq.mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      await notificationService.markAllAsRead('user-1');

      expect(mocks.mockUpdate).toHaveBeenCalledWith({ read: true });
      // Should be called twice - once for user_id and once for read: false
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mocks.mockEq).toHaveBeenCalledWith('read', false);
    });

    it('subscribes to notifications successfully', async () => {
      const callback = vi.fn();
      const userId = 'user-1';

      await notificationService.subscribeToNotifications(userId, callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith(`notifications:${userId}`);
      expect(mocks.mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      );
      expect(mocks.mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('matchService', () => {
    const mockMatch = {
      id: 'match-1',
      tournament_id: '1',
      round: 1,
      match_number: 1,
      player1_id: 'player-1',
      player2_id: 'player-2',
      winner_id: null,
      player1_score: null,
      player2_score: null,
      status: 'pending' as const,
      scheduled_at: null,
      completed_at: null,
      next_match_id: null,
    };

    it('creates matches for tournament successfully', async () => {
      const participants = [
        { ...mockParticipant, id: 'p1', user_id: 'user-1', user: mockUser },
        { ...mockParticipant, id: 'p2', user_id: 'user-2', user: mockUser },
        { ...mockParticipant, id: 'p3', user_id: 'user-3', user: mockUser },
        { ...mockParticipant, id: 'p4', user_id: 'user-4', user: mockUser },
      ];

      mocks.mockSingle.mockResolvedValue({
        data: mockMatch,
        error: null,
      });

      const result = await matchService.createMatches('1', participants);

      expect(supabase.from).toHaveBeenCalledWith('matches');
      expect(mocks.mockInsert).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining([mockMatch]));
    });

    it('gets tournament matches successfully', async () => {
      const matches = [mockMatch];

      const mockOrderChain = {
        order: vi.fn().mockResolvedValue({
          data: matches,
          error: null,
        }),
      };

      mocks.mockSelect.mockReturnValue({
        eq: mocks.mockEq.mockReturnValue({
          order: vi.fn().mockReturnValue(mockOrderChain),
        }),
      });

      const result = await matchService.getTournamentMatches('1');

      expect(supabase.from).toHaveBeenCalledWith('matches');
      expect(mocks.mockEq).toHaveBeenCalledWith('tournament_id', '1');
      expect(result).toEqual(matches);
    });

    it('updates match result successfully', async () => {
      const updatedMatch = {
        ...mockMatch,
        winner_id: 'player-1',
        player1_score: 2,
        player2_score: 1,
        status: 'completed' as const,
        completed_at: '2024-01-01T00:00:00Z',
      };

      mocks.mockSingle.mockResolvedValue({
        data: updatedMatch,
        error: null,
      });

      const result = await matchService.updateMatchResult('match-1', 'player-1', 2, 1);

      expect(mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        winner_id: 'player-1',
        player1_score: 2,
        player2_score: 1,
        status: 'completed',
        completed_at: expect.any(String),
      }));
      expect(result).toEqual(updatedMatch);
    });

    it('subscribes to match updates successfully', async () => {
      const callback = vi.fn();
      const tournamentId = '1';

      await matchService.subscribeToMatchUpdates(tournamentId, callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith(`matches:${tournamentId}`);
      expect(mocks.mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        callback
      );
      expect(mocks.mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('chatService', () => {
    const mockMessage = {
      id: 'msg-1',
      tournament_id: '1',
      user_id: 'user-1',
      message: 'Hello, world!',
      created_at: '2024-01-01T00:00:00Z',
      user: mockUser,
    };

    it('sends message successfully', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: mockMessage,
        error: null,
      });

      const result = await chatService.sendMessage('1', 'user-1', 'Hello, world!');

      expect(supabase.from).toHaveBeenCalledWith('chat_messages');
      expect(mocks.mockInsert).toHaveBeenCalledWith({
        tournament_id: '1',
        user_id: 'user-1',
        message: 'Hello, world!',
      });
      expect(result).toEqual(mockMessage);
    });

    it('gets messages successfully', async () => {
      const messages = [mockMessage];

      mocks.mockSelect.mockReturnValue({
        eq: mocks.mockEq.mockReturnValue({
          order: mocks.mockOrder.mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: messages,
              error: null,
            }),
          }),
        }),
      });

      const result = await chatService.getMessages('1', 50);

      expect(supabase.from).toHaveBeenCalledWith('chat_messages');
      expect(mocks.mockEq).toHaveBeenCalledWith('tournament_id', '1');
      expect(result).toEqual(messages.reverse());
    });

    it('subscribes to messages successfully', async () => {
      const callback = vi.fn();
      const tournamentId = '1';

      await chatService.subscribeToMessages(tournamentId, callback);

      expect(mocks.mockChannel).toHaveBeenCalledWith(`chat:${tournamentId}`);
      expect(mocks.mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        callback
      );
      expect(mocks.mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('User Profile Functions', () => {
    it('fetches user profile successfully', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await fetchUserProfile('user-1');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mocks.mockEq).toHaveBeenCalledWith('id', 'user-1');
      expect(result).toEqual(mockUser);
    });

    it('updates user profile successfully', async () => {
      const updates = { username: 'newusername' };
      const updatedUser = { ...mockUser, ...updates };

      mocks.mockSingle.mockResolvedValue({
        data: updatedUser,
        error: null,
      });

      const result = await updateUserProfile({ id: 'user-1', ...updates });

      expect(mocks.mockUpdate).toHaveBeenCalledWith({ id: 'user-1', ...updates });
      expect(mocks.mockEq).toHaveBeenCalledWith('id', 'user-1');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('notificationService - Additional Tests', () => {
    const mockNotification = {
      id: '1',
      user_id: 'user-1',
      tournament_id: '1',
      title: 'Test Notification',
      message: 'Test message',
      type: 'general' as const,
      read: false,
      created_at: '2024-01-01T00:00:00Z',
    };

    it('creates notification successfully', async () => {
      const notificationData = {
        user_id: 'user-1',
        tournament_id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'general' as const,
        read: false,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      const result = await notificationService.create(notificationData);

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mocks.mockInsert).toHaveBeenCalledWith(notificationData);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: networkError,
      });

      await expect(tournamentService.getById('1')).rejects.toThrow('Network error');
    });

    it('handles database constraint errors', async () => {
      const constraintError = {
        message: 'Unique constraint violation',
        code: '23505',
      };

      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: constraintError,
      });

      await expect(
        tournamentService.create({
          name: 'Duplicate Tournament',
          format: 'single_elimination',
          max_participants: 16,
          current_participants: 0,
          status: 'draft',
          start_date: '2024-12-01T00:00:00Z',
          organizer_id: 'organizer-1',
        })
      ).rejects.toMatchObject(constraintError);
    });

    it('handles timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mocks.mockOrder.mockRejectedValue(timeoutError);

      // Reset select mock to return the order mock that rejects
      mocks.mockSelect.mockReturnValue({
        order: mocks.mockOrder,
      });

      await expect(tournamentService.getAll()).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance and Optimization', () => {
    it('uses proper select queries to minimize data transfer', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: mockTournament,
        error: null,
      });

      await tournamentService.getById('1');

      // Verify that the select includes related data in a single query
      expect(mocks.mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('organizer:profiles')
      );
    });

    it('handles large result sets efficiently', async () => {
      // Create a large dataset
      const largeTournamentList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTournament,
        id: `tournament-${i}`,
        name: `Tournament ${i}`,
      }));

      mocks.mockOrder.mockResolvedValue({
        data: largeTournamentList,
        error: null,
      });

      mocks.mockSelect.mockReturnValue({
        order: mocks.mockOrder,
      });

      const result = await tournamentService.getAll();

      expect(result).toHaveLength(1000);
      expect(mocks.mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});