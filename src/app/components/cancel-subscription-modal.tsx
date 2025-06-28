"use client";

import { useState } from "react";

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

interface CancelSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
}

const MEAL_TYPE_NAMES = {
  0: "Breakfast",
  1: "Lunch",
  2: "Dinner"
};

export default function CancelSubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onCancel,
}: CancelSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        onCancel();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      setError("An error occurred while cancelling subscription");
      console.error("Error cancelling subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Cancel Subscription
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel this subscription? This action cannot be undone.
            </p>
          </div>

          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{subscription.meal_plan_name}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Meal Type:</span>{" "}
                {subscription.meal_types && subscription.meal_types.length > 0 
                  ? subscription.meal_types.map(type => MEAL_TYPE_NAMES[parseInt(type) as keyof typeof MEAL_TYPE_NAMES]).join(", ")
                  : MEAL_TYPE_NAMES[subscription.meal_type as keyof typeof MEAL_TYPE_NAMES]
                }
              </p>
              <p>
                <span className="font-medium">Price:</span> Rp{subscription.total_price.toLocaleString()}/month
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{subscription.status}</span>
              </p>
              {subscription.allergies && (
                <p>
                  <span className="font-medium">Allergies:</span>{" "}
                  {(() => {
                    try {
                      const parsed = JSON.parse(subscription.allergies);
                      return parsed.allergies || "None";
                    } catch (e) {
                      return subscription.allergies;
                    }
                  })()}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
