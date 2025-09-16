import React from 'react';
import { SecurityEventType, SecurityEventTypes, SecurityMetrics, defaultSecurityMetrics } from '../config/authSecurity';

// Security event data structure
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

// Security monitoring class
export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static metrics: SecurityMetrics = { ...defaultSecurityMetrics };
  private static listeners: ((event: SecurityEvent) => void)[] = [];
  private static maxEvents = 1000; // Keep last 1000 events in memory

  // Log a security event
  static logEvent(
    type: SecurityEventType,
    details: Record<string, any> = {},
    severity: SecurityEvent['severity'] = 'medium',
    userId?: string
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      userId,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
      details,
      severity,
      resolved: false,
    };

    // Add to events array
    this.events.push(event);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update metrics
    this.updateMetrics(event);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Security monitor listener error:', error);
        }
        // In production, silently continue or send to error monitoring service
      }
    });

    // Console log for development only
    if (import.meta.env.DEV) {
      console.warn(`[SECURITY] ${type}:`, details);
    }

    // Handle critical events immediately
    if (severity === 'critical') {
      this.handleCriticalEvent(event);
    }
  }

  // Update security metrics
  private static updateMetrics(event: SecurityEvent): void {
    switch (event.type) {
      case SecurityEventTypes.RATE_LIMIT_EXCEEDED:
        this.metrics.rateLimitViolations++;
        break;
      case SecurityEventTypes.INVALID_CSRF_TOKEN:
        this.metrics.csrfTokenFailures++;
        break;
      case SecurityEventTypes.SESSION_HIJACK_ATTEMPT:
        this.metrics.sessionHijackAttempts++;
        break;
      case SecurityEventTypes.BRUTE_FORCE_ATTEMPT:
      case SecurityEventTypes.MULTIPLE_FAILED_LOGINS:
        this.metrics.failedLoginAttempts++;
        break;
      case SecurityEventTypes.ACCOUNT_LOCKED:
        this.metrics.accountLockouts++;
        break;
      case SecurityEventTypes.SUSPICIOUS_LOGIN_PATTERN:
        this.metrics.suspiciousActivities++;
        break;
    }
  }

  // Handle critical security events
  private static handleCriticalEvent(event: SecurityEvent): void {
    // In a real application, this would trigger alerts, notifications, etc.
    console.error('[CRITICAL SECURITY EVENT]', event);
    
    // Auto-block IP for critical events
    if (event.ip && (
      event.type === SecurityEventTypes.BRUTE_FORCE_ATTEMPT ||
      event.type === SecurityEventTypes.SESSION_HIJACK_ATTEMPT
    )) {
      this.blockIP(event.ip, 'Critical security event detected');
    }
  }

  // Block an IP address
  private static blockIP(ip: string, reason: string): void {
    // This would integrate with your firewall/proxy in production
    console.warn(`[SECURITY] Blocking IP ${ip}: ${reason}`);
    this.metrics.blockedIPs++;
  }

  // Get recent security events
  static getRecentEvents(
    limit: number = 50,
    severity?: SecurityEvent['severity'],
    type?: SecurityEventType
  ): SecurityEvent[] {
    let filtered = this.events;

    if (severity) {
      filtered = filtered.filter(event => event.severity === severity);
    }

    if (type) {
      filtered = filtered.filter(event => event.type === type);
    }

    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get security metrics
  static getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  // Reset metrics (useful for testing or periodic resets)
  static resetMetrics(): void {
    this.metrics = { ...defaultSecurityMetrics };
  }

  // Add event listener
  static addListener(listener: (event: SecurityEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Generate unique event ID
  private static generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get client IP (simplified for client-side)
  private static getClientIP(): string {
    // In a real application, this would be set by the server
    return 'client-side';
  }

  // Get user agent
  private static getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  // Check for suspicious patterns
  static detectSuspiciousActivity(userId?: string, ip?: string): boolean {
    const recentEvents = this.getRecentEvents(100);
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const currentTime = Date.now();

    // Check for multiple failed attempts from same IP
    if (ip) {
      const failedAttemptsFromIP = recentEvents.filter(
        event => 
          event.ip === ip &&
          event.timestamp > (currentTime - timeWindow) &&
          (event.type === SecurityEventTypes.BRUTE_FORCE_ATTEMPT ||
           event.type === SecurityEventTypes.MULTIPLE_FAILED_LOGINS)
      );

      if (failedAttemptsFromIP.length >= 5) {
        this.logEvent(
          SecurityEventTypes.SUSPICIOUS_LOGIN_PATTERN,
          { ip, failedAttempts: failedAttemptsFromIP.length },
          'high'
        );
        return true;
      }
    }

    // Check for rapid requests from same user
    if (userId) {
      const userEvents = recentEvents.filter(
        event => 
          event.userId === userId &&
          event.timestamp > (currentTime - (5 * 60 * 1000)) // 5 minutes
      );

      if (userEvents.length >= 20) {
        this.logEvent(
          SecurityEventTypes.SUSPICIOUS_LOGIN_PATTERN,
          { userId, eventsCount: userEvents.length },
          'medium'
        );
        return true;
      }
    }

    return false;
  }

  // Generate security report
  static generateSecurityReport(): {
    summary: SecurityMetrics;
    recentEvents: SecurityEvent[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recentEvents = this.getRecentEvents(20);
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.failedLoginAttempts > 50) {
      recommendations.push('High number of failed login attempts detected. Consider implementing stricter rate limiting.');
    }

    if (metrics.csrfTokenFailures > 10) {
      recommendations.push('Multiple CSRF token failures detected. Check for potential attacks or client-side issues.');
    }

    if (metrics.sessionHijackAttempts > 0) {
      recommendations.push('Session hijack attempts detected. Review session security implementation.');
    }

    if (metrics.rateLimitViolations > 100) {
      recommendations.push('High rate limit violations. Consider adjusting rate limiting thresholds or blocking aggressive IPs.');
    }

    return {
      summary: metrics,
      recentEvents,
      recommendations,
    };
  }

  // Clear old events (useful for memory management)
  static clearOldEvents(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }
}

// React hook for monitoring security events
export const useSecurityMonitor = () => {
  const [events, setEvents] = React.useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = React.useState<SecurityMetrics>(defaultSecurityMetrics);

  React.useEffect(() => {
    // Initial load
    setEvents(SecurityMonitor.getRecentEvents(50));
    setMetrics(SecurityMonitor.getMetrics());

    // Listen for new events
    const unsubscribe = SecurityMonitor.addListener((event) => {
      setEvents(prev => [event, ...prev.slice(0, 49)]);
      setMetrics(SecurityMonitor.getMetrics());
    });

    return unsubscribe;
  }, []);

  return {
    events,
    metrics,
    generateReport: SecurityMonitor.generateSecurityReport,
    detectSuspiciousActivity: SecurityMonitor.detectSuspiciousActivity,
  };
};

// Export for use in other components
export { SecurityEventTypes };

// Helper functions for common security checks
export const securityHelpers = {
  // Check if user should be presented with CAPTCHA
  shouldRequireCaptcha: (userId?: string, ip?: string): boolean => {
    const recentEvents = SecurityMonitor.getRecentEvents(10);
    const failedAttempts = recentEvents.filter(
      event => 
        (userId && event.userId === userId) ||
        (ip && event.ip === ip) &&
        event.type === SecurityEventTypes.MULTIPLE_FAILED_LOGINS
    );
    
    return failedAttempts.length >= 3;
  },

  // Log authentication attempt
  logAuthAttempt: (success: boolean, userId?: string, details: Record<string, any> = {}): void => {
    if (!success) {
      SecurityMonitor.logEvent(
        SecurityEventTypes.MULTIPLE_FAILED_LOGINS,
        { ...details, success },
        'medium',
        userId
      );
    }
  },

  // Log rate limit violation
  logRateLimitViolation: (action: string, userId?: string): void => {
    SecurityMonitor.logEvent(
      SecurityEventTypes.RATE_LIMIT_EXCEEDED,
      { action },
      'medium',
      userId
    );
  },

  // Log CSRF violation
  logCSRFViolation: (userId?: string): void => {
    SecurityMonitor.logEvent(
      SecurityEventTypes.INVALID_CSRF_TOKEN,
      {},
      'high',
      userId
    );
  },
};