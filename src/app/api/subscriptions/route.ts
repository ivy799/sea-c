import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, deliveryDaysTable, mealPlansTable, usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeInput, validateFormData, validators } from '@/lib/security';
import { validateCSRF, applyRateLimit, securityHeaders } from '@/lib/csrf';

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
    
    // Apply rate limiting
    if (!applyRateLimit(request, 'general')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: securityHeaders() }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Session data:", session);
    
    if (!session || !session.user) {
      console.log("Authentication failed - no session");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders() }
      );
    }

    // Validate CSRF token for POST requests
    const csrfValidation = await validateCSRF(request);
    if (!csrfValidation.valid) {
      console.log("CSRF validation failed:", csrfValidation.error);
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403, headers: securityHeaders() }
      );
    }

    console.log("User authenticated:", session.user);

    const body: SubscriptionRequest = await request.json();
    console.log("Request body:", body);
    
    // Sanitize all input fields
    const sanitizedData = {
      name: sanitizeInput(body.name || '', 'name'),
      phone: sanitizeInput(body.phone || '', 'phone'),
      plan: sanitizeInput(body.plan || '', 'text'),
      mealTypes: Array.isArray(body.mealTypes) ? body.mealTypes.map(mt => sanitizeInput(mt, 'text')) : [],
      deliveryDays: Array.isArray(body.deliveryDays) ? body.deliveryDays.map(dd => sanitizeInput(dd, 'text')) : [],
      allergies: sanitizeInput(body.allergies || '', 'allergies'),
      totalPrice: typeof body.totalPrice === 'number' ? body.totalPrice : 0
    };

    // Validate sanitized data
    const validation = validateFormData({
      name: sanitizedData.name,
      phone: sanitizedData.phone,
      allergies: sanitizedData.allergies
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.errors },
        { status: 400, headers: securityHeaders() }
      );
    }
    
    // Validate required fields
    if (!sanitizedData.name || !sanitizedData.phone || !sanitizedData.plan || !sanitizedData.mealTypes.length || !sanitizedData.deliveryDays.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Additional validation for meal types and delivery days
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    const validDeliveryDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (const mealType of sanitizedData.mealTypes) {
      if (!validMealTypes.includes(mealType.toLowerCase())) {
        return NextResponse.json(
          { error: `Invalid meal type: ${mealType}` },
          { status: 400, headers: securityHeaders() }
        );
      }
    }

    for (const day of sanitizedData.deliveryDays) {
      if (!validDeliveryDays.includes(day.toLowerCase())) {
        return NextResponse.json(
          { error: `Invalid delivery day: ${day}` },
          { status: 400, headers: securityHeaders() }
        );
      }
    }

    // Validate plan ID is numeric
    const planId = parseInt(sanitizedData.plan);
    if (isNaN(planId) || planId <= 0) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400, headers: securityHeaders() }
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
    if (sanitizedData.phone && sanitizedData.phone !== user[0].phone_number) {
      await db
        .update(usersTable)
        .set({ phone_number: sanitizedData.phone })
        .where(eq(usersTable.id, userId));
    }

    // 2. Get the meal plan from the database
    const mealPlan = await db
      .select()
      .from(mealPlansTable)
      .where(eq(mealPlansTable.id, planId))
      .limit(1);
    
    if (mealPlan.length === 0) {
      throw new Error('Invalid plan selected');
    }

    // 3. Validate meal types
    const mealTypeNumbers = sanitizedData.mealTypes.map(mealType => {
      const mealTypeId = MEAL_TYPE_MAP[mealType as keyof typeof MEAL_TYPE_MAP];
      if (mealTypeId === undefined) {
        throw new Error(`Invalid meal type: ${mealType}`);
      }
      return mealTypeId;
    });

    // 4. Calculate and validate total price
    // Formula: Total Price = (Plan Price) × (Number of Meal Types) × (Number of Delivery Days) × 4.3
    const monthlyMultiplier = 4.3; // weeks per month
    const expectedPrice = mealPlan[0].price_per_meal * sanitizedData.mealTypes.length * sanitizedData.deliveryDays.length * monthlyMultiplier;
    
    console.log("Price calculation check:", {
      planPrice: mealPlan[0].price_per_meal,
      mealTypesCount: sanitizedData.mealTypes.length,
      deliveryDaysCount: sanitizedData.deliveryDays.length,
      monthlyMultiplier,
      expectedPrice,
      receivedPrice: sanitizedData.totalPrice
    });
    
    if (Math.abs(sanitizedData.totalPrice - expectedPrice) > 1) {
      throw new Error(`Price mismatch. Expected: ${expectedPrice}, Received: ${sanitizedData.totalPrice}`);
    }

    // 5. Create single subscription
    const subscription = await db
      .insert(subscriptionsTable)
      .values({
        user_id: userId,
        meal_plan_id: planId,
        meal_type: mealTypeNumbers[0], // Store first meal type for compatibility
        total_price: expectedPrice,
        allergies: JSON.stringify({
          allergies: sanitizedData.allergies || null,
          meal_types: mealTypeNumbers // Store all meal types here
        }),
        status: 'active',
      })
      .returning({ id: subscriptionsTable.id });

    const subscriptionId = subscription[0].id;

    // 6. TODO: Create meal type entries when table is ready
    // For now, we store only the first meal type in the main subscription table

    // 7. Create delivery day entries
    for (const day of sanitizedData.deliveryDays) {
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
    }, { headers: securityHeaders() });

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers: securityHeaders() }
    );
  }
}

// GET endpoint to retrieve user subscriptions (optional)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    if (!applyRateLimit(request, 'general')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const userId = searchParams.get('userId');

    // Sanitize input parameters
    const sanitizedPhone = phone ? sanitizeInput(phone, 'phone') : null;
    const sanitizedUserId = userId ? sanitizeInput(userId, 'text') : null;

    if (!sanitizedPhone && !sanitizedUserId) {
      return NextResponse.json(
        { error: 'Phone number or user ID is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Validate phone format if provided
    if (sanitizedPhone && !validators.phone(sanitizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Validate user ID format if provided
    if (sanitizedUserId && (isNaN(parseInt(sanitizedUserId)) || parseInt(sanitizedUserId) <= 0)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400, headers: securityHeaders() }
      );
    }

    let whereCondition;
    if (sanitizedUserId) {
      whereCondition = eq(usersTable.id, parseInt(sanitizedUserId));
    } else {
      whereCondition = eq(usersTable.phone_number, sanitizedPhone!);
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
        { status: 404, headers: securityHeaders() }
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
    }, { headers: securityHeaders() });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve subscriptions' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
