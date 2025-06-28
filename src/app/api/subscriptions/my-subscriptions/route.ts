import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, mealPlansTable, subscriptionMealTypesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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
        } catch (e) {
          // If parsing fails, keep original allergies and single meal type
        }

        return {
          ...subscription,
          allergies: actualAllergies,
          delivery_days: deliveryDays.map(d => d.day_of_the_week.toString()),
          meal_types: mealTypes
        };
      })
    );

    return NextResponse.json({
      subscriptions: subscriptionsWithDetails
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
