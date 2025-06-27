import { db } from "../../db/client";
import { mealPlansTable } from "../../db/schema";
import TestimonialsSection from "../components/testimonial-section";
import NavbarComponent from "../components/navbar-components";


export default async function MealPlansPage() {
    // Ambil data meal plans dari database
    const mealPlans = await db.select().from(mealPlansTable);

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

            {/* Meal Plans Grid */}
            <section className="px-8 pb-20">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {mealPlans.map((plan, index) => (
                            <div
                                key={plan.id}
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Image Container */}
                                <div className="relative h-48 overflow-hidden">
                                    {plan.image ? (
                                        <img
                                            src={plan.image}
                                            alt={plan.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
                                            <span className="text-6xl">🍽️</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                                        {plan.name}
                                    </h3>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text">
                                            Rp{plan.price_per_meal.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-500">per meal</div>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                                        {plan.description}
                                    </p>

                                    {/* Action Button */}
                                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                                        Order Now
                                    </button>
                                </div>

                                {/* Badge */}
                                <div className="absolute top-4 right-4">
                                    <div className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-orange-600">
                                        Popular
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {mealPlans.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-8xl mb-4">🍽️</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Meal Plans Available</h3>
                            <p className="text-gray-600">We're working on adding delicious meal plans for you!</p>
                        </div>
                    )}
                </div>
            </section>

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
                        <button className="bg-white text-orange-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg">
                            Get Started Today
                        </button>
                    </div>
                </div>
            </section>

            <TestimonialsSection />
        </main>
    );
}