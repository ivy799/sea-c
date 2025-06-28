import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateCSRFForUser, refreshCSRFToken, securityHeaders, applyRateLimit } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    if (!applyRateLimit(request, 'general')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: securityHeaders() }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders() }
      );
    }

    // Check if this is a refresh request
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // Generate or refresh CSRF token for the user
    const csrfToken = refresh 
      ? refreshCSRFToken(session.user.id)
      : generateCSRFForUser(session.user.id);

    return NextResponse.json(
      { csrfToken, refreshed: refresh },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
