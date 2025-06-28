import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, mealPlansTable, pausedSubscriptionsTable } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
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

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders() }
      );
    }

    const userId = parseInt(session.user.id);

    // Fetch user's subscriptions with meal plan details
    const subscriptions = await db
      .select({
        id: subscriptionsTable.id,
        meal_plan_id: mealPlansTable.id,
        meal_plan_name: mealPlansTable.name,
        meal_plan_price: mealPlansTable.price_per_meal,
        meal_type: subscriptionsTable.meal_type,
        total_price: subscriptionsTable.total_price,
        allergies: subscriptionsTable.allergies,
        status: subscriptionsTable.status,
        created_at: subscriptionsTable.created_at,
      })
      .from(subscriptionsTable)
      .innerJoin(mealPlansTable, eq(subscriptionsTable.meal_plan_id, mealPlansTable.id))
      .where(eq(subscriptionsTable.user_id, userId));

    // Fetch delivery days and meal types for each subscription
    const subscriptionsWithDetails = await Promise.all(
      subscriptions.map(async (subscription) => {
        // Get delivery days
        const deliveryDays = await db
          .select({ day_of_the_week: deliveryDaysTable.day_of_the_week })
          .from(deliveryDaysTable)
          .where(eq(deliveryDaysTable.subscription_id, subscription.id));

        // Get pause information - look for any pause record for this subscription
        const pauseInfo = await db
          .select({
            start_date: pausedSubscriptionsTable.start_date,
            end_date: pausedSubscriptionsTable.end_date
          })
          .from(pausedSubscriptionsTable)
          .where(
            eq(pausedSubscriptionsTable.subscription_id, subscription.id)
          )
          .orderBy(pausedSubscriptionsTable.id)
          .limit(1);

        // Check if pause is currently active based on subscription status
        const isPaused = subscription.status === 'paused';
        const pausedUntil = isPaused && pauseInfo[0]?.end_date ? pauseInfo[0].end_date : null;

        // Get meal types (for now, try to parse from allergies field, fallback to single meal_type)
        let mealTypes = [subscription.meal_type.toString()];
        let actualAllergies = subscription.allergies;

        try {
          if (subscription.allergies) {
            const parsed = JSON.parse(subscription.allergies);
            if (parsed.meal_types && Array.isArray(parsed.meal_types)) {
              mealTypes = parsed.meal_types.map((mt: number) => mt.toString());
              actualAllergies = parsed.allergies;
            }
          }
        } catch (error) {
          // If parsing fails, keep original allergies and single meal type
          console.log('Failed to parse allergies JSON:', error);
        }

        return {
          ...subscription,
          allergies: actualAllergies,
          delivery_days: deliveryDays.map(d => d.day_of_the_week.toString()),
          meal_types: mealTypes,
          is_paused: isPaused,
          paused_until: pausedUntil
        };
      })
    );

    return NextResponse.json({
      subscriptions: subscriptionsWithDetails
    }, { headers: securityHeaders() });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
