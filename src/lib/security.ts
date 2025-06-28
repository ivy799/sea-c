/**
 * Security utilities for input validation and sanitization
 */

// XSS Prevention - Escape HTML characters
export function escapeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Simple HTML sanitization without external dependencies
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&lt;script[^&]*&gt;.*?&lt;\/script&gt;/gi, '') // Remove script tags
    .trim();
}

// Input validation functions
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  phone: (phone: string): boolean => {
    // Remove all non-numeric characters for validation
    const cleaned = phone.replace(/\D/g, '');
    // Accept phone numbers between 10-15 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  name: (name: string): boolean => {
    // Allow letters, spaces, hyphens, and apostrophes only
    const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
    return nameRegex.test(name.trim());
  },

  password: (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  allergies: (allergies: string): boolean => {
    // Allow letters, spaces, commas, and common punctuation
    const allergiesRegex = /^[a-zA-Z\s,.\-()]*$/;
    return allergies.length <= 500 && allergiesRegex.test(allergies);
  },

  // Check for common SQL injection patterns
  sqlInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /('|"|`)/
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  },

  // Check for XSS patterns
  xss: (input: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi,
      /<[^>]*javascript[^>]*>/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];
    
    return !xssPatterns.some(pattern => pattern.test(input));
  }
};

// Comprehensive input sanitization
export function sanitizeInput(input: string, type: 'text' | 'email' | 'phone' | 'name' | 'allergies' = 'text'): string {
  if (!input) return '';
  
  // First, escape HTML to prevent XSS
  let sanitized = escapeHtml(input.trim());
  
  // Remove any remaining potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  // Type-specific sanitization
  switch (type) {
    case 'email':
      // Keep only valid email characters
      sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
      break;
    case 'phone':
      // Keep only numbers, spaces, parentheses, hyphens, and plus sign
      sanitized = sanitized.replace(/[^0-9\s()\-+]/g, '');
      break;
    case 'name':
      // Keep only letters, spaces, hyphens, and apostrophes
      sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '');
      break;
    case 'allergies':
      // Keep letters, numbers, spaces, commas, periods, hyphens, and parentheses
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s,.\-()]/g, '');
      break;
    default:
      // For general text, remove special characters that could be dangerous
      sanitized = sanitized.replace(/[<>'";&=]/g, '');
  }
  
  return sanitized;
}

// Validate form data comprehensively
export function validateFormData(data: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Check each field for security issues
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Check for XSS
      if (!validators.xss(value)) {
        errors[key] = 'Invalid characters detected. Please remove any script tags or JavaScript code.';
      }
      
      // Check for SQL injection
      if (!validators.sqlInjection(value)) {
        errors[key] = 'Invalid characters detected. Please avoid using SQL keywords or special characters.';
      }
    }
  });
  
  // Field-specific validation
  if (data.email && typeof data.email === 'string' && !validators.email(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  
  if (data.phone && typeof data.phone === 'string' && !validators.phone(data.phone)) {
    errors.phone = 'Please enter a valid phone number (10-15 digits).';
  }
  
  if (data.name && typeof data.name === 'string' && !validators.name(data.name)) {
    errors.name = 'Name should only contain letters, spaces, hyphens, and apostrophes (2-50 characters).';
  }
  
  if (data.password && typeof data.password === 'string' && !validators.password(data.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
  }
  
  if (data.allergies && typeof data.allergies === 'string' && !validators.allergies(data.allergies)) {
    errors.allergies = 'Allergies field contains invalid characters or is too long (max 500 characters).';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate CSRF token (to be implemented with session storage)
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// Rate limiting helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    return true;
  };
}
