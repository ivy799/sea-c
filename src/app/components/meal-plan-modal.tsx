"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface MealPlan {
  id: number;
  name: string;
  description: string | null;
  price_per_meal: number;
  image: string | null;
}

interface MealPlanModalProps {
  mealPlan: MealPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MealPlanModal({ mealPlan, isOpen, onClose }: MealPlanModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle modal visibility and animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger entrance animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before hiding
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key - FIXED: Always call useEffect, condition is inside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Only add listener when modal is open
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isVisible || !mealPlan) return null;

  // Sample additional details
  const additionalDetails = {
    calories: "450-550 kcal",
    protein: "25-30g",
    carbs: "40-50g",
    fat: "15-20g",
    fiber: "8-12g",
    ingredients: ["Fresh vegetables", "Lean protein", "Whole grains", "Healthy fats"],
    allergens: ["May contain gluten", "Dairy-free option available"],
    cookingTime: "15-20 minutes",
    servingSize: "1 portion"
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isAnimating 
          ? 'bg-black bg-opacity-50 backdrop-blur-sm' 
          : 'bg-black bg-opacity-0 backdrop-blur-none'
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-out transform ${
        isAnimating 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-8'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 hover:scale-110 transition-all duration-200 group"
        >
          <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
        </button>

        {/* Image Section */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          {mealPlan.image ? (
            <img
              src={mealPlan.image}
              alt={mealPlan.name}
              className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                isAnimating ? 'scale-100' : 'scale-110'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
              <span className={`text-8xl transition-all duration-500 ease-out ${
                isAnimating ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
              }`}>🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Header */}
          <div className={`mb-6 transition-all duration-500 ease-out delay-100 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{mealPlan.name}</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text">
                Rp{mealPlan.price_per_meal.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                per meal
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">{mealPlan.description}</p>
          </div>

          {/* Nutritional Information */}
          <div className={`mb-6 transition-all duration-500 ease-out delay-200 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Nutritional Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Calories", value: additionalDetails.calories, color: "orange" },
                { label: "Protein", value: additionalDetails.protein, color: "blue" },
                { label: "Carbs", value: additionalDetails.carbs, color: "green" },
                { label: "Fat", value: additionalDetails.fat, color: "purple" },
                { label: "Fiber", value: additionalDetails.fiber, color: "yellow" },
                { label: "Serving", value: additionalDetails.servingSize, color: "red" }
              ].map((item, index) => (
                <div 
                  key={item.label}
                  className={`bg-${item.color}-50 p-3 rounded-lg text-center hover:bg-${item.color}-100 transition-all duration-300 hover:scale-105 cursor-default`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`text-2xl font-bold text-${item.color}-600`}>{item.value}</div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className={`mb-6 transition-all duration-500 ease-out delay-300 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Main Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {additionalDetails.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className={`bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-all duration-300 hover:scale-105 cursor-default ${
                    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className={`mb-6 transition-all duration-500 ease-out delay-400 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Additional Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between hover:bg-gray-50 p-2 rounded transition-colors duration-200">
                <span>Cooking Time:</span>
                <span className="font-medium">{additionalDetails.cookingTime}</span>
              </div>
              <div className="flex justify-between hover:bg-gray-50 p-2 rounded transition-colors duration-200">
                <span>Allergens:</span>
                <span className="font-medium">{additionalDetails.allergens.join(", ")}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-4 transition-all duration-500 ease-out delay-500 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
