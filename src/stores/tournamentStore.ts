import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Tournament } from '../types';
import { tournamentService } from '../services/database';
import { ErrorHandler } from '../utils/errorHandler';

// Enhanced error handling with retry logic
class RetryableError extends Error {
  constructor(message: string, public retryable: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface TournamentState {
  // Data
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  loading: boolean;
  error: string | null;
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  
  // Actions
  fetchTournaments: (filters?: { status?: string; search?: string }) => Promise<void>;
  fetchTournamentById: (id: string) => Promise<void>;
  createTournament: (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'organizer'>) => Promise<void>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  
  // UI Actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  
  // Computed values
  filteredTournaments: Tournament[];
  recentTournaments: Tournament[];
  stats: {
    total: number;
    active: number;
    completed: number;
    draft: number;
  };
}

export const useTournamentStore = create<TournamentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tournaments: [],
        currentTournament: null,
        loading: false,
        error: null,
        searchTerm: '',
        statusFilter: 'all',
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 12,

        // Actions
        fetchTournaments: async (filters, retryCount = 0) => {
          const startTime = Date.now();
          
          try {
            set({ loading: true, error: null });
            
            // Add timeout for API calls
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            const tournamentsPromise = tournamentService.getAll(filters);
            const tournaments = await Promise.race([tournamentsPromise, timeoutPromise]) as Tournament[];
            
            set({ 
              tournaments,
              totalPages: Math.ceil(tournaments.length / get().itemsPerPage),
              error: null
            });
            
            // Log performance metrics
            const duration = Date.now() - startTime;
            if (process.env.NODE_ENV === 'development') {
              console.log(`fetchTournaments completed in ${duration}ms`);
            }
            
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            
            // Determine if error is retryable
            const isRetryable = ErrorHandler.isNetworkError(error) && retryCount < MAX_RETRIES;
            
            if (isRetryable) {
              console.warn(`fetchTournaments attempt ${retryCount + 1} failed, retrying...`);
              
              // Exponential backoff
              const delay = RETRY_DELAY * Math.pow(2, retryCount);
              
              setTimeout(() => {
                get().fetchTournaments(filters, retryCount + 1);
              }, delay);
              
              // Don't set error state on retryable errors
              return;
            }
            
            set({ 
              error: `${appError.message}${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`,
              tournaments: [] // Clear tournaments on error
            });
            
            // Log error for monitoring
            console.error('fetchTournaments failed:', {
              error: appError,
              retryCount,
              duration: Date.now() - startTime,
              filters
            });
          } finally {
            set({ loading: false });
          }
        },

        fetchTournamentById: async (id, retryCount = 0) => {
          if (!id?.trim()) {
            set({ error: 'ID de tournoi invalide' });
            return;
          }
          
          const startTime = Date.now();
          
          try {
            set({ loading: true, error: null });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 8000)
            );
            
            const tournamentPromise = tournamentService.getById(id);
            const tournament = await Promise.race([tournamentPromise, timeoutPromise]) as Tournament;
            
            if (!tournament) {
              throw new Error('Tournoi introuvable');
            }
            
            set({ currentTournament: tournament, error: null });
            
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            const isRetryable = ErrorHandler.isNetworkError(error) && retryCount < MAX_RETRIES;
            
            if (isRetryable) {
              console.warn(`fetchTournamentById attempt ${retryCount + 1} failed, retrying...`);
              
              const delay = RETRY_DELAY * Math.pow(2, retryCount);
              setTimeout(() => {
                get().fetchTournamentById(id, retryCount + 1);
              }, delay);
              
              return;
            }
            
            set({ 
              error: `${appError.message}${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`,
              currentTournament: null
            });
            
            console.error('fetchTournamentById failed:', {
              error: appError,
              id,
              retryCount,
              duration: Date.now() - startTime
            });
          } finally {
            set({ loading: false });
          }
        },

        createTournament: async (tournamentData) => {
          if (!tournamentData?.name?.trim()) {
            set({ error: 'Données de tournoi invalides' });
            return null;
          }
          
          const startTime = Date.now();
          
          try {
            set({ loading: true, error: null });
            
            const newTournament = await tournamentService.create(tournamentData);
            
            if (!newTournament) {
              throw new Error('Impossible de créer le tournoi');
            }
            
            set(state => {
              const updatedTournaments = [newTournament, ...state.tournaments];
              return {
                tournaments: updatedTournaments,
                totalPages: Math.ceil(updatedTournaments.length / state.itemsPerPage),
                error: null
              };
            });
            
            console.log(`Tournament created in ${Date.now() - startTime}ms`);
            return newTournament;
            
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: `Erreur lors de la création: ${appError.message}` });
            
            console.error('createTournament failed:', {
              error: appError,
              tournamentData,
              duration: Date.now() - startTime
            });
            
            return null;
          } finally {
            set({ loading: false });
          }
        },

        updateTournament: async (id, updates) => {
          try {
            set({ loading: true, error: null });
            const updatedTournament = await tournamentService.update(id, updates);
            set(state => ({
              tournaments: state.tournaments.map(t => 
                t.id === id ? updatedTournament : t
              ),
              currentTournament: state.currentTournament?.id === id 
                ? updatedTournament 
                : state.currentTournament
            }));
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: appError.message });
          } finally {
            set({ loading: false });
          }
        },

        deleteTournament: async (id) => {
          try {
            set({ loading: true, error: null });
            await tournamentService.delete(id);
            set(state => ({
              tournaments: state.tournaments.filter(t => t.id !== id),
              currentTournament: state.currentTournament?.id === id 
                ? null 
                : state.currentTournament,
              totalPages: Math.ceil((state.tournaments.length - 1) / state.itemsPerPage)
            }));
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: appError.message });
          } finally {
            set({ loading: false });
          }
        },

        // UI Actions
        setSearchTerm: (term) => set({ searchTerm: term }),
        setStatusFilter: (status) => set({ statusFilter: status }),
        setCurrentPage: (page) => set({ currentPage: page }),
        // Enhanced error recovery
        retryLastOperation: () => {
          const state = get();
          // Implement retry logic based on last failed operation
          // This could be expanded to track the last operation type
          state.fetchTournaments();
        },
        
        // Graceful error reset with optional callback
        clearError: (onClear?: () => void) => {
          set({ error: null });
          onClear?.();
        },
        // Enhanced tournament setter with validation
        setCurrentTournament: (tournament) => {
          if (tournament && !tournament.id) {
            console.warn('Invalid tournament: missing ID');
            set({ error: 'Données de tournoi invalides' });
            return;
          }
          set({ currentTournament: tournament, error: null });
        },
        
        // Bulk operations with error handling
        refreshData: async () => {
          try {
            set({ loading: true });
            await Promise.all([
              get().fetchTournaments(),
            ]);
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: `Erreur lors du rafraîchissement: ${appError.message}` });
          }
        },

        // Computed values
        filteredTournaments: () => {
          const { tournaments, searchTerm, statusFilter } = get();
          return tournaments.filter(tournament => {
            const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 tournament.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 tournament.organizer.username.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
            
            return matchesSearch && matchesStatus;
          });
        },

        recentTournaments: () => {
          const { tournaments } = get();
          return tournaments.slice(0, 3);
        },

        stats: () => {
          const { tournaments } = get();
          return {
            total: tournaments.length,
            active: tournaments.filter(t => t.status === 'in_progress').length,
            completed: tournaments.filter(t => t.status === 'completed').length,
            draft: tournaments.filter(t => t.status === 'draft').length,
          };
        },
      }),
      {
        name: 'tournament-storage',
        partialize: (state) => ({
          searchTerm: state.searchTerm,
          statusFilter: state.statusFilter,
          currentPage: state.currentPage,
        }),
      }
    ),
    {
      name: 'tournament-store',
    }
  )
);
