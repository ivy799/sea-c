import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, mealPlansTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Add retry function for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if it's a connection timeout error
      const isTimeoutError = error instanceof Error && 
        (error.message.includes('timeout') || 
         error.message.includes('connect') ||
         error.message.includes('ECONNRESET'));
      
      if (isTimeoutError) {
        console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Non-timeout errors should not be retried
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Mapping for meal types
const MEAL_TYPE_MAP = {
  'breakfast': 0,
  'lunch': 1, 
  'dinner': 2,
} as const;

// Mapping for days of week
const DAY_OF_WEEK_MAP = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
} as const;

interface UpdateSubscriptionRequest {
  planId: number;
  mealTypes: string[];
  deliveryDays: string[];
  allergies?: string;
  totalPrice: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const subscriptionId = parseInt(resolvedParams.id);
    const userId = parseInt(session.user.id);
    const body: UpdateSubscriptionRequest = await request.json();

    console.log("Updating subscription:", subscriptionId, "for user:", userId);
    console.log("Update data:", body);

    // Validate required fields
    if (!body.planId || !body.mealTypes?.length || !body.deliveryDays.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if subscription exists and belongs to the user
    const existingSubscription = await withRetry(async () => {
      return await db
        .select()
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.id, subscriptionId),
            eq(subscriptionsTable.user_id, userId)
          )
        )
        .limit(1);
    });

    if (existingSubscription.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      );
    }

    // Map meal types strings to numbers
    const mealTypeNumbers = body.mealTypes.map(mealType => {
      const mealTypeNumber = MEAL_TYPE_MAP[mealType as keyof typeof MEAL_TYPE_MAP];
      if (mealTypeNumber === undefined) {
        throw new Error(`Invalid meal type: ${mealType}`);
      }
      return mealTypeNumber;
    });

    // Verify the meal plan exists and get price
    const mealPlan = await withRetry(async () => {
      return await db
        .select()
        .from(mealPlansTable)
        .where(eq(mealPlansTable.id, body.planId))
        .limit(1);
    });

    if (mealPlan.length === 0) {
      return NextResponse.json(
        { error: 'Invalid meal plan' },
        { status: 400 }
      );
    }

    // Calculate expected total price: (price per meal) * (number of meal types) * (number of delivery days) * 4.3
    const monthlyMultiplier = 4.3; // weeks per month
    const expectedPrice = mealPlan[0].price_per_meal * body.mealTypes.length * body.deliveryDays.length * monthlyMultiplier;
    
    console.log("Update price calculation check:", {
      planPrice: mealPlan[0].price_per_meal,
      mealTypesCount: body.mealTypes.length,
      deliveryDaysCount: body.deliveryDays.length,
      monthlyMultiplier,
      expectedPrice,
      receivedPrice: body.totalPrice
    });
    
    // Allow small floating point differences
    if (Math.abs(body.totalPrice - expectedPrice) > 1) {
      return NextResponse.json(
        { error: `Price mismatch. Expected: ${expectedPrice}, Received: ${body.totalPrice}` },
        { status: 400 }
      );
    }

    // Update subscription
    await withRetry(async () => {
      return await db
        .update(subscriptionsTable)
        .set({
          meal_plan_id: body.planId,
          meal_type: mealTypeNumbers[0], // Store first meal type for compatibility
          total_price: expectedPrice, // Use calculated price
          allergies: JSON.stringify({
            allergies: body.allergies || null,
            meal_types: mealTypeNumbers // Store all meal types here
          }),
        })
        .where(eq(subscriptionsTable.id, subscriptionId));
    });

    // TODO: For now, we'll store multiple meal types in a simple way
    // We can create the subscription_meal_types table later via migration
    // For now, let's just update the subscription successfully

    // Delete existing delivery days
    await withRetry(async () => {
      return await db
        .delete(deliveryDaysTable)
        .where(eq(deliveryDaysTable.subscription_id, subscriptionId));
    });

    // Insert new delivery days
    const deliveryDayInserts = body.deliveryDays.map(day => {
      const dayNumber = DAY_OF_WEEK_MAP[day.toLowerCase() as keyof typeof DAY_OF_WEEK_MAP];
      return {
        subscription_id: subscriptionId,
        day_of_the_week: dayNumber
      };
    });

    await withRetry(async () => {
      return await db.insert(deliveryDaysTable).values(deliveryDayInserts);
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const subscriptionId = parseInt(resolvedParams.id);
    const userId = parseInt(session.user.id);

    console.log("Cancelling subscription:", subscriptionId, "for user:", userId);

    // Check if subscription exists and belongs to the user
    const existingSubscription = await withRetry(async () => {
      return await db
        .select()
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.id, subscriptionId),
            eq(subscriptionsTable.user_id, userId)
          )
        )
        .limit(1);
    });

    if (existingSubscription.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      );
    }

    // Update subscription status to cancelled
    await withRetry(async () => {
      return await db
        .update(subscriptionsTable)
        .set({
          status: 'cancelled'
        })
        .where(eq(subscriptionsTable.id, subscriptionId));
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
