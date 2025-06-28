import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { usersTable, UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeInput, validateFormData, validators } from '@/lib/security';
import { applyRateLimit, securityHeaders } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for authentication endpoints
    if (!applyRateLimit(request, 'auth')) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: securityHeaders() }
      );
    }

    const { fullName, email, password } = await request.json();

    // Sanitize all inputs
    const sanitizedData = {
      fullName: sanitizeInput(fullName || '', 'name'),
      email: sanitizeInput(email || '', 'email'),
      password: password || '' // Don't sanitize password, just validate
    };

    // Comprehensive validation
    const validation = validateFormData({
      name: sanitizedData.fullName,
      email: sanitizedData.email,
      password: sanitizedData.password
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid input data", details: validation.errors },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Basic field validation
    if (!sanitizedData.fullName || !sanitizedData.email || !sanitizedData.password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Additional specific validations
    if (!validators.name(sanitizedData.fullName)) {
      return NextResponse.json(
        { error: "Full name contains invalid characters or is too short/long" },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (!validators.email(sanitizedData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (!validators.password(sanitizedData.password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, sanitizedData.email))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409, headers: securityHeaders() }
      );
    }

    // Hash password with strong salt rounds
    const hashedPassword = await bcrypt.hash(sanitizedData.password, 12);

    // Create user
    const newUser = await db
      .insert(usersTable)
      .values({
        full_name: sanitizedData.fullName,
        email: sanitizedData.email,
        password: hashedPassword,
        role: UserRole.User
      })
      .returning({
        id: usersTable.id,
        fullName: usersTable.full_name,
        email: usersTable.email,
        role: usersTable.role
      });

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: newUser[0].id,
          fullName: newUser[0].fullName,
          email: newUser[0].email,
          role: newUser[0].role
        }
      },
      { status: 201, headers: securityHeaders() }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: securityHeaders() }
    );
  }
}
