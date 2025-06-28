import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { mealPlansTable } from '@/db/schema';

export async function POST() {
  try {
    // Check if meal plans already exist
    const existingPlans = await db.select().from(mealPlansTable).limit(1);
    
    if (existingPlans.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Meal plans already exist',
        data: existingPlans
      });
    }

    // Insert meal plans
    const newPlans = await db.insert(mealPlansTable).values([
      {
        name: 'Diet Plan',
        price_per_meal: 30000,
        description: 'Perfect for weight management with balanced nutrition and portion control. Low-calorie meals with fresh vegetables and lean proteins.',
        image: null
      },
      {
        name: 'Protein Plan', 
        price_per_meal: 40000,
        description: 'High-protein meals designed for fitness enthusiasts and muscle building. Rich in lean meats, fish, and plant-based proteins.',
        image: null
      },
      {
        name: 'Royal Plan',
        price_per_meal: 60000,
        description: 'Premium meals with gourmet ingredients and sophisticated flavors. Experience fine dining in the comfort of your home.',
        image: null
      }
    ]).returning();

    return NextResponse.json({
      success: true,
      message: 'Meal plans created successfully',
      data: newPlans
    });

  } catch (error) {
    console.error('Error creating meal plans:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create meal plans', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("Fetching meal plans from database...");
    const mealPlans = await db.select().from(mealPlansTable);
    
    console.log("Meal plans fetched:", mealPlans);
    
    return NextResponse.json({
      success: true,
      data: mealPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price_per_meal: plan.price_per_meal,
        description: plan.description,
        image: plan.image
      }))
    });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch meal plans', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
