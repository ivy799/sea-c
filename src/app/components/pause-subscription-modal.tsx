"use client";

import { useState, useEffect } from "react";

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

interface PauseSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onPause: () => void;
}

export default function PauseSubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onPause,
}: PauseSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch CSRF token when modal opens
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf-token', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    if (isOpen) {
      fetchCsrfToken();
      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setError("");
      setEndDate("");
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

  const handlePause = async () => {
    if (!startDate) {
      setError("Please select a start date for the pause");
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start <= today) {
      setError("Start date must be after today");
      return;
    }

    if (end && end <= start) {
      setError("End date must be after start date");
      return;
    }

    setIsLoading(true);
    setError("");

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

      // Helper function to make the API request
      const makeRequest = async (token: string) => {
        return await fetch(`/api/subscriptions/${subscription.id}/pause`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
          },
          credentials: "include",
          body: JSON.stringify({
            startDate,
            endDate: endDate || null,
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
        onPause();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to pause subscription");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while pausing subscription");
      console.error("Error pausing subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pause Subscription
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Temporarily pause your <strong>{subscription.meal_plan_name}</strong> subscription.
              No charges will be applied during the pause period.
            </p>
          </div>

          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Subscription Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{subscription.meal_plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Price:</span>
                <span className="font-medium">{formatCurrency(subscription.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Pause Period Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Pause Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pause will start from this date (must be at least tomorrow)
              </p>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Pause End Date (Optional)
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to pause indefinitely (you can resume anytime)
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Important:</strong>
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside mt-1 space-y-1">
                  <li>No charges will be applied during the pause period</li>
                  <li>Your subscription will automatically resume after the end date (if specified)</li>
                  <li>You can manually resume the subscription at any time</li>
                  <li>Pause takes effect from the specified start date</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={isLoading || !startDate}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pausing...
                </div>
              ) : (
                "Pause Subscription"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
