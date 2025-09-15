// Authentication and Security Configuration
// This file centralizes all security settings for authentication endpoints

export const AuthSecurityConfig = {
  // Rate Limiting Configuration
  rateLimiting: {
    // Login attempts
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      progressiveDelay: true,
    },
    
    // Signup attempts
    signup: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      progressiveDelay: true,
    },
    
    // Password reset attempts
    passwordReset: {
      maxAttempts: 2,
      windowMs: 60 * 60 * 1000, // 1 hour
      progressiveDelay: true,
    },
    
    // Profile update attempts
    profileUpdate: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      progressiveDelay: false,
    },
    
    // General API rate limiting
    api: {
      maxAttempts: 100,
      windowMs: 60 * 60 * 1000, // 1 hour per IP
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
  },

  // Session Security Configuration
  session: {
    maxDuration: 8 * 60 * 60 * 1000, // 8 hours
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
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
  },

  // Account Security
  account: {
    maxFailedLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    enableTwoFactor: false, // Future feature
    passwordResetValidity: 15 * 60 * 1000, // 15 minutes
  },

  // Monitoring and Logging
  monitoring: {
    logFailedAttempts: true,
    logSuccessfulLogins: true,
    logRateLimitViolations: true,
    logSecurityEvents: true,
    alertOnSuspiciousActivity: true,
    suspiciousActivityThreshold: 10, // Failed attempts from same IP
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://*.supabase.co'],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
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
export const getAuthConfig = (environment: 'development' | 'production' = 'production') => {
  return {
    ...AuthSecurityConfig,
    ...AuthSecurityConfig[environment],
  };
};

export const getRateLimitConfig = (action: keyof typeof AuthSecurityConfig.rateLimiting) => {
  return AuthSecurityConfig.rateLimiting[action];
};

export const getSecurityLevel = (userRole: 'player' | 'organizer'): 'standard' | 'elevated' => {
  return userRole === 'organizer' ? 'elevated' : 'standard';
};

// Security event types for monitoring
export const SecurityEventTypes = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_CSRF_TOKEN: 'invalid_csrf_token',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SUSPICIOUS_LOGIN_PATTERN: 'suspicious_login_pattern',
  ACCOUNT_LOCKED: 'account_locked',
  PASSWORD_RESET_ABUSE: 'password_reset_abuse',
  MULTIPLE_FAILED_LOGINS: 'multiple_failed_logins',
} as const;

export type SecurityEventType = typeof SecurityEventTypes[keyof typeof SecurityEventTypes];

// Security metrics for monitoring dashboard
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