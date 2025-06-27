import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, usersTable, mealPlansTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

// Mapping for plan names to IDs - will be dynamically determined from database
const getPlanIdFromDatabase = async (planId: string) => {
  const plans = await db.select().from(mealPlansTable);
  const plan = plans.find(p => p.id.toString() === planId);
  return plan?.id;
};

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
    const body: SubscriptionRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.plan || !body.mealTypes.length || !body.deliveryDays.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. First, check if user exists or create new user
    let user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone_number, body.phone))
      .limit(1);

    let userId: number;

    if (user.length === 0) {
      // Create new user
      const newUser = await db
        .insert(usersTable)
        .values({
          full_name: body.name,
          email: `${body.phone}@temp.com`, // Temporary email, you might want to collect this
          password: 'temp_password', // You'll need to handle password properly
          phone_number: body.phone,
          role: 1, // User role
        })
        .returning({ id: usersTable.id });
      
      userId = newUser[0].id;
    } else {
      userId = user[0].id;
      
      // Update user name if different
      if (user[0].full_name !== body.name) {
        await db
          .update(usersTable)
          .set({ full_name: body.name })
          .where(eq(usersTable.id, userId));
      }
    }

    // 2. Get the meal plan ID from the database
    const mealPlanId = await getPlanIdFromDatabase(body.plan);
    if (!mealPlanId) {
      throw new Error('Invalid plan selected');
    }

    // 3. Create subscription entries for each meal type
    const subscriptionIds: number[] = [];
    
    for (const mealType of body.mealTypes) {
      const mealTypeId = MEAL_TYPE_MAP[mealType as keyof typeof MEAL_TYPE_MAP];
      if (mealTypeId === undefined) {
        throw new Error(`Invalid meal type: ${mealType}`);
      }

      // Calculate price for this specific meal type combination
      const pricePerMealType = body.totalPrice / body.mealTypes.length;

      const subscription = await db
        .insert(subscriptionsTable)
        .values({
          user_id: userId,
          meal_plan_id: mealPlanId,
          meal_type: mealTypeId,
          total_price: pricePerMealType,
          allergies: body.allergies || null,
          status: 'active',
        })
        .returning({ id: subscriptionsTable.id });

      subscriptionIds.push(subscription[0].id);
    }

    // 4. Create delivery day entries for each subscription
    for (const subscriptionId of subscriptionIds) {
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
    }

    const result = {
      userId,
      subscriptionIds,
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
