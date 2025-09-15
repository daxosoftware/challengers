import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Validator, 
  ValidationSchemas, 
  ValidationPatterns,
  DataSanitizer,
  RateLimiter 
} from '../validation';

describe('Validator', () => {
  it('validates required fields correctly', () => {
    const schema = {
      name: { required: true },
      email: { required: true },
    };

    const validData = { name: 'Test', email: 'test@example.com' };
    const invalidData = { name: '', email: '' };

    const validResult = Validator.validate(validData, schema);
    const invalidResult = Validator.validate(invalidData, schema);

    expect(validResult.isValid).toBe(true);
    expect(Object.keys(validResult.errors)).toHaveLength(0);

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.name).toBeDefined();
    expect(invalidResult.errors.email).toBeDefined();
  });

  it('validates minLength correctly', () => {
    const schema = {
      username: { minLength: 3 },
    };

    const validData = { username: 'test' };
    const invalidData = { username: 'ab' };

    const validResult = Validator.validate(validData, schema);
    const invalidResult = Validator.validate(invalidData, schema);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.username).toContain('3 caractères');
  });

  it('validates maxLength correctly', () => {
    const schema = {
      name: { maxLength: 10 },
    };

    const validData = { name: 'short' };
    const invalidData = { name: 'this is a very long name' };

    const validResult = Validator.validate(validData, schema);
    const invalidResult = Validator.validate(invalidData, schema);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.name).toContain('10 caractères');
  });

  it('validates patterns correctly', () => {
    const schema = {
      email: { pattern: ValidationPatterns.email },
    };

    const validData = { email: 'test@example.com' };
    const invalidData = { email: 'invalid-email' };

    const validResult = Validator.validate(validData, schema);
    const invalidResult = Validator.validate(invalidData, schema);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.email).toContain('format invalide');
  });

  it('validates custom rules correctly', () => {
    const schema = {
      age: {
        custom: (value: any) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 18) {
            return 'Age must be at least 18';
          }
          return null;
        },
      },
    };

    const validData = { age: '25' };
    const invalidData = { age: '15' };

    const validResult = Validator.validate(validData, schema);
    const invalidResult = Validator.validate(invalidData, schema);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.age).toBe('Age must be at least 18');
  });

  it('skips validation for non-required empty fields', () => {
    const schema = {
      optional: { minLength: 5 },
    };

    const data = { optional: '' };
    const result = Validator.validate(data, schema);

    expect(result.isValid).toBe(true);
  });

  it('handles undefined and null values correctly', () => {
    const schema = {
      field1: { required: true },
      field2: { minLength: 3 },
    };

    const data = { field1: null, field2: undefined };
    const result = Validator.validate(data, schema);

    expect(result.isValid).toBe(false);
    expect(result.errors.field1).toBeDefined();
    expect(result.errors.field2).toBeUndefined(); // Not required, so no error
  });
});

describe('ValidationPatterns', () => {
  it('email pattern validates correctly', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@example.org',
    ];

    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
    ];

    validEmails.forEach(email => {
      expect(ValidationPatterns.email.test(email)).toBe(true);
    });

    invalidEmails.forEach(email => {
      expect(ValidationPatterns.email.test(email)).toBe(false);
    });
  });

  it('password pattern validates correctly', () => {
    const validPasswords = [
      'Password123',
      'MySecure1Pass',
      'Test123@',
    ];

    const invalidPasswords = [
      'password', // no uppercase or number
      'PASSWORD123', // no lowercase
      'Password', // no number
      '12345678', // no letters
      'Pass1', // too short
    ];

    validPasswords.forEach(password => {
      expect(ValidationPatterns.password.test(password)).toBe(true);
    });

    invalidPasswords.forEach(password => {
      expect(ValidationPatterns.password.test(password)).toBe(false);
    });
  });

  it('username pattern validates correctly', () => {
    const validUsernames = [
      'test',
      'user123',
      'my_username',
      'user-name',
    ];

    const invalidUsernames = [
      'a', // too short
      'user name', // space
      'user@name', // special char
      'very_long_username_that_exceeds_limit',
    ];

    validUsernames.forEach(username => {
      expect(ValidationPatterns.username.test(username)).toBe(true);
    });

    invalidUsernames.forEach(username => {
      expect(ValidationPatterns.username.test(username)).toBe(false);
    });
  });
});

describe('ValidationSchemas', () => {
  it('auth schema validates correctly', () => {
    const validAuthData = {
      email: 'test@example.com',
      password: 'MyPassword123',
      username: 'testuser',
    };

    const result = Validator.validate(validAuthData, ValidationSchemas.auth);
    expect(result.isValid).toBe(true);
  });

  it('tournament schema validates correctly', () => {
    const validTournamentData = {
      name: 'My Tournament',
      maxParticipants: 16,
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    };

    const result = Validator.validate(validTournamentData, ValidationSchemas.tournament);
    expect(result.isValid).toBe(true);
  });

  it('tournament schema rejects past dates', () => {
    const invalidTournamentData = {
      name: 'My Tournament',
      maxParticipants: 16,
      startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    };

    const result = Validator.validate(invalidTournamentData, ValidationSchemas.tournament);
    expect(result.isValid).toBe(false);
    expect(result.errors.startDate).toContain('futur');
  });

  it('tournament schema validates participant limits', () => {
    const invalidTournamentData = {
      name: 'My Tournament',
      maxParticipants: 1, // Too few
    };

    const result = Validator.validate(invalidTournamentData, ValidationSchemas.tournament);
    expect(result.isValid).toBe(false);
    expect(result.errors.maxParticipants).toContain('au moins 2');
  });
});

