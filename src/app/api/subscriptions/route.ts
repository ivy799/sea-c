import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, subscriptionMealTypesTable, mealPlansTable, usersTable } from '@/db/schema';
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

interface SubscriptionRequest {
  name: string;
  phone: string;
  plan: string;
  mealTypes: string[];
  deliveryDays: string[];
  allergies?: string;
  totalPrice: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Subscription API called");
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Session data:", session);
    
    if (!session || !session.user) {
      console.log("Authentication failed - no session");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user);

    const body: SubscriptionRequest = await request.json();
    console.log("Request body:", body);
    
    // Validate required fields
    if (!body.name || !body.phone || !body.plan || !body.mealTypes.length || !body.deliveryDays.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use the authenticated user's ID instead of creating/finding by phone
    const userId = parseInt(session.user.id);

    // Verify the user exists and update their info if necessary
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user phone if provided and different
    if (body.phone && body.phone !== user[0].phone_number) {
      await db
        .update(usersTable)
        .set({ phone_number: body.phone })
        .where(eq(usersTable.id, userId));
    }

    // 2. Get the meal plan from the database
    const mealPlan = await db
      .select()
      .from(mealPlansTable)
      .where(eq(mealPlansTable.id, parseInt(body.plan)))
      .limit(1);
    
    if (mealPlan.length === 0) {
      throw new Error('Invalid plan selected');
    }

    // 3. Validate meal types
    const mealTypeNumbers = body.mealTypes.map(mealType => {
      const mealTypeId = MEAL_TYPE_MAP[mealType as keyof typeof MEAL_TYPE_MAP];
      if (mealTypeId === undefined) {
        throw new Error(`Invalid meal type: ${mealType}`);
      }
      return mealTypeId;
    });

    // 4. Calculate and validate total price
    // Formula: Total Price = (Plan Price) × (Number of Meal Types) × (Number of Delivery Days) × 4.3
    const monthlyMultiplier = 4.3; // weeks per month
    const expectedPrice = mealPlan[0].price_per_meal * body.mealTypes.length * body.deliveryDays.length * monthlyMultiplier;
    
    console.log("Price calculation check:", {
      planPrice: mealPlan[0].price_per_meal,
      mealTypesCount: body.mealTypes.length,
      deliveryDaysCount: body.deliveryDays.length,
      monthlyMultiplier,
      expectedPrice,
      receivedPrice: body.totalPrice
    });
    
    if (Math.abs(body.totalPrice - expectedPrice) > 1) {
      throw new Error(`Price mismatch. Expected: ${expectedPrice}, Received: ${body.totalPrice}`);
    }

    // 5. Create single subscription
    const subscription = await db
      .insert(subscriptionsTable)
      .values({
        user_id: userId,
        meal_plan_id: parseInt(body.plan),
        meal_type: mealTypeNumbers[0], // Store first meal type for compatibility
        total_price: expectedPrice,
        allergies: JSON.stringify({
          allergies: body.allergies || null,
          meal_types: mealTypeNumbers // Store all meal types here
        }),
        status: 'active',
      })
      .returning({ id: subscriptionsTable.id });

    const subscriptionId = subscription[0].id;

    // 6. TODO: Create meal type entries when table is ready
    // For now, we store only the first meal type in the main subscription table

    // 7. Create delivery day entries
    for (const day of body.deliveryDays) {
      const dayOfWeek = DAY_OF_WEEK_MAP[day as keyof typeof DAY_OF_WEEK_MAP];
      if (dayOfWeek === undefined) {
        throw new Error(`Invalid delivery day: ${day}`);
      }

      await db.insert(deliveryDaysTable).values({
        subscription_id: subscriptionId,
        day_of_the_week: dayOfWeek,
      });
    }

    const result = {
      userId,
      subscriptionId,
      message: 'Subscription created successfully',
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Subscription submitted successfully! We will contact you soon.',
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user subscriptions (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const userId = searchParams.get('userId');

    if (!phone && !userId) {
      return NextResponse.json(
        { error: 'Phone number or user ID is required' },
        { status: 400 }
      );
    }

    let whereCondition;
    if (userId) {
      whereCondition = eq(usersTable.id, parseInt(userId));
    } else {
      whereCondition = eq(usersTable.phone_number, phone!);
    }

    // Get user and their subscriptions
    const userWithSubscriptions = await db
      .select({
        user_id: usersTable.id,
        user_name: usersTable.full_name,
        user_phone: usersTable.phone_number,
        subscription_id: subscriptionsTable.id,
        meal_plan_id: subscriptionsTable.meal_plan_id,
        meal_type: subscriptionsTable.meal_type,
        total_price: subscriptionsTable.total_price,
        allergies: subscriptionsTable.allergies,
        status: subscriptionsTable.status,
        plan_name: mealPlansTable.name,
        plan_price: mealPlansTable.price_per_meal,
      })
      .from(usersTable)
      .leftJoin(subscriptionsTable, eq(usersTable.id, subscriptionsTable.user_id))
      .leftJoin(mealPlansTable, eq(subscriptionsTable.meal_plan_id, mealPlansTable.id))
      .where(whereCondition);

    if (userWithSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get delivery days for each subscription
    const subscriptions = userWithSubscriptions.filter(row => row.subscription_id);
    const subscriptionsWithDeliveryDays = await Promise.all(
      subscriptions.map(async (sub) => {
        const deliveryDays = await db
          .select({ day_of_week: deliveryDaysTable.day_of_the_week })
          .from(deliveryDaysTable)
          .where(eq(deliveryDaysTable.subscription_id, sub.subscription_id!));

        return {
          ...sub,
          delivery_days: deliveryDays.map(d => d.day_of_week),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userWithSubscriptions[0].user_id,
          name: userWithSubscriptions[0].user_name,
          phone: userWithSubscriptions[0].user_phone,
        },
        subscriptions: subscriptionsWithDeliveryDays,
      },
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve subscriptions' },
      { status: 500 }
    );
  }
}
