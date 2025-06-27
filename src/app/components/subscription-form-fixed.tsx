"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FormData {
  name: string;
  phone: string;
  plan: string;
  mealTypes: string[];
  deliveryDays: string[];
  allergies: string;
}

interface MealPlan {
  id: number;
  name: string;
  price_per_meal: number;
  description: string;
  image: string | null;
}

const mealTypes = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
];

const daysOfWeek = [
  { id: "monday", name: "Monday" },
  { id: "tuesday", name: "Tuesday" },
  { id: "wednesday", name: "Wednesday" },
  { id: "thursday", name: "Thursday" },
  { id: "friday", name: "Friday" },
  { id: "saturday", name: "Saturday" },
  { id: "sunday", name: "Sunday" },
];

export default function SubscriptionForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    plan: "",
    mealTypes: [],
    deliveryDays: [],
    allergies: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Fetch meal plans on component mount
  useEffect(() => {
    const fetchMealPlans = async () => {
      console.log("Fetching meal plans...");
      try {
        const response = await fetch('/api/meal-plans');
        const result = await response.json();
        console.log("Meal plans response:", result);
        
        if (result.success) {
          setMealPlans(result.data);
          console.log("Meal plans loaded:", result.data);
        } else {
          console.error('Failed to fetch meal plans:', result.error);
          // Fallback to default plans if API fails
          setMealPlans([
            { id: 1, name: "Diet Plan", price_per_meal: 30000, description: "Perfect for weight management", image: null },
            { id: 2, name: "Protein Plan", price_per_meal: 40000, description: "High-protein meals", image: null },
            { id: 3, name: "Royal Plan", price_per_meal: 60000, description: "Premium meals", image: null },
          ]);
        }
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        // Fallback to default plans
        setMealPlans([
          { id: 1, name: "Diet Plan", price_per_meal: 30000, description: "Perfect for weight management", image: null },
          { id: 2, name: "Protein Plan", price_per_meal: 40000, description: "High-protein meals", image: null },
          { id: 3, name: "Royal Plan", price_per_meal: 60000, description: "Premium meals", image: null },
        ]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchMealPlans();
  }, []);

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!formData.plan || formData.mealTypes.length === 0 || formData.deliveryDays.length === 0) {
      return 0;
    }

    const selectedPlan = mealPlans.find(p => p.id.toString() === formData.plan);
    if (!selectedPlan) return 0;

    const planPrice = selectedPlan.price_per_meal;
    const numMealTypes = formData.mealTypes.length;
    const numDeliveryDays = formData.deliveryDays.length;
    const multiplier = 4.3; // Monthly multiplier

    return planPrice * numMealTypes * numDeliveryDays * multiplier;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle checkbox changes for meal types and delivery days
  const handleCheckboxChange = (field: 'mealTypes' | 'deliveryDays', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    console.log("Validating form with data:", formData);
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      console.log("Name validation failed:", formData.name);
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      console.log("Phone validation failed:", formData.phone);
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(formData.phone.replace(/\s/g, ''))) {
      console.log("Phone format validation failed:", formData.phone);
      newErrors.phone = "Please enter a valid Indonesian phone number";
    }

    if (!formData.plan) {
      console.log("Plan validation failed:", formData.plan);
      newErrors.plan = "Please select a plan";
    }

    if (formData.mealTypes.length === 0) {
      console.log("Meal types validation failed:", formData.mealTypes);
      newErrors.mealTypes = "Please select at least one meal type";
    }

    if (formData.deliveryDays.length === 0) {
      console.log("Delivery days validation failed:", formData.deliveryDays);
      newErrors.deliveryDays = "Please select at least one delivery day";
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted!");
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsSubmitting(true);

    try {
      const subscriptionData = {
        name: formData.name,
        phone: formData.phone,
        plan: formData.plan, // This will be the plan ID as string
        mealTypes: formData.mealTypes,
        deliveryDays: formData.deliveryDays,
        allergies: formData.allergies,
        totalPrice: calculateTotalPrice(),
      };

      console.log("Sending subscription data:", subscriptionData);

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit subscription');
      }

      alert(result.message || "Subscription submitted successfully! We will contact you soon.");
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        plan: "",
        mealTypes: [],
        deliveryDays: [],
        allergies: "",
      });
    } catch (error) {
      console.error('Subscription submission error:', error);
      alert(error instanceof Error ? error.message : "There was an error submitting your subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  return (
    <section className="px-8 pb-20">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Subscription Form</h2>
              <p className="text-orange-100">Fill in your details to start your meal plan journey</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Debug Section - Show validation errors */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Please fix the following errors:</h3>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}><strong>{field}:</strong> {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
                
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Active Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="08123456789"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Plan Selection */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Plan Selection *</h3>
                {isLoadingPlans ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading plans...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {mealPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                          formData.plan === plan.id.toString()
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                        onClick={() => handleInputChange("plan", plan.id.toString())}
                      >
                        <div className="flex items-center mb-3">
                          <input
                            type="radio"
                            id={plan.id.toString()}
                            name="plan"
                            value={plan.id.toString()}
                            checked={formData.plan === plan.id.toString()}
                            onChange={(e) => handleInputChange("plan", e.target.value)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                          />
                          <label htmlFor={plan.id.toString()} className="ml-3 text-lg font-semibold text-gray-900">
                            {plan.name}
                          </label>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(plan.price_per_meal)}
                        </p>
                        <p className="text-sm text-gray-600">per meal</p>
                        <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                {errors.plan && <p className="text-red-500 text-sm">{errors.plan}</p>}
              </div>

              {/* Meal Types */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Meal Types *</h3>
                <p className="text-gray-600">Select one or more meal options</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {mealTypes.map((meal) => (
                    <div
                      key={meal.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                        formData.mealTypes.includes(meal.id)
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleCheckboxChange("mealTypes", meal.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={meal.id}
                          checked={formData.mealTypes.includes(meal.id)}
                          onChange={() => handleCheckboxChange("mealTypes", meal.id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor={meal.id} className="ml-3 text-lg font-medium text-gray-900">
                          {meal.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.mealTypes && <p className="text-red-500 text-sm">{errors.mealTypes}</p>}
              </div>

              {/* Delivery Days */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Delivery Days *</h3>
                <p className="text-gray-600">Choose the days for meal delivery</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day.id}
                      className={`border-2 rounded-xl p-3 cursor-pointer transition-all duration-300 text-center ${
                        formData.deliveryDays.includes(day.id)
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => handleCheckboxChange("deliveryDays", day.id)}
                    >
                      <input
                        type="checkbox"
                        id={day.id}
                        checked={formData.deliveryDays.includes(day.id)}
                        onChange={() => handleCheckboxChange("deliveryDays", day.id)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mb-2"
                      />
                      <label htmlFor={day.id} className="block text-sm font-medium text-gray-900">
                        {day.name}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.deliveryDays && <p className="text-red-500 text-sm">{errors.deliveryDays}</p>}
              </div>

              {/* Allergies */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Allergies & Dietary Restrictions</h3>
                <p className="text-gray-600">Optional: List any allergies or dietary restrictions</p>
                <textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                  placeholder="Please list any allergies, dietary restrictions, or special requirements..."
                />
              </div>

              {/* Price Calculation */}
              {totalPrice > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Price Calculation</h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Plan Price:</span>
                      <span>{formatCurrency(mealPlans.find(p => p.id.toString() === formData.plan)?.price_per_meal || 0)} per meal</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meal Types Selected:</span>
                      <span>{formData.mealTypes.length} type(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Days:</span>
                      <span>{formData.deliveryDays.length} day(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Multiplier:</span>
                      <span>4.3</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-xl font-bold text-orange-600">
                      <span>Total Monthly Price:</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => console.log("Button clicked!")}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