describe('DataSanitizer', () => {
  it('sanitizes strings correctly', () => {
    const dirtyString = '  <script>alert("xss")</script>Hello World!  ';
    const cleaned = DataSanitizer.sanitizeString(dirtyString);
    
    expect(cleaned).toBe('Hello World!');
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('alert');
  });

  it('escapes HTML characters', () => {
    const htmlString = '<div>Hello & "World"</div>';
    const cleaned = DataSanitizer.sanitizeString(htmlString);
    
    expect(cleaned).toBe('Hello &amp; &quot;World&quot;');
  });

  it('sanitizes email correctly', () => {
    const dirtyEmail = '  Test@EXAMPLE.COM  ';
    const cleaned = DataSanitizer.sanitizeEmail(dirtyEmail);
    
    expect(cleaned).toBe('test@example.com');
  });

  it('sanitizes numbers correctly', () => {
    expect(DataSanitizer.sanitizeNumber('123.45')).toBe(123.45);
    expect(DataSanitizer.sanitizeNumber('invalid')).toBeNull();
    expect(DataSanitizer.sanitizeNumber('')).toBeNull();
  });

  it('sanitizes integers correctly', () => {
    expect(DataSanitizer.sanitizeInteger('123')).toBe(123);
    expect(DataSanitizer.sanitizeInteger('123.45')).toBe(123);
    expect(DataSanitizer.sanitizeInteger('invalid')).toBeNull();
  });

  it('sanitizes booleans correctly', () => {
    expect(DataSanitizer.sanitizeBoolean(true)).toBe(true);
    expect(DataSanitizer.sanitizeBoolean('true')).toBe(true);
    expect(DataSanitizer.sanitizeBoolean(1)).toBe(true);
    expect(DataSanitizer.sanitizeBoolean(false)).toBe(false);
    expect(DataSanitizer.sanitizeBoolean('')).toBe(false);
    expect(DataSanitizer.sanitizeBoolean(0)).toBe(false);
  });

  it('sanitizes objects according to schema', () => {
    const dirtyObject = {
      name: '  <script>Evil</script>John Doe  ',
      email: '  JOHN@EXAMPLE.COM  ',
      age: '25',
      active: 'true',
      score: '123.45',
    };

    const schema = {
      name: 'string' as const,
      email: 'email' as const,
      age: 'integer' as const,
      active: 'boolean' as const,
      score: 'number' as const,
    };

    const cleaned = DataSanitizer.sanitizeObject(dirtyObject, schema);

    expect(cleaned.name).toBe('John Doe');
    expect(cleaned.email).toBe('john@example.com');
    expect(cleaned.age).toBe(25);
    expect(cleaned.active).toBe(true);
    expect(cleaned.score).toBe(123.45);
  });

  it('handles missing properties in object sanitization', () => {
    const object = { name: 'John' };
    const schema = { name: 'string' as const, email: 'email' as const };
    
    const cleaned = DataSanitizer.sanitizeObject(object, schema);
    
    expect(cleaned.name).toBe('John');
    expect(cleaned.email).toBeUndefined();
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear rate limiter state
    (RateLimiter as any).attempts.clear();
  });

  it('allows requests within limit', () => {
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(true);
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(true);
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(true);
  });

  it('blocks requests over limit', () => {
    // Use up the limit
    for (let i = 0; i < 3; i++) {
      expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(true);
    }
    
    // Should now be blocked
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(false);
  });

  it('resets after time window', () => {
    // Use up the limit with short window
    const windowMs = 100;
    for (let i = 0; i < 3; i++) {
      expect(RateLimiter.isAllowed('test', 3, windowMs).allowed).toBe(true);
    }
    
    expect(RateLimiter.isAllowed('test', 3, windowMs).allowed).toBe(false);
    
    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(RateLimiter.isAllowed('test', 3, windowMs).allowed).toBe(true);
        resolve();
      }, windowMs + 10);
    });
  });

  it('tracks different keys separately', () => {
    expect(RateLimiter.isAllowed('key1', 2, 60000).allowed).toBe(true);
    expect(RateLimiter.isAllowed('key2', 2, 60000).allowed).toBe(true);
    expect(RateLimiter.isAllowed('key1', 2, 60000).allowed).toBe(true);
    expect(RateLimiter.isAllowed('key2', 2, 60000).allowed).toBe(true);
    
    // Both keys should now be at limit
    expect(RateLimiter.isAllowed('key1', 2, 60000).allowed).toBe(false);
    expect(RateLimiter.isAllowed('key2', 2, 60000).allowed).toBe(false);
  });

  it('returns correct remaining time', () => {
    const windowMs = 1000;
    
    // First request
    RateLimiter.isAllowed('test', 1, windowMs);
    
    const remainingTime = RateLimiter.getRemainingTime('test');
    expect(remainingTime).toBeGreaterThan(0);
    expect(remainingTime).toBeLessThanOrEqual(windowMs);
  });

  it('resets rate limit for specific key', () => {
    // Use up limit
    for (let i = 0; i < 3; i++) {
      RateLimiter.isAllowed('test', 3, 60000);
    }
    
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(false);
    
    // Reset
    RateLimiter.reset('test');
    
    expect(RateLimiter.isAllowed('test', 3, 60000).allowed).toBe(true);
  });

  it('returns 0 remaining time for non-existent key', () => {
    expect(RateLimiter.getRemainingTime('nonexistent')).toBe(0);
  });
});