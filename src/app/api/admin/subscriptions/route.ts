import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, usersTable, mealPlansTable, UserRole } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    // Fetch all subscriptions with user and meal plan details
    const subscriptions = await db
      .select({
        id: subscriptionsTable.id,
        user_name: usersTable.full_name,
        meal_plan_name: mealPlansTable.name,
        total_price: subscriptionsTable.total_price,
        status: subscriptionsTable.status,
        created_at: subscriptionsTable.created_at,
      })
      .from(subscriptionsTable)
      .innerJoin(usersTable, eq(subscriptionsTable.user_id, usersTable.id))
      .innerJoin(mealPlansTable, eq(subscriptionsTable.meal_plan_id, mealPlansTable.id))
      .orderBy(subscriptionsTable.created_at);

    return NextResponse.json({
      subscriptions
    }, { headers: securityHeaders() });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
