import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchUserProfile, updateUserProfile } from '../services/database';
import { RateLimiter, CSRFProtection, SessionSecurity } from '../utils/validation';
import { ErrorHandler } from '../utils/errorHandler';
import { SecurityMonitor, securityHelpers } from '../utils/securityMonitor';
import { getRateLimitConfig, SecurityEventTypes } from '../config/securityConfig';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'organizer';
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, role: 'player' | 'organizer') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  verifyCSRF: (token: string) => boolean;
  getSessionSecurity: () => { valid: boolean; reason?: string };
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session security and CSRF protection
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Create secure session
          const newSessionId = SessionSecurity.createSession(session.user.id);
          setSessionId(newSessionId);
          
          // Fetch user profile
          await fetchProfile(session.user.id);
        }
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const newSessionId = SessionSecurity.createSession(session.user.id);
              setSessionId(newSessionId);
              await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              if (sessionId) {
                SessionSecurity.invalidateSession(sessionId);
                CSRFProtection.clearToken(sessionId);
              }
              setUser(null);
              setSessionId(null);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Authentication initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSecurity();
  }, []);

  // Session validation with periodic checks
  useEffect(() => {
    if (!sessionId) return;

    const validateSession = () => {
      const validation = SessionSecurity.validateSession(sessionId);
      if (!validation.valid) {
        console.warn(`Session invalid: ${validation.reason}`);
        signOut();
      }
    };

    // Validate session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchProfile = async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      setUser({
        id: profile.id,
        email: profile.email || '',
        username: profile.username,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const clientIP = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_'); // Simple client identification
    
    // Get rate limiting configuration
    const rateLimitConfig = getRateLimitConfig('login');
    
    // Rate limiting check
    const rateLimitResult = RateLimiter.isAllowed(
      clientIP, 
      rateLimitConfig.maxAttempts, 
      rateLimitConfig.windowMs
    );
    
    if (!rateLimitResult.allowed) {
      // Log rate limit violation
      securityHelpers.logRateLimitViolation('login');
      
      const error = ErrorHandler.handle({
        message: `Trop de tentatives de connexion. Réessayez dans ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)} minutes.`,
        name: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      throw new Error(error.message);
    }

    // Check for suspicious activity
    if (SecurityMonitor.detectSuspiciousActivity(undefined, clientIP)) {
      SecurityMonitor.logEvent(
        SecurityEventTypes.SUSPICIOUS_LOGIN_PATTERN,
        { email, ip: clientIP },
        'high'
      );
    }

    try {
      setLoading(true);

      // Validate CSRF token if available
      const csrfToken = CSRFProtection.getToken();
      if (csrfToken && sessionId && !CSRFProtection.validateToken(sessionId, csrfToken)) {
        securityHelpers.logCSRFViolation();
        throw new Error('Invalid CSRF token. Please refresh the page.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed authentication attempt
        securityHelpers.logAuthAttempt(false, undefined, { email, error: error.message });
        
        // Increment rate limiting on failed attempt
        RateLimiter.isAllowed(clientIP, rateLimitConfig.maxAttempts, rateLimitConfig.windowMs);
        throw error;
      }

      if (!data.user) {
        securityHelpers.logAuthAttempt(false, undefined, { email, error: 'No user returned' });
        throw new Error('Aucun utilisateur retourné après la connexion');
      }

      // Log successful authentication
      securityHelpers.logAuthAttempt(true, data.user.id, { email });
      
      // Reset rate limiting on successful login
      RateLimiter.reset(clientIP);

      // Profile will be fetched by the auth state change listener
    } catch (error: any) {
      const handledError = ErrorHandler.handle(error);
      throw new Error(handledError.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    username: string, 
    role: 'player' | 'organizer'
  ) => {
    const clientIP = 'signup_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Rate limiting for signup (3 attempts per hour)
    const rateLimitResult = RateLimiter.isAllowed(clientIP, 3, 60 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const error = ErrorHandler.handle({
        message: `Trop de tentatives d'inscription. Réessayez dans ${Math.ceil(rateLimitResult.resetTime - Date.now()) / 60000} minutes.`,
        name: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      throw new Error(error.message);
    }

    try {
      setLoading(true);

      // Validate CSRF token
      const csrfToken = CSRFProtection.getToken();
      if (csrfToken && sessionId && !CSRFProtection.validateToken(sessionId, csrfToken)) {
        throw new Error('Invalid CSRF token. Please refresh the page.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        RateLimiter.isAllowed(clientIP, 3, 60 * 60 * 1000);
        throw error;
      }

      if (!data.user) {
        throw new Error('Aucun utilisateur retourné après l\'inscription');
      }

      // Create user profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        role,
        email: data.user.email,
      });

      // Reset rate limiting on successful signup
      RateLimiter.reset(clientIP);

    } catch (error: any) {
      const handledError = ErrorHandler.handle(error);
      throw new Error(handledError.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear security tokens
      if (sessionId) {
        SessionSecurity.invalidateSession(sessionId);
        CSRFProtection.clearToken(sessionId);
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setSessionId(null);
    } catch (error: any) {
      const handledError = ErrorHandler.handle(error);
      console.error('Sign out error:', handledError.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resetPassword = useCallback(async (email: string) => {
    const clientIP = 'reset_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Rate limiting for password reset (3 attempts per hour)
    const rateLimitResult = RateLimiter.isAllowed(clientIP, 3, 60 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const error = ErrorHandler.handle({
        message: `Trop de tentatives de réinitialisation. Réessayez dans ${Math.ceil(rateLimitResult.resetTime - Date.now()) / 60000} minutes.`,
        name: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      throw new Error(error.message);
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        RateLimiter.isAllowed(clientIP, 3, 60 * 60 * 1000);
        throw error;
      }

      // Reset rate limiting on successful request
      RateLimiter.reset(clientIP);
      
    } catch (error: any) {
      const handledError = ErrorHandler.handle(error);
      throw new Error(handledError.message);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    const clientIP = 'update_' + user.id;
    
    // Rate limiting for profile updates (10 attempts per hour)
    const rateLimitResult = RateLimiter.isAllowed(clientIP, 10, 60 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const error = ErrorHandler.handle({
        message: `Trop de tentatives de mise à jour. Réessayez dans ${Math.ceil(rateLimitResult.resetTime - Date.now()) / 60000} minutes.`,
        name: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      throw new Error(error.message);
    }

    try {
      setLoading(true);

      // Validate CSRF token
      const csrfToken = CSRFProtection.getToken();
      if (csrfToken && sessionId && !CSRFProtection.validateToken(sessionId, csrfToken)) {
        throw new Error('Invalid CSRF token. Please refresh the page.');
      }

      const updatedProfile = await updateUserProfile({
        id: user.id,
        ...updates,
      });

      setUser(prevUser => ({
        ...prevUser!,
        ...updatedProfile,
      }));

      // Reset rate limiting on successful update
      RateLimiter.reset(clientIP);

    } catch (error: any) {
      const handledError = ErrorHandler.handle(error);
      throw new Error(handledError.message);
    } finally {
      setLoading(false);
    }
  }, [user, sessionId]);

  const verifyCSRF = useCallback((token: string): boolean => {
    if (!sessionId) return false;
    return CSRFProtection.validateToken(sessionId, token);
  }, [sessionId]);

  const getSessionSecurity = useCallback(() => {
    if (!sessionId) {
      return { valid: false, reason: 'No active session' };
    }
    return SessionSecurity.validateSession(sessionId);
  }, [sessionId]);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    verifyCSRF,
    getSessionSecurity,
  };
}