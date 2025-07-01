import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db/client";
import { testimoniesTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { applyRateLimit, securityHeaders, validateCSRF } from "@/lib/csrf";
import { sanitizeInput, validators } from "@/lib/security";

interface TestimonialRequest {
  message: string;
  rating: number;
}

export async function POST(request: NextRequest) {
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
        { error: 'Invalid security token' },
        { status: 403, headers: securityHeaders() }
      );
    }

    const body: TestimonialRequest = await request.json();
    const userId = parseInt(session.user.id);

    // Sanitize and validate input
    const sanitizedMessage = sanitizeInput(body.message || '', 'text');
    const rating = parseInt(body.rating?.toString() || '0');

    // Validation
    if (!sanitizedMessage || sanitizedMessage.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review message must be at least 10 characters long' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (sanitizedMessage.length > 500) {
      return NextResponse.json(
        { error: 'Review message cannot exceed 500 characters' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Security validation
    if (!validators.xss(sanitizedMessage)) {
      return NextResponse.json(
        { error: 'Invalid characters detected in message' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: securityHeaders() }
      );
    }

    // Check if user already has a testimonial (optional - remove if multiple testimonials per user are allowed)
    const existingTestimonial = await db
      .select()
      .from(testimoniesTable)
      .where(eq(testimoniesTable.user_id, userId))
      .limit(1);

    if (existingTestimonial.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a testimonial. You can only submit one testimonial per account.' },
        { status: 409, headers: securityHeaders() }
      );
    }

    // Insert testimonial
    const result = await db
      .insert(testimoniesTable)
      .values({
        user_id: userId,
        message: sanitizedMessage.trim(),
        rating: rating
      })
      .returning({
        id: testimoniesTable.id,
        message: testimoniesTable.message,
        rating: testimoniesTable.rating
      });

    console.log(`[TESTIMONIAL] New testimonial created by user ${userId} with rating ${rating}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Testimonial submitted successfully',
        testimonial: result[0]
      },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to submit testimonial' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

// GET endpoint to retrieve testimonials (optional)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    if (!applyRateLimit(request, 'general')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: securityHeaders() }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * Math.min(limit, 50); // Max 50 per page

    // Fetch testimonials with user names
    const testimonials = await db
      .select({
        id: testimoniesTable.id,
        message: testimoniesTable.message,
        rating: testimoniesTable.rating,
        full_name: usersTable.full_name,
      })
      .from(testimoniesTable)
      .innerJoin(usersTable, eq(testimoniesTable.user_id, usersTable.id))
      .limit(Math.min(limit, 50))
      .offset(offset)
      .orderBy(testimoniesTable.id);

    return NextResponse.json(
      {
        success: true,
        testimonials,
        pagination: {
          page,
          limit: Math.min(limit, 50),
          hasMore: testimonials.length === Math.min(limit, 50)
        }
      },
      { headers: securityHeaders() }
    );

  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
