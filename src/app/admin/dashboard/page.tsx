"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AuthNavbar from "@/components/auth-navbar";
import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/db/schema";

interface DashboardMetrics {
  newSubscriptions: number;
  mrr: number;
  reactivations: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  growthPercentage: number;
}

interface StatusBreakdown {
  [key: string]: number;
}

interface PopularPlan {
  name: string;
  count: number;
  revenue: number;
}

interface RecentSubscription {
  id: number;
  user_name: string;
  meal_plan_name: string;
  total_price: number;
  status: string;
}

interface DashboardData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: DashboardMetrics;
  statusBreakdown: StatusBreakdown;
  popularPlans: PopularPlan[];
  recentSubscriptions: RecentSubscription[];
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session, startDate, endDate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/admin/dashboard?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
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

  const MetricCard = ({ title, value, subtitle, icon, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`inline-flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗️' : '↘️'} {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500 ml-1">vs previous period</span>
            </div>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole={UserRole.Admin}>
        <div className="min-h-screen bg-gray-50">
          <AuthNavbar />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.Admin}>
      <div className="min-h-screen bg-gray-50">
        <AuthNavbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor subscription metrics and business performance</p>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Date Range Filter</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filter
              </button>
            </div>
            {dashboardData && (
              <p className="text-sm text-gray-500 mt-2">
                Showing data from {new Date(dashboardData.dateRange.startDate).toLocaleDateString()} to {new Date(dashboardData.dateRange.endDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {dashboardData && (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="New Subscriptions"
                  value={dashboardData.metrics.newSubscriptions}
                  subtitle="during selected period"
                  icon="🆕"
                  trend={{
                    value: dashboardData.metrics.growthPercentage,
                    isPositive: dashboardData.metrics.growthPercentage >= 0
                  }}
                />
                <MetricCard
                  title="Monthly Recurring Revenue"
                  value={formatCurrency(dashboardData.metrics.mrr)}
                  subtitle="from active subscriptions"
                  icon="💰"
                />
                <MetricCard
                  title="Reactivations"
                  value={dashboardData.metrics.reactivations}
                  subtitle="during selected period"
                  icon="🔄"
                />
                <MetricCard
                  title="Active Subscriptions"
                  value={dashboardData.metrics.activeSubscriptions}
                  subtitle={`of ${dashboardData.metrics.totalSubscriptions} total`}
                  icon="📈"
                />
              </div>

              {/* Charts and Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Subscription Status Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Subscription Status</h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardData.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Subscriptions</span>
                      <span className="font-semibold">{dashboardData.metrics.totalSubscriptions}</span>
                    </div>
                  </div>
                </div>

                {/* Popular Meal Plans */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🍽️ Popular Meal Plans</h3>
                  <div className="space-y-4">
                    {dashboardData.popularPlans.map((plan, index) => (
                      <div key={plan.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            <p className="text-sm text-gray-500">{plan.count} subscribers</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(plan.revenue)}</p>
                          <p className="text-sm text-gray-500">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Subscriptions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🕒 Recent Subscriptions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meal Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.recentSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{subscription.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription.user_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription.meal_plan_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(subscription.total_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                              {subscription.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboardData.recentSubscriptions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No subscriptions found in the selected date range.
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">💡 Key Insight</h4>
                  <p className="text-blue-100">
                    {dashboardData.metrics.activeSubscriptions > 0 ? (
                      `Average revenue per active subscription: ${formatCurrency(dashboardData.metrics.mrr / dashboardData.metrics.activeSubscriptions)}`
                    ) : (
                      "No active subscriptions found."
                    )}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">📊 Growth Rate</h4>
                  <p className="text-green-100">
                    {dashboardData.metrics.growthPercentage >= 0 ? "📈" : "📉"} {Math.abs(dashboardData.metrics.growthPercentage)}% 
                    {dashboardData.metrics.growthPercentage >= 0 ? " growth" : " decline"} vs previous period
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">🎯 Conversion</h4>
                  <p className="text-purple-100">
                    {dashboardData.metrics.totalSubscriptions > 0 ? (
                      `${Math.round((dashboardData.metrics.activeSubscriptions / dashboardData.metrics.totalSubscriptions) * 100)}% of all subscriptions are currently active`
                    ) : (
                      "No subscription data available."
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
