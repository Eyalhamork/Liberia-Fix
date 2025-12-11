// app/provider/analytics/page.tsx - LIVE DATA WITH RECHARTS
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  DollarSign,
  Star,
  Clock,
  Calendar,
  MapPin,
  Award,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Loader2,
  FileText,
  MessageSquare,
} from "lucide-react";

interface Analytics {
  total_connections: number;
  active_connections: number;
  connection_revenue: number;
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  bid_acceptance_rate: number;
  active_categories: number;
  active_specialties: number;
  active_photos: number;
  avg_rating: number;
  total_reviews: number;
  active_service_requests: number;
  daily_connections: Array<{
    date: string;
    connections: number;
    revenue: number;
  }>;
  category_distribution: Array<{ name: string; value: number }>;
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
];

function ProviderAnalyticsContent() {
  const { user } = useAuth();
  const supabase = createClient();

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierStatus, setTierStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchTierStatus();
    }
  }, [user, timeRange]);

  const fetchTierStatus = async () => {
    const { data } = await (supabase as any)
      .from("providers")
      .select("subscription_tier, promo_expires_at")
      .eq("user_id", user?.id as string)
      .single() as any as { data: { subscription_tier: string; promo_expires_at: string | null } | null; error: any };

    if (data) {
      const promoActive =
        data.promo_expires_at && new Date(data.promo_expires_at) > new Date();
      setTierStatus({
        tier: data.subscription_tier,
        effective_tier: promoActive ? "pro" : data.subscription_tier,
        promo_active: !!promoActive,
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const { data: provider } = await (supabase as any)
      .from("providers")
        .select("id, total_rating, review_count")
        .eq("user_id", user?.id as string)
        .single() as any as { data: { id: string; total_rating: number; review_count: number } | null; error: any };

      if (!provider) {
        setLoading(false);
        return;
      }

      // Calculate date range
      let dateFilter = new Date();
      if (timeRange === "7d") dateFilter.setDate(dateFilter.getDate() - 7);
      else if (timeRange === "30d")
        dateFilter.setDate(dateFilter.getDate() - 30);
      else if (timeRange === "90d")
        dateFilter.setDate(dateFilter.getDate() - 90);
      else dateFilter = new Date("2000-01-01");

      // Fetch connection stats
      const { count: totalConnections } = await (supabase as any)
      .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .gte("created_at", dateFilter.toISOString());

      const { count: activeConnections } = await (supabase as any)
      .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("payment_status", "completed")
        .gte("created_at", dateFilter.toISOString());

      const { data: revenueData } = await (supabase as any)
      .from("bookings")
        .select("amount, created_at")
        .eq("provider_id", provider.id)
        .eq("payment_status", "completed")
        .gte("created_at", dateFilter.toISOString())
        .order("created_at", { ascending: true }) as { data: Array<{ amount: number; created_at: string }> | null; error: any };

      const connectionRevenue =
        revenueData?.reduce((sum, b) => sum + b.amount, 0) || 0;

      // Process daily data for charts
      const dailyMap = new Map<
        string,
        { connections: number; revenue: number }
      >();
      revenueData?.forEach((booking) => {
        const date = new Date(booking.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const existing = dailyMap.get(date) || { connections: 0, revenue: 0 };
        dailyMap.set(date, {
          connections: existing.connections + 1,
          revenue: existing.revenue + booking.amount,
        });
      });

      const dailyConnections = Array.from(dailyMap.entries()).map(
        ([date, data]) => ({
          date,
          connections: data.connections,
          revenue: data.revenue,
        })
      );

      // Fetch bid stats
      const { count: totalBids } = await (supabase as any)
      .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .gte("created_at", dateFilter.toISOString());

      const { count: pendingBids } = await (supabase as any)
      .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "pending")
        .gte("created_at", dateFilter.toISOString());

      const { count: acceptedBids } = await (supabase as any)
      .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "accepted")
        .gte("created_at", dateFilter.toISOString());

      const { count: rejectedBids } = await (supabase as any)
      .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "rejected")
        .gte("created_at", dateFilter.toISOString());

      const bidAcceptanceRate = totalBids
        ? ((acceptedBids || 0) / totalBids) * 100
        : 0;

      // Fetch service stats
      const { count: activeCategories } = await (supabase as any)
      .from("provider_categories")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      const { count: activeSpecialties } = await (supabase as any)
      .from("provider_specialties")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      const { count: activePhotos } = await (supabase as any)
      .from("provider_photos")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      // Category distribution for pie chart
      const { data: categoryData } = await (supabase as any)
      .from("provider_categories")
        .select("service_category_id")
        .eq("provider_id", provider.id)
        .eq("status", "active") as { data: Array<{ service_category_id: string }> | null; error: any };

      const categoryCount = new Map<string, number>();
      categoryData?.forEach((cat) => {
        const count = categoryCount.get(cat.service_category_id) || 0;
        categoryCount.set(cat.service_category_id, count + 1);
      });

      const categoryDistribution = Array.from(categoryCount.entries()).map(
        ([name, value]) => ({
          name: name || "Other",
          value,
        })
      );

      const { count: activeServiceRequests } = await (supabase as any)
      .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString());

      const avgRating =
        provider.review_count > 0
          ? provider.total_rating / provider.review_count
          : 0;

      setAnalytics({
        total_connections: totalConnections || 0,
        active_connections: activeConnections || 0,
        connection_revenue: connectionRevenue,
        total_bids: totalBids || 0,
        pending_bids: pendingBids || 0,
        accepted_bids: acceptedBids || 0,
        rejected_bids: rejectedBids || 0,
        bid_acceptance_rate: bidAcceptanceRate,
        active_categories: activeCategories || 0,
        active_specialties: activeSpecialties || 0,
        active_photos: activePhotos || 0,
        avg_rating: avgRating,
        total_reviews: provider.review_count,
        active_service_requests: activeServiceRequests || 0,
        daily_connections: dailyConnections,
        category_distribution: categoryDistribution,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const isPro = tierStatus?.effective_tier === "pro";

  // Bid performance data for bar chart
  const bidPerformanceData = [
    { name: "Pending", value: analytics?.pending_bids || 0, fill: "#F59E0B" },
    { name: "Accepted", value: analytics?.accepted_bids || 0, fill: "#10B981" },
    { name: "Rejected", value: analytics?.rejected_bids || 0, fill: "#EF4444" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Track your performance and growth
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2 bg-white rounded-xl p-1 shadow-lg border border-gray-100">
              {[
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" },
                { value: "all", label: "All Time" },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as any)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    timeRange === range.value
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pro Banner */}
          {!isPro && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6" />
                  <div>
                    <h3 className="font-bold text-lg">
                      Unlock Advanced Analytics
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Get detailed insights with Pro tier
                    </p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-white text-purple-600 rounded-lg font-bold hover:bg-blue-50 transition-all">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Connections */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Total Connections
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.total_connections || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics?.active_connections || 0} active
            </p>
          </div>

          {/* Connection Revenue */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Connection Revenue
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${analytics?.connection_revenue.toFixed(0) || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              $
              {(
                (analytics?.connection_revenue || 0) /
                Math.max(1, analytics?.active_connections || 1)
              ).toFixed(2)}{" "}
              per connection
            </p>
          </div>

          {/* Total Bids */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Total Bids
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.total_bids || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics?.pending_bids || 0} pending ·{" "}
              {analytics?.accepted_bids || 0} accepted
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <Star className="h-6 w-6 text-white" />
              </div>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Average Rating
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.avg_rating.toFixed(1) || "0.0"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics?.total_reviews || 0} reviews
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Connection Trends Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Connection & Revenue Trends
            </h3>
            {analytics?.daily_connections &&
            analytics.daily_connections.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.daily_connections}>
                  <defs>
                    <linearGradient
                      id="colorConnections"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="connections"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorConnections)"
                    name="Connections"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No connection data yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Bid Performance Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Bid Performance
            </h3>
            {bidPerformanceData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bidPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {bidPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No bid data yet</p>
                </div>
              </div>
            )}

            {/* Acceptance Rate Progress */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  Acceptance Rate
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {analytics?.bid_acceptance_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                  style={{ width: `${analytics?.bid_acceptance_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service Portfolio & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Service Portfolio */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Service Portfolio
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Categories
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analytics?.active_categories}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Specialties
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {analytics?.active_specialties}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Portfolio Photos
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics?.active_photos}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-pink-600" />
              Service Distribution
            </h3>
            {analytics?.category_distribution &&
            analytics.category_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.category_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name}: ${((percent as any) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.category_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>Add service categories to see distribution</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Available Opportunities
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                {analytics?.active_service_requests}
              </p>
              <p className="text-gray-600">
                Active service requests available to bid on
              </p>
            </div>
            <button
              onClick={() =>
                (window.location.href = "/provider/service-requests")
              }
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
            >
              Browse Requests
              <ArrowUp className="h-5 w-5 rotate-45" />
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Growth Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-bold mb-2">Respond Quickly</h4>
              <p className="text-sm text-blue-100">
                Fast responses increase your chances of winning bids by 3x
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-bold mb-2">Complete Your Profile</h4>
              <p className="text-sm text-blue-100">
                Providers with photos get 5x more connections
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-bold mb-2">Maintain High Ratings</h4>
              <p className="text-sm text-blue-100">
                4.5+ star ratings appear higher in search results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderAnalytics() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderAnalyticsContent />
    </ProtectedRoute>
  );
}
