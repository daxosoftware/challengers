export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  static validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const error = this.validateField(value, rule, field);
      
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private static validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${this.formatFieldName(fieldName)} est requis.`;
    }

    // Skip other validations if field is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    const stringValue = String(value);

    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `${this.formatFieldName(fieldName)} doit contenir au moins ${rule.minLength} caractères.`;
    }

    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `${this.formatFieldName(fieldName)} ne peut pas dépasser ${rule.maxLength} caractères.`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return `${this.formatFieldName(fieldName)} a un format invalide.`;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  private static formatFieldName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      email: 'L\'adresse email',
      password: 'Le mot de passe',
      username: 'Le nom d\'utilisateur',
      name: 'Le nom',
      description: 'La description',
      participantCount: 'Le nombre de participants',
      maxParticipants: 'Le nombre maximum de participants',
      startDate: 'La date de début',
      prizePool: 'La cagnotte',
      entryFee: 'Les frais d\'inscription',
    };

    return fieldNames[fieldName] || fieldName;
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  numeric: /^\d+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

// Predefined validation schemas
export const ValidationSchemas = {
  auth: {
    email: {
      required: true,
      pattern: ValidationPatterns.email,
    },
    password: {
      required: true,
      minLength: 8,
      pattern: ValidationPatterns.password,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Le mot de passe doit contenir au moins une minuscule.';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Le mot de passe doit contenir au moins une majuscule.';
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Le mot de passe doit contenir au moins un chiffre.';
        }
        return null;
      },
    },
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: ValidationPatterns.username,
    },
  },

  tournament: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 100,
      custom: (value: string) => {
        if (value && value.trim().length < 3) {
          return 'Le nom du tournoi doit contenir au moins 3 caractères non-blancs.';
        }
        return null;
      },
    },
    description: {
      maxLength: 500,
    },
    maxParticipants: {
      required: true,
      custom: (value: any) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 2) {
          return 'Le nombre de participants doit être au moins 2.';
        }
        if (num > 1024) {
          return 'Le nombre de participants ne peut pas dépasser 1024.';
        }
        return null;
      },
    },
    startDate: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value);
        const now = new Date();
        if (date < now) {
          return 'La date de début doit être dans le futur.';
        }
        return null;
      },
    },
    prizePool: {
      maxLength: 50,
      custom: (value: string) => {
        if (value && !/^[\d.,€$\s]+$/.test(value)) {
          return 'Format de cagnotte invalide.';
        }
        return null;
      },
    },
    entryFee: {
      custom: (value: any) => {
        if (value !== undefined && value !== null && value !== '') {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) {
            return 'Les frais d\'inscription doivent être un nombre positif.';
          }
        }
        return null;
      },
    },
  },

  profile: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: ValidationPatterns.username,
    },
    avatarUrl: {
      custom: (value: string) => {
        if (value && !ValidationPatterns.url.test(value)) {
          return 'L\'URL de l\'avatar n\'est pas valide.';
        }
        return null;
      },
    },
  },
};

// Data sanitization utilities
export class DataSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>&"']/g, (char) => { // Escape special characters
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return escapeMap[char] || char;
      });
  }

  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';
    return input.trim().toLowerCase();
  }

  static sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  }

  static sanitizeInteger(input: any): number | null {
    const num = parseInt(input);
    return isNaN(num) ? null : num;
  }

  static sanitizeBoolean(input: any): boolean {
    return Boolean(input);
  }

  static sanitizeObject(obj: Record<string, any>, schema: Record<string, 'string' | 'number' | 'integer' | 'boolean' | 'email'>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, type] of Object.entries(schema)) {
      if (obj.hasOwnProperty(key)) {
        switch (type) {
          case 'string':
            sanitized[key] = this.sanitizeString(obj[key]);
            break;
          case 'email':
            sanitized[key] = this.sanitizeEmail(obj[key]);
            break;
          case 'number':
            sanitized[key] = this.sanitizeNumber(obj[key]);
            break;
          case 'integer':
            sanitized[key] = this.sanitizeInteger(obj[key]);
            break;
          case 'boolean':
            sanitized[key] = this.sanitizeBoolean(obj[key]);
            break;
          default:
            sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  }
}

// Enhanced rate limiting utility with progressive delays
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number; lastAttempt: number }> = new Map();
  private static blockedIPs: Set<string> = new Set();

  static isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
    requiresCaptcha: boolean;
  } {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    // Check if IP is permanently blocked
    if (this.blockedIPs.has(key)) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: now + 3600000, // 1 hour block
        requiresCaptcha: true,
      };
    }

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs, lastAttempt: now });
      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
        resetTime: now + windowMs,
        requiresCaptcha: false,
      };
    }

    // Progressive delay based on attempt count
    const timeSinceLastAttempt = now - attempt.lastAttempt;
    const requiredDelay = this.getProgressiveDelay(attempt.count);

    if (timeSinceLastAttempt < requiredDelay) {
      return {
        allowed: false,
        remainingAttempts: Math.max(0, maxAttempts - attempt.count),
        resetTime: attempt.resetTime,
        requiresCaptcha: attempt.count >= 3,
      };
    }

    if (attempt.count >= maxAttempts) {
      // Block IP after too many attempts
      if (attempt.count >= maxAttempts * 2) {
        this.blockedIPs.add(key);
      }
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: attempt.resetTime,
        requiresCaptcha: true,
      };
    }

    attempt.count++;
    attempt.lastAttempt = now;
    
    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - attempt.count),
      resetTime: attempt.resetTime,
      requiresCaptcha: attempt.count >= 3,
    };
  }

  private static getProgressiveDelay(attemptCount: number): number {
    // Progressive delays: 1s, 2s, 4s, 8s, 16s...
    return Math.min(1000 * Math.pow(2, attemptCount - 1), 30000);
  }

  static getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const now = Date.now();
    return Math.max(0, attempt.resetTime - now);
  }

  static reset(key: string): void {
    this.attempts.delete(key);
    this.blockedIPs.delete(key);
  }

  static isBlocked(key: string): boolean {
    return this.blockedIPs.has(key);
  }

  static getAttemptCount(key: string): number {
    const attempt = this.attempts.get(key);
    return attempt ? attempt.count : 0;
  }
}

// CSRF Protection utility
export class CSRFProtection {
  private static tokens: Map<string, { token: string; expires: number }> = new Map();
  private static readonly TOKEN_VALIDITY = 3600000; // 1 hour

  static generateToken(sessionId: string): string {
    const token = this.generateSecureToken();
    const expires = Date.now() + this.TOKEN_VALIDITY;
    
    this.tokens.set(sessionId, { token, expires });
    
    // Store in sessionStorage for client-side access
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', token);
    }
    
    return token;
  }

  static validateToken(sessionId: string, providedToken: string): boolean {
    const storedData = this.tokens.get(sessionId);
    
    if (!storedData) {
      return false;
    }

    const now = Date.now();
    if (now > storedData.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return storedData.token === providedToken;
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('csrf_token');
    }
    return null;
  }

  static clearToken(sessionId?: string): void {
    if (sessionId) {
      this.tokens.delete(sessionId);
    }
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf_token');
    }
  }

  private static generateSecureToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Session security utility
export class SessionSecurity {
  private static readonly MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static sessions: Map<string, { 
    created: number;
    lastActivity: number;
    fingerprint: string;
  }> = new Map();

  static createSession(_userId: string): string {
    const sessionId = this.generateSessionId();
    const fingerprint = this.generateFingerprint();
    
    this.sessions.set(sessionId, {
      created: Date.now(),
      lastActivity: Date.now(),
      fingerprint,
    });

    // Generate CSRF token for this session
    CSRFProtection.generateToken(sessionId);
    
    return sessionId;
  }

  static validateSession(sessionId: string): {
    valid: boolean;
    reason?: 'expired' | 'inactive' | 'invalid' | 'fingerprint_mismatch';
  } {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'invalid' };
    }

    const now = Date.now();
    
    // Check session expiration
    if (now - session.created > this.MAX_SESSION_DURATION) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'expired' };
    }

    // Check inactivity timeout
    if (now - session.lastActivity > this.INACTIVITY_TIMEOUT) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'inactive' };
    }

    // Check fingerprint (basic browser fingerprinting)
    const currentFingerprint = this.generateFingerprint();
    if (session.fingerprint !== currentFingerprint) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'fingerprint_mismatch' };
    }

    // Update last activity
    session.lastActivity = now;
    return { valid: true };
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
    CSRFProtection.clearToken(sessionId);
  }

  static invalidateSession(sessionId: string): void {
    this.destroySession(sessionId);
  }

  static refreshActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  private static generateSessionId(): string {
    return CSRFProtection['generateSecureToken']();
  }

  private static generateFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server-side';
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ];

    return btoa(components.join('|'));
  }
}