import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, usersTable, mealPlansTable, reactivateSubscriptionsTable } from '@/db/schema';
import { eq, and, gte, lte, sql, count, sum } from 'drizzle-orm';
import { validateCSRF, applyRateLimit, securityHeaders } from '@/lib/csrf';
import { UserRole } from '@/db/schema';

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
        { error: 'Access denied. Admin role required.' },
        { status: 403, headers: securityHeaders() }
      );
    }

    // Get date range from query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Default to last 30 days if no date range provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filterStartDate = startDate || defaultStartDate;
    const filterEndDate = endDate || defaultEndDate;

    console.log(`[ADMIN DASHBOARD] Fetching metrics for ${filterStartDate} to ${filterEndDate}`);

    // 1. New Subscriptions in date range
    const newSubscriptionsQuery = await db
      .select({ count: count() })
      .from(subscriptionsTable)
      .where(
        and(
          gte(sql`DATE(${subscriptionsTable.created_at})`, filterStartDate),
          lte(sql`DATE(${subscriptionsTable.created_at})`, filterEndDate)
        )
      );

    const newSubscriptions = newSubscriptionsQuery[0]?.count || 0;

    // 2. Monthly Recurring Revenue (MRR) - Sum of all active subscriptions
    const mrrQuery = await db
      .select({ 
        totalRevenue: sum(subscriptionsTable.total_price),
        count: count()
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, 'active'));

    const mrr = Number(mrrQuery[0]?.totalRevenue || 0);
    const activeSubscriptionsCount = Number(mrrQuery[0]?.count || 0);

    // 3. Reactivations - Count from reactivate_subscriptions table in date range
    const reactivationsQuery = await db
      .select({ count: count() })
      .from(reactivateSubscriptionsTable)
      .where(
        and(
          gte(sql`DATE(${reactivateSubscriptionsTable.reactivated_at})`, filterStartDate),
          lte(sql`DATE(${reactivateSubscriptionsTable.reactivated_at})`, filterEndDate)
        )
      );

    const reactivations = reactivationsQuery[0]?.count || 0;

    // 4. Total Subscription Growth (all subscriptions ever created)
    const totalSubscriptionsQuery = await db
      .select({ count: count() })
      .from(subscriptionsTable);

    const totalSubscriptions = totalSubscriptionsQuery[0]?.count || 0;

    // 5. Status breakdown
    const statusBreakdownQuery = await db
      .select({ 
        status: subscriptionsTable.status,
        count: count()
      })
      .from(subscriptionsTable)
      .groupBy(subscriptionsTable.status);

    const statusBreakdown = statusBreakdownQuery.reduce((acc, item) => {
      acc[item.status] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    // 6. Popular meal plans
    const popularPlansQuery = await db
      .select({
        meal_plan_name: mealPlansTable.name,
        count: count(),
        total_revenue: sum(subscriptionsTable.total_price)
      })
      .from(subscriptionsTable)
      .innerJoin(mealPlansTable, eq(subscriptionsTable.meal_plan_id, mealPlansTable.id))
      .where(eq(subscriptionsTable.status, 'active'))
      .groupBy(mealPlansTable.name)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    const popularPlans = popularPlansQuery.map(plan => ({
      name: plan.meal_plan_name,
      count: Number(plan.count),
      revenue: Number(plan.total_revenue || 0)
    }));

    // 7. Recent subscriptions for the period
    const recentSubscriptionsQuery = await db
      .select({
        id: subscriptionsTable.id,
        user_name: usersTable.full_name,
        meal_plan_name: mealPlansTable.name,
        total_price: subscriptionsTable.total_price,
        status: subscriptionsTable.status
      })
      .from(subscriptionsTable)
      .innerJoin(usersTable, eq(subscriptionsTable.user_id, usersTable.id))
      .innerJoin(mealPlansTable, eq(subscriptionsTable.meal_plan_id, mealPlansTable.id))
      .where(
        and(
          gte(sql`DATE(${subscriptionsTable.created_at})`, filterStartDate),
          lte(sql`DATE(${subscriptionsTable.created_at})`, filterEndDate)
        )
      )
      .orderBy(sql`${subscriptionsTable.created_at} DESC`)
      .limit(10);

    // Calculate growth percentage (comparing to previous period)
    const periodDays = Math.ceil((new Date(filterEndDate).getTime() - new Date(filterStartDate).getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(new Date(filterStartDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousEndDate = new Date(new Date(filterStartDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const previousNewSubscriptionsQuery = await db
      .select({ count: count() })
      .from(subscriptionsTable)
      .where(
        and(
          gte(sql`DATE(${subscriptionsTable.created_at})`, previousStartDate),
          lte(sql`DATE(${subscriptionsTable.created_at})`, previousEndDate)
        )
      );

    const previousNewSubscriptions = previousNewSubscriptionsQuery[0]?.count || 0;
    const growthPercentage = previousNewSubscriptions > 0 
      ? ((newSubscriptions - previousNewSubscriptions) / previousNewSubscriptions) * 100 
      : 0;

    const dashboardData = {
      dateRange: {
        startDate: filterStartDate,
        endDate: filterEndDate
      },
      metrics: {
        newSubscriptions: Number(newSubscriptions),
        mrr: mrr,
        reactivations: Number(reactivations),
        activeSubscriptions: activeSubscriptionsCount,
        totalSubscriptions: Number(totalSubscriptions),
        growthPercentage: Math.round(growthPercentage * 100) / 100
      },
      statusBreakdown,
      popularPlans,
      recentSubscriptions: recentSubscriptionsQuery
    };

    console.log(`[ADMIN DASHBOARD] Metrics calculated:`, dashboardData.metrics);

    return NextResponse.json(
      { success: true, data: dashboardData },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
