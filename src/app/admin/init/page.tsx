"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminInitPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState("");

  const initializeMealPlans = async () => {
    setIsInitializing(true);
    setMessage("");

    try {
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchMealPlans = async () => {
    try {
      const response = await fetch('/api/meal-plans');
      const result = await response.json();

      if (result.success) {
        setMessage(`📋 Found ${result.data.length} meal plans:\n${result.data.map((plan: any) => `- ${plan.name}: Rp${plan.price_per_meal.toLocaleString()}`).join('\n')}`);
      } else {
        setMessage(`❌ Error fetching plans: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Initialization</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Meal Plans Setup</h2>
              <p className="text-gray-600 mb-4">
                Initialize the meal plans in the database if they don't exist yet.
              </p>
              
              <div className="space-x-4">
                <Button
                  onClick={initializeMealPlans}
                  disabled={isInitializing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isInitializing ? "Initializing..." : "Initialize Meal Plans"}
                </Button>
                
                <Button
                  onClick={fetchMealPlans}
                  variant="outline"
                >
                  Check Current Plans
                </Button>
              </div>
            </div>

            {message && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm whitespace-pre-wrap">{message}</pre>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Run this initialization only once when setting up the database</li>
              <li>Make sure your database is properly connected</li>
              <li>This will create the basic meal plans needed for the subscription system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
