// app/admin/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import StatsCard from "@/components/admin/stats-card";
import {
  Users,
  TrendingUp,
  DollarSign,
  Briefcase,
  Calendar,
  Star,
  Loader2,
  BarChart3,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalReviews: 0,
    avgRating: 0,
    activeServiceRequests: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: customersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "customer");

      const { count: providersCount } = await supabase
        .from("providers")
        .select("*", { count: "exact", head: true });

      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      // Fetch total revenue
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue =
        transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Fetch reviews
      const { count: reviewsCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });

      const { data: reviews } = await supabase.from("reviews").select("rating");

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            reviews.length
          : 0;

      // Fetch active service requests
      const { count: activeRequests } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setAnalytics({
        totalUsers: usersCount || 0,
        totalCustomers: customersCount || 0,
        totalProviders: providersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue: totalRevenue,
        totalReviews: reviewsCount || 0,
        avgRating: avgRating,
        activeServiceRequests: activeRequests || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Platform overview and metrics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          trend={null}
        />
        <StatsCard
          title="Providers"
          value={analytics.totalProviders}
          icon={Briefcase}
          trend={null}
          variant="success"
        />
        <StatsCard
          title="Total Bookings"
          value={analytics.totalBookings}
          icon={Calendar}
          trend={null}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(analytics.totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          trend={null}
          variant="success"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalCustomers}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.activeServiceRequests}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalReviews}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.avgRating.toFixed(1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Platform Health */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Platform Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Customer to Provider Ratio
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.totalProviders > 0
                ? (analytics.totalCustomers / analytics.totalProviders).toFixed(
                    1
                  )
                : "0"}
              :1
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Bookings per Provider</p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.totalProviders > 0
                ? (analytics.totalBookings / analytics.totalProviders).toFixed(
                    1
                  )
                : "0"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Avg. Revenue per Booking
            </p>
            <p className="text-3xl font-bold text-gray-900">
              $
              {analytics.totalBookings > 0
                ? (
                    analytics.totalRevenue /
                    analytics.totalBookings /
                    100
                  ).toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Manage Providers</h4>
              <p className="text-sm text-gray-600">
                Review and verify providers
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">View Reports</h4>
              <p className="text-sm text-gray-600">
                Detailed analytics reports
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
