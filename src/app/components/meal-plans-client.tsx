"use client";

import { useState } from "react";
import MealPlanModal from "./meal-plan-modal";

interface MealPlan {
    id: number;
    name: string;
    description: string | null;
    price_per_meal: number;
    image: string | null;
}

interface MealPlansClientProps {
    mealPlans: MealPlan[];
}

export default function MealPlansClient({ mealPlans }: MealPlansClientProps) {
    const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (mealPlan: MealPlan) => {
        setSelectedMealPlan(mealPlan);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMealPlan(null);
    };

    return (
        <>
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
                                    <button 
                                        onClick={() => openModal(plan)}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        See More Details
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

            {/* Modal */}
            <MealPlanModal 
                mealPlan={selectedMealPlan}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </>
    );
}
