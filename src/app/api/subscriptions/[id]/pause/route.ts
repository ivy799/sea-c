import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { subscriptionsTable, pausedSubscriptionsTable } from '@/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { validateCSRF, applyRateLimit, securityHeaders } from '@/lib/csrf';
import { sanitizeInput } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate CSRF token
    const csrfValidation = await validateCSRF(request);
    if (!csrfValidation.valid) {
      console.log("CSRF validation failed:", csrfValidation.error);
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403, headers: securityHeaders() }
      );
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);
    
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Validate and sanitize input
    const startDate = sanitizeInput(body.startDate || '', 'text');
    const endDate = body.endDate ? sanitizeInput(body.endDate, 'text') : null;

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (start <= today) {
      return NextResponse.json(
        { error: 'Start date must be after today' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (end && (isNaN(end.getTime()) || end <= start)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Verify subscription ownership and status
    const subscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.id, subscriptionId),
          eq(subscriptionsTable.user_id, userId)
        )
      )
      .limit(1);

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404, headers: securityHeaders() }
      );
    }

    const subscription = subscriptions[0];

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be paused' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Check if subscription is already paused
    const existingPause = await db
      .select()
      .from(pausedSubscriptionsTable)
      .where(
        and(
          eq(pausedSubscriptionsTable.subscription_id, subscriptionId),
          isNull(pausedSubscriptionsTable.end_date) // Active pause (no end date means still paused)
        )
      )
      .limit(1);

    if (existingPause.length > 0) {
      return NextResponse.json(
        { error: 'Subscription is already paused' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Create pause record
    await db.insert(pausedSubscriptionsTable).values({
      subscription_id: subscriptionId,
      start_date: startDate,
      end_date: endDate,
    });

    // Update subscription status to paused
    await db
      .update(subscriptionsTable)
      .set({ status: 'paused' })
      .where(eq(subscriptionsTable.id, subscriptionId));

    return NextResponse.json(
      { 
        message: 'Subscription paused successfully',
        pauseDetails: {
          startDate,
          endDate,
          subscriptionId
        }
      },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error pausing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

// Resume subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate CSRF token
    const csrfValidation = await validateCSRF(request);
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: 403, headers: securityHeaders() }
      );
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);
    
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const userId = parseInt(session.user.id);

    // Verify subscription ownership
    const subscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.id, subscriptionId),
          eq(subscriptionsTable.user_id, userId)
        )
      )
      .limit(1);

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404, headers: securityHeaders() }
      );
    }

    const subscription = subscriptions[0];
    console.log(`[RESUME] Subscription ${subscriptionId} status: ${subscription.status}`);

    if (subscription.status !== 'paused') {
      console.log(`[RESUME] Cannot resume: subscription status is ${subscription.status}, not paused`);
      return NextResponse.json(
        { error: 'Only paused subscriptions can be resumed' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Find active pause record - look for the most recent pause record that either:
    // 1. Has no end_date (indefinite pause)
    // 2. Has an end_date in the future (scheduled pause still active)
    const today = new Date().toISOString().split('T')[0];
    
    const pauseRecords = await db
      .select()
      .from(pausedSubscriptionsTable)
      .where(
        eq(pausedSubscriptionsTable.subscription_id, subscriptionId)
      )
      .orderBy(pausedSubscriptionsTable.id)
      .limit(1);

    console.log(`[RESUME] Found ${pauseRecords.length} pause records for subscription ${subscriptionId}`);
    if (pauseRecords.length > 0) {
      console.log(`[RESUME] Pause record:`, pauseRecords[0]);
    }

    if (pauseRecords.length === 0) {
      // If no pause record found but subscription is paused, create one for consistency
      console.log(`[RESUME] No pause record found, creating one for consistency`);
      const pauseRecord = await db.insert(pausedSubscriptionsTable).values({
        subscription_id: subscriptionId,
        start_date: today,
        end_date: null
      }).returning();
      
      console.log(`[RESUME] Created pause record:`, pauseRecord[0]);
      
      // Then update it to end the pause
      await db
        .update(pausedSubscriptionsTable)
        .set({ end_date: today })
        .where(eq(pausedSubscriptionsTable.id, pauseRecord[0].id));
        
      console.log(`[RESUME] Updated pause record to end today`);
    } else {
      // End the existing pause by setting end_date to today
      console.log(`[RESUME] Updating existing pause record ${pauseRecords[0].id} to end today`);
      await db
        .update(pausedSubscriptionsTable)
        .set({ end_date: today })
        .where(eq(pausedSubscriptionsTable.id, pauseRecords[0].id));
    }

    // Update subscription status back to active
    await db
      .update(subscriptionsTable)
      .set({ status: 'active' })
      .where(eq(subscriptionsTable.id, subscriptionId));

    console.log(`[RESUME] Updated subscription ${subscriptionId} status back to active`);

    return NextResponse.json(
      { message: 'Subscription resumed successfully' },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
