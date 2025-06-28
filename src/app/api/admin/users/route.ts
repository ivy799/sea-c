import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { usersTable, UserRole } from '@/db/schema';
import { applyRateLimit, securityHeaders } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    if (!applyRateLimit(request, 'general')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: securityHeaders() }
      );
    }

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: securityHeaders() }
      );
    }

    // Fetch all users
    const users = await db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        email: usersTable.email,
        phone_number: usersTable.phone_number,
        role: usersTable.role,
      })
      .from(usersTable)
      .orderBy(usersTable.id);

    return NextResponse.json({
      users
    }, { headers: securityHeaders() });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
