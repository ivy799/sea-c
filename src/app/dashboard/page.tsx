"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AuthNavbar from "@/components/auth-navbar";
import ProtectedRoute from "@/components/protected-route";
import EditSubscriptionModal from "@/app/components/edit-subscription-modal";
import CancelSubscriptionModal from "@/app/components/cancel-subscription-modal";
import PauseSubscriptionModal from "@/app/components/pause-subscription-modal";

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
  is_paused?: boolean;
  paused_until?: string | null;
}

const MEAL_TYPE_NAMES = {
  0: "Breakfast",
  1: "Lunch", 
  2: "Dinner"
};

const DAY_NAMES = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday", 
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<Subscription | null>(null);
  const [pausingSubscription, setPausingSubscription] = useState<Subscription | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptions();
    }
  }, [session]);

  const fetchSubscriptions = async () => {
    try {
      setError("");
      const response = await fetch("/api/subscriptions/my-subscriptions", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        setError("Failed to fetch subscriptions");
      }
    } catch (err) {
      setError("An error occurred while fetching subscriptions");
      console.error("Error fetching subscriptions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string, isPaused?: boolean) => {
    if (isPaused) {
      return "bg-yellow-100 text-yellow-800";
    }
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    setCancellingSubscription(subscription);
  };

  const handlePauseSubscription = (subscription: Subscription) => {
    setPausingSubscription(subscription);
  };

  const handleResumeSubscription = async (subscriptionId: number) => {
    try {
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/subscriptions/${subscriptionId}/pause`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage("Subscription resumed successfully!");
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchSubscriptions();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to resume subscription");
      }
    } catch (err) {
      console.error("Error resuming subscription:", err);
      setError("An error occurred while resuming subscription");
    }
  };

  const handleSubscriptionUpdated = () => {
    setSuccessMessage("Subscription updated successfully!");
    setTimeout(() => setSuccessMessage(""), 5000);
    fetchSubscriptions();
  };

  const handleSubscriptionCancelled = () => {
    setSuccessMessage("Subscription cancelled successfully!");
    setTimeout(() => setSuccessMessage(""), 5000);
    fetchSubscriptions();
  };

  const handleSubscriptionPaused = () => {
    setSuccessMessage("Subscription paused successfully!");
    setTimeout(() => setSuccessMessage(""), 5000);
    fetchSubscriptions();
  };

  const isSubscriptionActive = (status: string, isPaused?: boolean) => {
    return status.toLowerCase() === "active" && !isPaused;
  };

  const isSubscriptionPaused = (status: string, isPaused?: boolean) => {
    return status.toLowerCase() === "paused" || isPaused;
  };

  // Calculate dashboard stats
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(sub => isSubscriptionActive(sub.status, sub.is_paused)).length;
  const pausedSubscriptions = subscriptions.filter(sub => isSubscriptionPaused(sub.status, sub.is_paused)).length;
  const totalMonthlySpending = subscriptions
    .filter(sub => isSubscriptionActive(sub.status, sub.is_paused))
    .reduce((sum, sub) => sum + sub.total_price, 0);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <AuthNavbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AuthNavbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Dashboard</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                {successMessage}
              </div>
            )}

            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-semibold text-gray-900">{activeSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold text-sm">⏸️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Paused Subscriptions</p>
                    <p className="text-2xl font-semibold text-gray-900">{pausedSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monthly Spending</p>
                    <p className="text-2xl font-semibold text-gray-900">Rp{totalMonthlySpending.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriptions List */}
            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t subscribed to any meal plans yet. Start your healthy eating journey today!
                </p>
                <a
                  href="/subscription"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Meal Plans
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Subscriptions</h2>
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {subscription.meal_plan_name}
                        </h3>
                        <p className="text-gray-600">
                          {subscription.meal_types && subscription.meal_types.length > 0 
                            ? subscription.meal_types.map(type => MEAL_TYPE_NAMES[parseInt(type) as keyof typeof MEAL_TYPE_NAMES]).join(", ")
                            : MEAL_TYPE_NAMES[subscription.meal_type as keyof typeof MEAL_TYPE_NAMES]
                          }
                        </p>
                        {subscription.is_paused && subscription.paused_until && (
                          <p className="text-yellow-600 text-sm mt-1">
                            Paused until {new Date(subscription.paused_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          Rp{subscription.total_price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">per month</div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            subscription.status,
                            subscription.is_paused
                          )}`}
                        >
                          {subscription.is_paused ? 'Paused' : subscription.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Days</h4>
                        <div className="flex flex-wrap gap-2">
                          {subscription.delivery_days.map((day) => (
                            <span
                              key={day}
                              className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                            >
                              {DAY_NAMES[parseInt(day) as keyof typeof DAY_NAMES]}
                            </span>
                          ))}
                        </div>
                      </div>

                      {subscription.allergies && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Allergies & Restrictions</h4>
                          <p className="text-gray-600 text-sm">
                            {(() => {
                              try {
                                const parsed = JSON.parse(subscription.allergies);
                                return parsed.allergies || subscription.allergies;
                              } catch (e) {
                                return subscription.allergies;
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {isSubscriptionActive(subscription.status, subscription.is_paused) && (
                        <>
                          <button 
                            onClick={() => handleEditSubscription(subscription)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            Edit Subscription
                          </button>
                          <button 
                            onClick={() => handlePauseSubscription(subscription)}
                            className="px-4 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                          >
                            Pause Subscription
                          </button>
                          <button 
                            onClick={() => handleCancelSubscription(subscription)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            Cancel Subscription
                          </button>
                        </>
                      )}
                      {isSubscriptionPaused(subscription.status, subscription.is_paused) && (
                        <>
                          <button 
                            onClick={() => handleResumeSubscription(subscription.id)}
                            className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                          >
                            Resume Subscription
                          </button>
                          <button 
                            onClick={() => handleCancelSubscription(subscription)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            Cancel Subscription
                          </button>
                        </>
                      )}
                      {subscription.status.toLowerCase() === 'cancelled' && (
                        <div className="text-sm text-gray-500 italic">
                          This subscription has been cancelled and cannot be modified.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Subscription Modal */}
        {editingSubscription && (
          <EditSubscriptionModal
            subscription={editingSubscription}
            isOpen={!!editingSubscription}
            onClose={() => setEditingSubscription(null)}
            onUpdate={handleSubscriptionUpdated}
          />
        )}

        {/* Cancel Subscription Modal */}
        {cancellingSubscription && (
          <CancelSubscriptionModal
            subscription={cancellingSubscription}
            isOpen={!!cancellingSubscription}
            onClose={() => setCancellingSubscription(null)}
            onCancel={handleSubscriptionCancelled}
          />
        )}

        {/* Pause Subscription Modal */}
        {pausingSubscription && (
          <PauseSubscriptionModal
            subscription={pausingSubscription}
            isOpen={!!pausingSubscription}
            onClose={() => setPausingSubscription(null)}
            onPause={handleSubscriptionPaused}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
