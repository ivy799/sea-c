"use client";

import { useState, useEffect } from "react";
import { sanitizeInput, validateFormData } from "@/lib/security";

interface MealPlan {
  id: number;
  name: string;
  price_per_meal: number;
  description?: string;
  image?: string | null;
}

interface Subscription {
  id: number;
  meal_plan_id: number;
  meal_plan_name: string;
  meal_plan_price: number;
  meal_type: number;
  total_price: number;
  allergies: string | null;
  status: string;
  delivery_days: string[];
  meal_types: string[];
}

interface EditSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", id: 0 },
  { value: "lunch", label: "Lunch", id: 1 },
  { value: "dinner", label: "Dinner", id: 2 },
];

const DAYS_OF_WEEK = [
  { value: "sunday", label: "Sunday", id: 0 },
  { value: "monday", label: "Monday", id: 1 },
  { value: "tuesday", label: "Tuesday", id: 2 },
  { value: "wednesday", label: "Wednesday", id: 3 },
  { value: "thursday", label: "Thursday", id: 4 },
  { value: "friday", label: "Friday", id: 5 },
  { value: "saturday", label: "Saturday", id: 6 },
];

export default function EditSubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onUpdate,
}: EditSubscriptionModalProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
  const [mealTypes, setMealTypes] = useState<string[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  // Initialize form with current subscription data
  useEffect(() => {
    if (subscription && isOpen) {
      // Set plan ID
      setSelectedPlanId(subscription.meal_plan_id);
      
      // Convert meal type numbers to strings
      const currentMealTypes = subscription.meal_types && subscription.meal_types.length > 0 
        ? subscription.meal_types.map(typeId => {
            const mealType = MEAL_TYPES.find(type => type.id === parseInt(typeId));
            return mealType?.value || "";
          }).filter(Boolean)
        : [MEAL_TYPES.find(type => type.id === subscription.meal_type)?.value || ""];
      
      setMealTypes(currentMealTypes);
      
      // Convert delivery day numbers to strings
      const currentDeliveryDays = subscription.delivery_days.map(dayId => {
        const day = DAYS_OF_WEEK.find(d => d.id === parseInt(dayId));
        return day?.value || "";
      }).filter(Boolean);
      setDeliveryDays(currentDeliveryDays);
      
      // Set allergies - parse from JSON if it's JSON, otherwise use as string
      let actualAllergies = "";
      try {
        if (subscription.allergies) {
          const parsed = JSON.parse(subscription.allergies);
          if (parsed.allergies) {
            actualAllergies = parsed.allergies;
          } else if (typeof subscription.allergies === 'string') {
            actualAllergies = subscription.allergies;
          }
        }
      } catch (e) {
        // If parsing fails, use as regular string
        actualAllergies = subscription.allergies || "";
      }
      
      setAllergies(actualAllergies);
    }
  }, [subscription, isOpen]);

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf-token', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken); // Fixed: was data.token
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    if (isOpen) {
      fetchCsrfToken();
    }
  }, [isOpen]);

  // Helper function to get valid CSRF token
  const getValidCSRFToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/csrf-token?refresh=true', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        console.log("CSRF token refreshed successfully");
        return data.csrfToken;
      } else {
        console.error('Failed to refresh CSRF token:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      return null;
    }
  };

  // Fetch meal plans
  useEffect(() => {
    if (isOpen) {
      fetchMealPlans();
    }
  }, [isOpen]);

  const fetchMealPlans = async () => {
    try {
      const response = await fetch("/api/meal-plans");
      if (response.ok) {
        const data = await response.json();
        setMealPlans(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    }
  };

  const calculateTotalPrice = () => {
    const plan = mealPlans.find(p => p.id === selectedPlanId);
    if (!plan) return 0;
    
    // Formula: Total Price = (Plan Price) × (Number of Meal Types) × (Number of Delivery Days) × 4.3
    const planPrice = plan.price_per_meal;
    const numMealTypes = mealTypes.length;
    const numDeliveryDays = deliveryDays.length;
    const monthlyMultiplier = 4.3; // Monthly multiplier (weeks per month)
    
    return planPrice * numMealTypes * numDeliveryDays * monthlyMultiplier;
  };

  const handleMealTypeToggle = (mealType: string) => {
    setMealTypes(prev => 
      prev.includes(mealType) 
        ? prev.filter(mt => mt !== mealType)
        : [...prev, mealType]
    );
  };

  const handleDeliveryDayToggle = (day: string) => {
    setDeliveryDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleAllergiesChange = (value: string) => {
    // Sanitize input
    const sanitized = sanitizeInput(value, 'allergies');
    
    // Validate input
    const validation = validateFormData({ allergies: sanitized });
    if (!validation.isValid) {
      setSecurityErrors({ allergies: validation.errors.allergies || '' });
    } else {
      setSecurityErrors(prev => ({ ...prev, allergies: '' }));
    }
    
    setAllergies(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!selectedPlanId || mealTypes.length === 0 || deliveryDays.length === 0) {
      setError("Please select meal plan, at least one meal type, and at least one delivery day");
      setIsLoading(false);
      return;
    }

    try {
      // Get a valid CSRF token (refresh if needed)
      let currentCsrfToken = csrfToken;
      
      if (!currentCsrfToken) {
        console.log("No CSRF token available, fetching new one...");
        const newToken = await getValidCSRFToken();
        if (!newToken) {
          throw new Error("Failed to get security token");
        }
        currentCsrfToken = newToken;
      }

      const totalPrice = calculateTotalPrice();
      
      // Helper function to make the API request
      const makeRequest = async (token: string) => {
        return await fetch(`/api/subscriptions/${subscription.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
          },
          credentials: "include",
          body: JSON.stringify({
            planId: selectedPlanId,
            mealTypes,
            deliveryDays,
            allergies: allergies.trim() || null,
            totalPrice,
          }),
        });
      };

      // Try the request with current token
      let response = await makeRequest(currentCsrfToken);
      
      // If CSRF token expired, refresh and retry once
      if (response.status === 403) {
        const result = await response.json();
        if (result.error?.includes('CSRF token expired')) {
          console.log("CSRF token expired, refreshing...");
          const newToken = await getValidCSRFToken();
          
          if (newToken) {
            console.log("Retrying with fresh CSRF token...");
            response = await makeRequest(newToken);
          } else {
            throw new Error("Failed to refresh security token");
          }
        }
      }

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update subscription");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while updating subscription");
      console.error("Error updating subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meal Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={0}>Select meal plan</option>
                {mealPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - Rp{plan.price_per_meal.toLocaleString()}/meal
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Types * (Select at least one)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MEAL_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={mealTypes.includes(type.value)}
                      onChange={() => handleMealTypeToggle(type.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Days * (Select at least one)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={deliveryDays.includes(day.value)}
                      onChange={() => handleDeliveryDayToggle(day.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {day.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies & Dietary Restrictions
              </label>
              <textarea
                value={allergies}
                onChange={(e) => handleAllergiesChange(e.target.value)}
                placeholder="Please list any allergies or dietary restrictions..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {securityErrors.allergies && (
                <p className="mt-1 text-sm text-red-600">{securityErrors.allergies}</p>
              )}
            </div>

            {/* Total Price */}
            {deliveryDays.length > 0 && mealTypes.length > 0 && selectedPlanId > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total Price ({mealTypes.length} meal types × {deliveryDays.length} days/week):
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    Rp{calculateTotalPrice().toLocaleString()}/month
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isLoading || deliveryDays.length === 0 || mealTypes.length === 0}
              >
                {isLoading ? "Updating..." : "Update Subscription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
