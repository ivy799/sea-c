import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createRateLimiter } from '@/lib/security';

// Rate limiters for different endpoints
const authRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
const generalRateLimiter = createRateLimiter(50, 60 * 1000); // 50 requests per minute

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export async function validateCSRF(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { valid: false, error: 'Authentication required' };
  }

  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    return { valid: false, error: 'CSRF token missing' };
  }

  const userId = session.user.id;
  const storedToken = csrfTokens.get(userId);

  if (!storedToken || storedToken.expires < Date.now()) {
    return { valid: false, error: 'CSRF token expired' };
  }

  if (storedToken.token !== csrfToken) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  return { valid: true };
}

export function generateCSRFForUser(userId: string): string {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  csrfTokens.set(userId, {
    token,
    expires: Date.now() + 60 * 60 * 1000 // 1 hour
  });

  return token;
}

export function applyRateLimit(request: NextRequest, type: 'auth' | 'general' = 'general'): boolean {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const rateLimiter = type === 'auth' ? authRateLimiter : generalRateLimiter;
  return rateLimiter(clientIP);
}

export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  };
}
