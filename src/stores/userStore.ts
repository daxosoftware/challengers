import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '../types';
import { fetchUserProfile, updateUserProfile } from '../services/database';
import { ErrorHandler } from '../utils/errorHandler';

interface UserState {
  // Data
  profile: User | null;
  loading: boolean;
  error: string | null;
  
  // User preferences
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      tournamentUpdates: boolean;
      matchReminders: boolean;
    };
    language: string;
  };
  
  // User stats
  stats: {
    tournamentsCreated: number;
    tournamentsJoined: number;
    matchesPlayed: number;
    winRate: number;
    totalWinnings: number;
  };
  
  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
  clearError: () => void;
  reset: () => void;
}

const defaultPreferences = {
  theme: 'dark' as const,
  notifications: {
    email: true,
    push: true,
    tournamentUpdates: true,
    matchReminders: true,
  },
  language: 'fr',
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profile: null,
        loading: false,
        error: null,
        preferences: defaultPreferences,
        stats: {
          tournamentsCreated: 0,
          tournamentsJoined: 0,
          matchesPlayed: 0,
          winRate: 0,
          totalWinnings: 0,
        },

        // Actions
        fetchProfile: async (userId) => {
          try {
            set({ loading: true, error: null });
            const profile = await fetchUserProfile(userId);
            set({ profile });
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: appError.message });
          } finally {
            set({ loading: false });
          }
        },

        updateProfile: async (updates) => {
          try {
            set({ loading: true, error: null });
            const updatedProfile = await updateUserProfile(updates);
            set({ profile: updatedProfile });
          } catch (error) {
            const appError = ErrorHandler.handle(error);
            set({ error: appError.message });
          } finally {
            set({ loading: false });
          }
        },

        updatePreferences: (newPreferences) => {
          set(state => ({
            preferences: { ...state.preferences, ...newPreferences }
          }));
        },

        clearError: () => set({ error: null }),

        reset: () => set({
          profile: null,
          loading: false,
          error: null,
          preferences: defaultPreferences,
          stats: {
            tournamentsCreated: 0,
            tournamentsJoined: 0,
            matchesPlayed: 0,
            winRate: 0,
            totalWinnings: 0,
          },
        }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
);
