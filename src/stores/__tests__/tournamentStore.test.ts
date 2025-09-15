import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTournamentStore } from '../tournamentStore';
import { Tournament } from '../../types';

// Mock the database service
vi.mock('../../services/database', () => ({
  tournamentService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the error handler
vi.mock('../../utils/errorHandler', () => ({
  ErrorHandler: {
    handle: vi.fn((error) => ({ message: 'Test error' })),
  },
}));

describe('tournamentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTournamentStore.setState({
      tournaments: [],
      currentTournament: null,
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 12,
    });
  });

  it('initializes with correct default state', () => {
    const state = useTournamentStore.getState();
    
    expect(state.tournaments).toEqual([]);
    expect(state.currentTournament).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.searchTerm).toBe('');
    expect(state.statusFilter).toBe('all');
  });

  it('sets search term', () => {
    const { setSearchTerm } = useTournamentStore.getState();
    
    act(() => {
      setSearchTerm('test search');
    });

    expect(useTournamentStore.getState().searchTerm).toBe('test search');
  });

  it('sets status filter', () => {
    const { setStatusFilter } = useTournamentStore.getState();
    
    act(() => {
      setStatusFilter('in_progress');
    });

    expect(useTournamentStore.getState().statusFilter).toBe('in_progress');
  });

  it('clears error', () => {
    useTournamentStore.setState({ error: 'Test error' });
    
    const { clearError } = useTournamentStore.getState();
    act(() => {
      clearError();
    });

    expect(useTournamentStore.getState().error).toBeNull();
  });

  it('calculates stats correctly', () => {
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        name: 'Tournament 1',
        description: 'Test',
        format: 'single_elimination',
        max_participants: 16,
        current_participants: 8,
        status: 'in_progress',
        start_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        organizer: {
          id: '1',
          username: 'test',
          email: 'test@test.com',
          avatar_url: null,
          role: 'organizer',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
      {
        id: '2',
        name: 'Tournament 2',
        description: 'Test',
        format: 'round_robin',
        max_participants: 8,
        current_participants: 4,
        status: 'completed',
        start_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        organizer: {
          id: '1',
          username: 'test',
          email: 'test@test.com',
          avatar_url: null,
          role: 'organizer',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    ];

    useTournamentStore.setState({ tournaments: mockTournaments });
    
    const { stats } = useTournamentStore.getState();
    
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.draft).toBe(0);
  });
});

// Helper function to wrap act calls
function act(callback: () => void) {
  callback();
}

