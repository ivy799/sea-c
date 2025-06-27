import Link from "next/link";
import { db } from "../../db/client";
import { mealPlansTable, testimoniesTable, usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import TestimonialsSection from "../components/testimonial-section";
import NavbarComponent from "../components/navbar-components";
import MealPlansClient from "../components/meal-plans-client";

export default async function MealPlansPage() {
    // Ambil data meal plans dari database
    const mealPlans = await db.select().from(mealPlansTable);

    // Ambil data testimonials dengan join ke users table
    const testimonials = await db
        .select({
            id: testimoniesTable.id,
            message: testimoniesTable.message,
            rating: testimoniesTable.rating,
            full_name: usersTable.full_name,
        })
        .from(testimoniesTable)
        .innerJoin(usersTable, eq(testimoniesTable.user_id, usersTable.id))
        .limit(10);

    return (
        <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            <NavbarComponent />
            
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 px-8">
                <div className="container mx-auto text-center">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Delicious <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Meal Plans</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Discover our carefully crafted meal plans designed to nourish your body and delight your taste buds.
                            Fresh ingredients, authentic flavors, delivered to your door.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Fresh Daily
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Locally Sourced
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Authentic Taste
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meal Plans Client Component */}
            <MealPlansClient mealPlans={mealPlans} />

            {/* Call to Action Section */}
            <section className="px-8 pb-16">
                <div className="container mx-auto">
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Start Your Culinary Journey?
                        </h2>
                        <p className="text-xl mb-8 opacity-90">
                            Join thousands of satisfied customers who trust us for their daily meals
                        </p>
                        <Link href="/subscription">
                            <button className="bg-white text-orange-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg">
                                Get Started Today
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            <TestimonialsSection testimonials={testimonials} />
        </main>
    );
}