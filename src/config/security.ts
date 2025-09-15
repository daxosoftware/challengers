export const SecurityConfig = {
  // Rate limiting configuration
  rateLimiting: {
    auth: {
      maxAttempts: 5,
      windowMs: 300000, // 5 minutes
      blockDuration: 900000, // 15 minutes
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 3600000, // 1 hour
      blockDuration: 3600000, // 1 hour
    },
    registration: {
      maxAttempts: 3,
      windowMs: 3600000, // 1 hour
      blockDuration: 1800000, // 30 minutes
    },
    api: {
      maxAttempts: 100,
      windowMs: 900000, // 15 minutes
      blockDuration: 300000, // 5 minutes
    },
  },

  // Session configuration
  session: {
    maxDuration: 8 * 60 * 60 * 1000, // 8 hours
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    renewalThreshold: 60 * 60 * 1000, // 1 hour before expiry
  },

  // CSRF protection
  csrf: {
    tokenValidity: 3600000, // 1 hour
    headerName: 'X-CSRF-Token',
    cookieName: 'csrf_token',
  },

  // Password policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes
  },

  // Content security
  content: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxImageDimensions: { width: 2048, height: 2048 },
    sanitization: {
      allowedTags: [],
      allowedAttributes: {},
    },
  },

  // API security
  api: {
    timeoutMs: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    maxResponseSize: 50 * 1024 * 1024, // 50MB
  },

  // Monitoring and logging
  monitoring: {
    enableSecurityLogs: true,
    logFailedAttempts: true,
    logSuccessfulLogins: true,
    logRateLimitExceeded: true,
    maxLogEntries: 10000,
  },
} as const;

// Security headers for enhanced protection
export const SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
};

// Security event types for monitoring
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  REGISTRATION_SUCCESS = 'registration_success',
  REGISTRATION_FAILED = 'registration_failed',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch',
  SESSION_EXPIRED = 'session_expired',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  details?: Record<string, any>;
}

// Security monitoring utility
export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = SecurityConfig.monitoring.maxLogEntries;

  static logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    if (!SecurityConfig.monitoring.enableSecurityLogs) {
      return;
    }

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Add client-side context if available
    if (typeof window !== 'undefined') {
      securityEvent.userAgent = navigator.userAgent;
      securityEvent.ipAddress = 'client-side'; // Would be set by server
    }

    this.events.push(securityEvent);

    // Maintain maximum number of events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Console log for development
    if (import.meta.env.DEV) {
      console.log(`[Security Event] ${event.type}:`, securityEvent);
    }
  }

  static getEvents(filter?: {
    type?: SecurityEventType;
    userId?: string;
    since?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filter.type);
      }
      if (filter.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filter.userId);
      }
      if (filter.since) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filter.since!);
      }
      if (filter.limit) {
        filteredEvents = filteredEvents.slice(-filter.limit);
      }
    }

    return filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
  }

  static clearEvents(): void {
    this.events = [];
  }

  static getSecuritySummary(): {
    totalEvents: number;
    recentFailedLogins: number;
    rateLimitExceeded: number;
    suspiciousActivity: number;
  } {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(e => e.timestamp >= last24Hours);

    return {
      totalEvents: this.events.length,
      recentFailedLogins: recentEvents.filter(e => e.type === SecurityEventType.LOGIN_FAILED).length,
      rateLimitExceeded: recentEvents.filter(e => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED).length,
      suspiciousActivity: recentEvents.filter(e => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY).length,
    };
  }
}

// Utility functions for security checks
export const SecurityUtils = {
  // Generate a secure client identifier
  generateClientId(): string {
    if (typeof window === 'undefined') return 'server';
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ];
    
    return btoa(components.join('|')).substring(0, 32);
  },

  // Check if the current environment is secure
  isSecureContext(): boolean {
    if (typeof window === 'undefined') return true;
    return window.isSecureContext || location.protocol === 'https:';
  },

  // Validate request origin (for CSRF protection)
  validateOrigin(origin?: string): boolean {
    if (typeof window === 'undefined') return true;
    
    const allowedOrigins = [
      window.location.origin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    
    return !origin || allowedOrigins.includes(origin);
  },

  // Check for potential bot behavior
  detectBotBehavior(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Simple bot detection heuristics
    const suspiciousPatterns = [
      !window.navigator.webdriver === undefined,
      window.navigator.languages?.length === 0,
      /bot|crawler|spider/i.test(window.navigator.userAgent),
      window.outerHeight === 0 || window.outerWidth === 0,
    ];
    
    return suspiciousPatterns.filter(Boolean).length >= 2;
  },
};