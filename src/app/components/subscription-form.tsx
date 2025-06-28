"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { sanitizeInput, validateFormData, escapeHtml } from "@/lib/security";

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
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    plan: "",
    mealTypes: [],
    deliveryDays: [],
    allergies: "",
  });

  // Security state
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  // Update form when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || ""
      }));
      
      // Fetch CSRF token
      fetchCSRFToken();
    }
  }, [session]);

  // Fetch CSRF token for security
  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Test function to check meal plans
  const testMealPlans = async () => {
    try {
      const response = await fetch('/api/meal-plans', { method: 'POST' });
      const result = await response.json();
      console.log("Meal plans initialization:", result);
      alert(`Meal plans test: ${result.message}`);
    } catch (error) {
      console.error('Error testing meal plans:', error);
      alert('Error testing meal plans: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Fetch meal plans on component mount
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        console.log("Fetching meal plans..."); // Debug log
        const response = await fetch('/api/meal-plans', {
          credentials: 'include'
        });
        
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        const result = await response.json();
        console.log("Meal plans response:", result); // Debug log
        
        if (result.success && result.data) {
          setMealPlans(result.data);
          console.log("Meal plans loaded:", result.data); // Debug log
        } else {
          console.error('API returned error:', result.error);
          // Initialize meal plans via POST if GET fails
          console.log("Attempting to initialize meal plans...");
          const initResponse = await fetch('/api/meal-plans', {
            method: 'POST',
            credentials: 'include'
          });
          const initResult = await initResponse.json();
          
          if (initResult.success) {
            console.log("Meal plans initialized, retrying fetch...");
            // Retry fetch after initialization
            const retryResponse = await fetch('/api/meal-plans', {
              credentials: 'include'
            });
            const retryResult = await retryResponse.json();
            
            if (retryResult.success && retryResult.data) {
              setMealPlans(retryResult.data);
            } else {
              throw new Error("Failed to fetch after initialization");
            }
          } else {
            throw new Error(initResult.error || "Failed to initialize meal plans");
          }
        }
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        // Fallback to default plans
        const fallbackPlans = [
          { id: 1, name: "Diet Plan", price_per_meal: 30000, description: "Perfect for weight management", image: null },
          { id: 2, name: "Protein Plan", price_per_meal: 40000, description: "High-protein meals", image: null },
          { id: 3, name: "Royal Plan", price_per_meal: 60000, description: "Premium meals", image: null },
        ];
        setMealPlans(fallbackPlans);
        console.log("Using fallback meal plans:", fallbackPlans);
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

    // Guard clause to ensure mealPlans is an array
    if (!Array.isArray(mealPlans) || mealPlans.length === 0) {
      return 0;
    }

    const selectedPlan = mealPlans.find(p => p.id.toString() === formData.plan);
    if (!selectedPlan) return 0;

    // Formula: Total Price = (Plan Price) × (Number of Meal Types) × (Number of Delivery Days) × 4.3
    const planPrice = selectedPlan.price_per_meal;
    const numMealTypes = formData.mealTypes.length;
    const numDeliveryDays = formData.deliveryDays.length;
    const monthlyMultiplier = 4.3; // Monthly multiplier (weeks per month)

    const totalPrice = planPrice * numMealTypes * numDeliveryDays * monthlyMultiplier;
    
    console.log("Price calculation:", {
      planPrice,
      numMealTypes,
      numDeliveryDays,
      monthlyMultiplier,
      totalPrice
    });

    return totalPrice;
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

  // Handle form field changes with security validation
  const handleInputChange = (field: string, value: string) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    
    switch (field) {
      case 'name':
        sanitizedValue = sanitizeInput(value, 'name');
        break;
      case 'phone':
        sanitizedValue = sanitizeInput(value, 'phone');
        break;
      case 'allergies':
        sanitizedValue = sanitizeInput(value, 'allergies');
        break;
      default:
        sanitizedValue = sanitizeInput(value, 'text');
    }

    // Update form data
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    
    // Clear security errors for this field
    if (securityErrors[field]) {
      setSecurityErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Real-time validation for security
    const fieldData = { [field]: sanitizedValue };
    const validation = validateFormData(fieldData);
    
    if (!validation.isValid && validation.errors[field]) {
      setSecurityErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    }
  };

  // Handle checkbox changes for meal types and delivery days
  const handleCheckboxChange = (field: 'mealTypes' | 'deliveryDays', value: string) => {
    // Sanitize the checkbox value
    const sanitizedValue = sanitizeInput(value, 'text');
    
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(sanitizedValue)
        ? prev[field].filter(item => item !== sanitizedValue)
        : [...prev[field], sanitizedValue]
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    console.log("Validating form with data:", formData);
    const newErrors: Record<string, string> = {};

    // Enhanced validation with security checks
    if (!formData.name.trim()) {
      console.log("Name validation failed:", formData.name);
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = "Name must be between 2 and 50 characters";
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.name)) {
      newErrors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!formData.phone.trim()) {
      console.log("Phone validation failed:", formData.phone);
      newErrors.phone = "Phone number is required";
    } else {
      // Remove all non-numeric characters for validation
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        newErrors.phone = "Phone number must be between 10-15 digits";
      } else if (!/^(\+62|62|0)?[0-9]{9,13}$/.test(formData.phone.replace(/\s/g, ''))) {
        console.log("Phone format validation failed:", formData.phone);
        newErrors.phone = "Please enter a valid phone number";
      }
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

    // Validate allergies field if provided
    if (formData.allergies && formData.allergies.length > 500) {
      newErrors.allergies = "Allergies description is too long (max 500 characters)";
    } else if (formData.allergies && !/^[a-zA-Z0-9\s,.\-()]*$/.test(formData.allergies)) {
      newErrors.allergies = "Allergies field contains invalid characters";
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted!", formData); // Debug log
    console.log("Session data:", session);
    
    if (!session) {
      alert("Please log in to create a subscription");
      return;
    }

    // Security validation
    const securityValidation = validateFormData(formData);
    if (!securityValidation.isValid) {
      setSecurityErrors(securityValidation.errors);
      alert("Security validation failed. Please check your input and remove any invalid characters.");
      return;
    }

    // Check CSRF token
    if (!csrfToken) {
      alert("Security token missing. Please refresh the page and try again.");
      await fetchCSRFToken();
      return;
    }
    
    if (!validateForm()) {
      console.log("Form validation failed", errors); // Debug log
      return;
    }

    setIsSubmitting(true);

    try {
      const subscriptionData = {
        name: escapeHtml(formData.name),
        phone: sanitizeInput(formData.phone, 'phone'),
        plan: formData.plan, // This will be the plan ID as string
        mealTypes: formData.mealTypes.map(type => sanitizeInput(type, 'text')),
        deliveryDays: formData.deliveryDays.map(day => sanitizeInput(day, 'text')),
        allergies: sanitizeInput(formData.allergies, 'allergies'),
        totalPrice: calculateTotalPrice(),
      };

      console.log("Sending subscription data:", subscriptionData); // Debug log

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // Include CSRF token
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(subscriptionData),
      });

      const result = await response.json();
      console.log("API Response:", result); // Debug log

      if (!response.ok) {
        if (response.status === 401) {
          alert("Authentication error: Please log out and log in again.");
          return;
        }
        throw new Error(result.error || 'Failed to submit subscription');
      }

      alert(result.message || "Subscription submitted successfully! We will contact you soon.");
      
      // Reset form but keep the name from session
      setFormData({
        name: session?.user?.name || "",
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
              {/* Session Status Indicator */}
              <div className={`border rounded-lg p-4 ${session ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${session ? 'text-green-800' : 'text-red-800'}`}>
                    {session ? (
                      <>✅ Logged in as: {session.user?.name || session.user?.email}</>
                    ) : (
                      <>❌ Not logged in - Please log in to create a subscription</>
                    )}
                  </span>
                </div>
              </div>

              {/* Debug Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Debug Panel</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={testMealPlans}
                    className="bg-yellow-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Test Meal Plans API
                  </button>
                  <button
                    type="button"
                    onClick={() => console.log("Current form data:", formData)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm ml-2"
                  >
                    Log Form Data
                  </button>
                  <button
                    type="button"
                    onClick={() => console.log("Current errors:", errors)}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm ml-2"
                  >
                    Log Errors
                  </button>
                </div>
                {/* Display current errors */}
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="text-red-800 font-semibold mb-2">Current Validation Errors:</h4>
                    <ul className="list-disc list-inside text-red-700 text-sm">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}><strong>{field}:</strong> {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <p>Meal Plans Loaded: {mealPlans.length}</p>
                  <p>Form Valid: {Object.keys(errors).length === 0 ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
                
                {/* Name Field - Read Only for Authenticated Users */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    readOnly
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-700 border-gray-300 cursor-not-allowed"
                    placeholder="Your name from account"
                  />
                  <p className="text-gray-500 text-sm mt-1">Name is taken from your account</p>
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
                  {securityErrors.phone && <p className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border-l-4 border-red-500">⚠️ {securityErrors.phone}</p>}
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
                {securityErrors.plan && <p className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border-l-4 border-red-500">⚠️ {securityErrors.plan}</p>}
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
                {securityErrors.mealTypes && <p className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border-l-4 border-red-500">⚠️ {securityErrors.mealTypes}</p>}
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
                {securityErrors.deliveryDays && <p className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border-l-4 border-red-500">⚠️ {securityErrors.deliveryDays}</p>}
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
                {errors.allergies && <p className="text-red-500 text-sm mt-1">{errors.allergies}</p>}
                {securityErrors.allergies && <p className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border-l-4 border-red-500">⚠️ {securityErrors.allergies}</p>}
              </div>

              {/* Price Calculation */}
              {totalPrice > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Price Calculation</h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Plan Price per Meal:</span>
                      <span>{formatCurrency((mealPlans || []).find(p => p.id.toString() === formData.plan)?.price_per_meal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meal Types Selected:</span>
                      <span>{formData.mealTypes.length} type(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Days Selected:</span>
                      <span>{formData.deliveryDays.length} day(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Multiplier:</span>
                      <span>4.3 (weeks per month)</span>
                    </div>
                    <hr className="my-3" />
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Formula:</p>
                      <p className="text-sm text-blue-700">
                        {formatCurrency((mealPlans || []).find(p => p.id.toString() === formData.plan)?.price_per_meal || 0)} × {formData.mealTypes.length} × {formData.deliveryDays.length} × 4.3
                      </p>
                    </div>
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
                  onClick={() => console.log("Button clicked!")} // Debug click
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
                
                {/* Alternative button for testing */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Test Submit (Alternative)
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
