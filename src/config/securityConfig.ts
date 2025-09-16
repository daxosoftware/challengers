// Consolidated Security Configuration
// This file centralizes all security settings, event types, and monitoring configuration

// Security Event Types
export const SecurityEventTypes = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  REGISTRATION_SUCCESS: 'registration_success',
  REGISTRATION_FAILED: 'registration_failed',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  
  // Security Violations
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_CSRF_TOKEN: 'invalid_csrf_token',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SUSPICIOUS_LOGIN_PATTERN: 'suspicious_login_pattern',
  MULTIPLE_FAILED_LOGINS: 'multiple_failed_logins',
  
  // Account Security
  ACCOUNT_LOCKED: 'account_locked',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SESSION_EXPIRED: 'session_expired',
  PASSWORD_RESET_ABUSE: 'password_reset_abuse',
  
  // Tournament Events
  TOURNAMENT_STARTED: 'tournament_started',
  MATCH_REMINDER: 'match_reminder',
  TOURNAMENT_JOINED: 'tournament_joined',
  TOURNAMENT_UPDATE: 'tournament_update',
  MATCH_START: 'match_start',
  MATCH_RESULT: 'match_result',
  GENERAL: 'general',
} as const;

export type SecurityEventType = typeof SecurityEventTypes[keyof typeof SecurityEventTypes];

// Security Metrics Interface
export interface SecurityMetrics {
  failedLoginAttempts: number;
  rateLimitViolations: number;
  csrfTokenFailures: number;
  sessionHijackAttempts: number;
  activeUserSessions: number;
  blockedIPs: number;
  suspiciousActivities: number;
  accountLockouts: number;
}

// Default security metrics
export const defaultSecurityMetrics: SecurityMetrics = {
  failedLoginAttempts: 0,
  rateLimitViolations: 0,
  csrfTokenFailures: 0,
  sessionHijackAttempts: 0,
  activeUserSessions: 0,
  blockedIPs: 0,
  suspiciousActivities: 0,
  accountLockouts: 0,
};

// Security Event Interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

// Consolidated Security Configuration
export const SecurityConfig = {
  // Rate Limiting Configuration
  rateLimiting: {
    // Login attempts
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 15 * 60 * 1000, // 15 minutes
      progressiveDelay: true,
    },
    
    // Signup attempts
    signup: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 30 * 60 * 1000, // 30 minutes
      progressiveDelay: true,
    },
    
    // Password reset attempts
    passwordReset: {
      maxAttempts: 2,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 60 * 60 * 1000, // 1 hour
      progressiveDelay: true,
    },
    
    // Profile update attempts
    profileUpdate: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDuration: 5 * 60 * 1000, // 5 minutes
      progressiveDelay: false,
    },
    
    // General API rate limiting
    api: {
      maxAttempts: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 5 * 60 * 1000, // 5 minutes
      progressiveDelay: false,
    },
  },

  // CSRF Protection Configuration
  csrf: {
    tokenValidity: 60 * 60 * 1000, // 1 hour
    tokenLength: 32, // bytes
    rotateOnAction: true,
    enforceOnMutations: true,
    exemptPaths: ['/api/health', '/api/status'],
    headerName: 'X-CSRF-Token',
    cookieName: 'csrf_token',
  },

  // Session Security Configuration
  session: {
    maxDuration: 8 * 60 * 60 * 1000, // 8 hours
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    renewalThreshold: 60 * 60 * 1000, // 1 hour before expiry
    fingerprintValidation: true,
    rotateOnPrivilegeEscalation: true,
    concurrentSessionLimit: 3,
  },

  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    preventCommonPasswords: true,
    preventReuse: 5, // Last 5 passwords
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Account Security
  account: {
    maxFailedLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    enableTwoFactor: false, // Future feature
    passwordResetValidity: 15 * 60 * 1000, // 15 minutes
  },

  // Content Security
  content: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxImageDimensions: { width: 2048, height: 2048 },
    sanitization: {
      allowedTags: [],
      allowedAttributes: {},
    },
  },

  // API Security
  api: {
    timeoutMs: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    maxResponseSize: 50 * 1024 * 1024, // 50MB
  },

  // Monitoring and Logging
  monitoring: {
    enableSecurityLogs: true,
    logFailedAttempts: true,
    logSuccessfulLogins: true,
    logRateLimitViolations: true,
    logSecurityEvents: true,
    alertOnSuspiciousActivity: true,
    suspiciousActivityThreshold: 10, // Failed attempts from same IP
    maxLogEntries: 10000,
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
    },
  },

  // Input Validation
  validation: {
    email: {
      maxLength: 320,
      allowPlusAddressing: true,
      blacklistedDomains: ['10minutemail.com', 'guerrillamail.com'],
    },
    username: {
      minLength: 3,
      maxLength: 20,
      allowedChars: /^[a-zA-Z0-9_-]+$/,
      reservedNames: ['admin', 'root', 'system', 'api', 'www'],
    },
  },

  // Environment-specific settings
  development: {
    disableRateLimiting: false,
    logVerbose: true,
    allowInsecureConnections: false,
  },

  production: {
    enforceHTTPS: true,
    enableHSTS: true,
    logLevel: 'warn',
    enableSecurityHeaders: true,
  },
};

// Helper functions for accessing configuration
export const getSecurityConfig = (environment: 'development' | 'production' = 'production') => {
  return {
    ...SecurityConfig,
    ...SecurityConfig[environment],
  };
};

export const getRateLimitConfig = (action: keyof typeof SecurityConfig.rateLimiting) => {
  return SecurityConfig.rateLimiting[action];
};

export const getSecurityLevel = (userRole: 'player' | 'organizer'): 'standard' | 'elevated' => {
  return userRole === 'organizer' ? 'elevated' : 'standard';
};

// Security Headers for enhanced protection
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

// Security utility functions
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