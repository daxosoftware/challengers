import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthProvider } from '../useAuth';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'player' as const,
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockSupabaseUser = {
  id: '123',
  email: 'test@example.com',
};

const mockProfile = {
  id: '123',
  username: 'testuser',
  role: 'player',
  created_at: '2024-01-01T00:00:00.000Z',
  avatar_url: null,
};

describe('useAuth', () => {
  let mockSubscription: any;
  let mockAuthCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSubscription = {
      unsubscribe: vi.fn(),
    };

    // Setup default mocks
    const mockAuthStateChange = vi.fn((callback) => {
      // Store callback for manual triggering
      mockAuthCallback = callback;
      return { data: { subscription: mockSubscription } };
    });

    (supabase.auth.onAuthStateChange as any) = mockAuthStateChange;
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuthProvider());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('handles initial session correctly', async () => {
    const mockSession = { user: mockSupabaseUser };
    
    (supabase.auth.getSession as any).mockResolvedValue({ 
      data: { session: mockSession } 
    });

    const mockFromChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        })),
      })),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useAuthProvider());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(expect.objectContaining({
      id: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
      role: mockUser.role,
    }));
  });

  it('signs in user successfully', async () => {
    const mockFromChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        })),
      })),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const { result } = renderHook(() => useAuthProvider());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        email: mockUser.email,
        username: mockUser.username,
      }));
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles sign in error', async () => {
    const errorMessage = 'Invalid credentials';
    
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuthProvider());

    await expect(
      act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow(errorMessage);

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('signs up user successfully', async () => {
    const mockFromChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const { result } = renderHook(() => useAuthProvider());

    await act(async () => {
      await result.current.signUp(
        'newuser@example.com',
        'password123',
        'newuser',
        'player'
      );
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles sign up error', async () => {
    const errorMessage = 'User already exists';
    
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: null },
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuthProvider());

    await expect(
      act(async () => {
        await result.current.signUp(
          'existing@example.com',
          'password123',
          'existing',
          'player'
        );
      })
    ).rejects.toThrow(errorMessage);
  });

  it('signs out user successfully', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthProvider());

    // First set a user
    act(() => {
      result.current.user = mockUser;
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles sign out error', async () => {
    const errorMessage = 'Sign out failed';
    
    (supabase.auth.signOut as any).mockResolvedValue({
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuthProvider());

    await expect(
      act(async () => {
        await result.current.signOut();
      })
    ).rejects.toThrow(errorMessage);
  });

  it('resets password successfully', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthProvider());

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: `${window.location.origin}/reset-password` }
    );
  });

  it('handles reset password error', async () => {
    const errorMessage = 'Reset failed';
    
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
      error: { message: errorMessage },
    });

    const { result } = renderHook(() => useAuthProvider());

    await expect(
      act(async () => {
        await result.current.resetPassword('invalid@example.com');
      })
    ).rejects.toThrow(errorMessage);
  });

  it('updates user profile successfully', async () => {
    const updatedProfile = { ...mockProfile, username: 'updateduser' };
    
    const mockFromChain = {
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
          })),
        })),
      })),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useAuthProvider());

    // Set initial user
    act(() => {
      (result.current as any).user = mockUser;
    });

    await act(async () => {
      await result.current.updateProfile({ username: 'updateduser' });
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles auth state changes', async () => {
    const mockFromChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        })),
      })),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);

    const { result } = renderHook(() => useAuthProvider());

    // Simulate auth state change
    await act(async () => {
      await mockAuthCallback('SIGNED_IN', { user: mockSupabaseUser });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
      }));
    });

    // Simulate sign out
    await act(async () => {
      await mockAuthCallback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
  });

  it('handles profile fetch error gracefully', async () => {
    const mockFromChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Profile not found' }
          }),
        })),
      })),
    };

    (supabase.from as any).mockReturnValue(mockFromChain);
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockSupabaseUser } }
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuthProvider());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.user).toBeNull();

    consoleSpy.mockRestore();
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useAuthProvider());

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });
});