import { db } from '../client';
import { mealPlansTable } from '../schema';

export async function seedMealPlans() {
  try {
    // Check if meal plans already exist
    const existingPlans = await db.select().from(mealPlansTable).limit(1);
    
    if (existingPlans.length > 0) {
      console.log('Meal plans already exist');
      return;
    }

    // Insert meal plans
    await db.insert(mealPlansTable).values([
      {
        name: 'Diet Plan',
        price_per_meal: 30000,
        description: 'Perfect for weight management with balanced nutrition and portion control.',
        image: null
      },
      {
        name: 'Protein Plan', 
        price_per_meal: 40000,
        description: 'High-protein meals designed for fitness enthusiasts and muscle building.',
        image: null
      },
      {
        name: 'Royal Plan',
        price_per_meal: 60000,
        description: 'Premium meals with gourmet ingredients and sophisticated flavors.',
        image: null
      }
    ]);

    console.log('Meal plans seeded successfully');
  } catch (error) {
    console.error('Error seeding meal plans:', error);
  }
}

// Run this function to seed the database
if (require.main === module) {
  seedMealPlans().then(() => process.exit(0));
}
