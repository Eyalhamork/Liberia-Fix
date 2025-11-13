// app/provider/dashboard/page.tsx - MAIN DASHBOARD WITH LIVE DATA
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { SkeletonDashboard, SkeletonList } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NotificationBanner } from "@/components/notifications/notification-banner";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Eye,
  Users,
  DollarSign,
  Star,
  Clock,
  Calendar,
  Briefcase,
  MessageSquare,
  Settings,
  Crown,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Gift,
  Sparkles,
  Bell,
  Award,
  Target,
  TrendingDown,
  FileText,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  profile_views_week: number;
  profile_views_total: number;
  views_trend: number;
  active_service_requests: number;
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  total_earnings: number;
  earnings_this_month: number;
  avg_response_time: number;
  active_categories: number;
  active_specialties: number;
}

interface TierStatus {
  subscription_tier: "free" | "pro";
  promo_expires_at: string | null;
  effective_tier: "free" | "pro";
  promo_active: boolean;
  active_categories: number;
  active_specialties: number;
  active_photos: number;
  verified?: boolean;
}

interface RecentActivity {
  id: string;
  type: "view" | "bid" | "request" | "payment";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

function ProviderDashboardContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchTierStatus(), fetchStats(), fetchRecentActivity()]);
    setLoading(false);
  };

  const fetchTierStatus = async () => {
    try {
      const { data: provider } = await supabase
        .from("providers")
        .select("id, user_id, subscription_tier, promo_expires_at, verified")
        .eq("user_id", user?.id)
        .single();

      if (provider) {
        const promoActive =
          provider.promo_expires_at &&
          new Date(provider.promo_expires_at) > new Date();

        // Get counts
        const { count: catCount } = await supabase
          .from("provider_categories")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("status", "active");

        const { count: specCount } = await supabase
          .from("provider_specialties")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("status", "active");

        const { count: photoCount } = await supabase
          .from("provider_photos")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("status", "active");

        setTierStatus({
          subscription_tier: provider.subscription_tier,
          promo_expires_at: provider.promo_expires_at,
          effective_tier: promoActive ? "pro" : provider.subscription_tier,
          promo_active: !!promoActive,
          active_categories: catCount || 0,
          active_specialties: specCount || 0,
          active_photos: photoCount || 0,
          verified: provider.verified,
        });
      }
    } catch (error) {
      console.error("Error fetching tier status:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!provider) return;

      // Get service request views (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Total bids
      const { count: totalBids } = await supabase
        .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id);

      // Pending bids
      const { count: pendingBids } = await supabase
        .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "pending");

      // Accepted bids
      const { count: acceptedBids } = await supabase
        .from("service_request_bids")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "accepted");

      // Active service requests (that provider can bid on)
      const { count: activeRequests } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString());

      // Categories and specialties
      const { count: catCount } = await supabase
        .from("provider_categories")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      const { count: specCount } = await supabase
        .from("provider_specialties")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      setStats({
        profile_views_week: 0, // TODO: Implement view tracking
        profile_views_total: 0,
        views_trend: 0,
        active_service_requests: activeRequests || 0,
        total_bids: totalBids || 0,
        pending_bids: pendingBids || 0,
        accepted_bids: acceptedBids || 0,
        total_earnings: 0, // TODO: Calculate from completed bookings
        earnings_this_month: 0,
        avg_response_time: 2.5, // TODO: Calculate real response time
        active_categories: catCount || 0,
        active_specialties: specCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!provider) return;

      // Get recent bids
      const { data: recentBids } = await supabase
        .from("service_request_bids")
        .select(
          `
          id,
          amount,
          status,
          created_at,
          service_request:service_requests(title)
        `
        )
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [];

      if (recentBids) {
        recentBids.forEach((bid: any) => {
          activities.push({
            id: bid.id,
            type: "bid",
            title: `Bid submitted`,
            description: `$${bid.amount} on "${
              bid.service_request?.title || "Request"
            }"`,
            timestamp: bid.created_at,
            icon: DollarSign,
            color: "text-green-600",
          });
        });
      }

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  // Calculate days until promo expires
  const daysUntilExpiry = tierStatus?.promo_expires_at
    ? Math.ceil(
        (new Date(tierStatus.promo_expires_at).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/70 to-purple-50/30 md:pb-20 pb-10">
      <Header />
      <NotificationBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <LayoutDashboard className="h-10 w-10 text-blue-600" />
                Welcome back, {profile?.full_name?.split(" ")[0] || "Provider"}!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's your business overview
              </p>
            </div>
            <button
              onClick={() => router.push("/provider/account")}
              className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all font-semibold flex items-center gap-2"
            >
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </div>
        </div>

        {/* Promo Banner (if active) */}
        {tierStatus?.promo_active && daysUntilExpiry > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 animate-bounce" />
                <div>
                  <h3 className="font-bold text-xl">🎉 Pro Features Active!</h3>
                  <p className="text-blue-100">
                    {daysUntilExpiry} days remaining on your promotional access
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{daysUntilExpiry}</div>
                <div className="text-sm text-blue-100">days left</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Service Requests */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Active Requests
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.active_service_requests || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Available to bid on</p>
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
              {stats?.total_bids || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.pending_bids || 0} pending · {stats?.accepted_bids || 0}{" "}
              accepted
            </p>
          </div>

          {/* Categories & Specialties */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Services</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.active_categories || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.active_specialties || 0} specialties
            </p>
          </div>

          {/* Response Time */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Avg Response
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.avg_response_time || 0}h
            </p>
            <p className="text-xs text-gray-500 mt-2">Faster than 78%</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Tier Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push("/provider/service-requests")}
                  className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:border-blue-500 transition-all text-left group"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-gray-900 mb-1">
                    Browse Requests
                  </h3>
                  <p className="text-sm text-gray-600">Find jobs to bid on</p>
                </button>

                <button
                  onClick={() => router.push("/provider/dashboard/services")}
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-500 transition-all text-left group"
                >
                  <Briefcase className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-gray-900 mb-1">
                    Manage Services
                  </h3>
                  <p className="text-sm text-gray-600">Update your offerings</p>
                </button>

                <button
                  onClick={() => router.push("/provider/portfolio")}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 hover:border-green-500 transition-all text-left group"
                >
                  <Award className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-gray-900 mb-1">Portfolio</h3>
                  <p className="text-sm text-gray-600">Showcase your work</p>
                </button>

                <button
                  onClick={() => router.push("/provider/analytics")}
                  className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-100 hover:border-orange-500 transition-all text-left group"
                >
                  <TrendingUp className="h-8 w-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-gray-900 mb-1">Analytics</h3>
                  <p className="text-sm text-gray-600">View your stats</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className={`p-2 bg-white rounded-lg ${activity.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-sm text-gray-500">
                    Start bidding on requests to see activity here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tier Status & Profile */}
          <div className="space-y-6">
            {/* Tier Status Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {tierStatus?.effective_tier === "pro" ? (
                    <>
                      <Crown className="h-6 w-6 text-purple-600" />
                      <span>PRO Tier</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-6 w-6 text-gray-600" />
                      <span>Free Tier</span>
                    </>
                  )}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Categories
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {tierStatus?.active_categories}/
                      {tierStatus?.effective_tier === "pro" ? "5" : "1"}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((tierStatus?.active_categories || 0) /
                            (tierStatus?.effective_tier === "pro" ? 5 : 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Specialties
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      {tierStatus?.active_specialties}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Max {tierStatus?.effective_tier === "pro" ? "25" : "3"}{" "}
                    total
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Photos
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {tierStatus?.active_photos}/
                      {tierStatus?.effective_tier === "pro" ? "20" : "1"}
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((tierStatus?.active_photos || 0) /
                            (tierStatus?.effective_tier === "pro" ? 20 : 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {tierStatus?.effective_tier === "free" && (
                <button
                  onClick={() => router.push("/provider/subscription")}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Upgrade to Pro
                </button>
              )}
            </div>

            {/* Profile Completion */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Profile Completion
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">Basic Info</span>
                  </div>
                  <span className="text-xs font-semibold text-green-600">
                    Done
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(tierStatus?.active_categories || 0) > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-700">Services</span>
                  </div>
                  <button
                    onClick={() => router.push("/provider/dashboard/services")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {(tierStatus?.active_categories || 0) > 0
                      ? "Manage"
                      : "Add"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(tierStatus?.active_photos || 0) > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-700">Portfolio</span>
                  </div>
                  <button
                    onClick={() => router.push("/provider/portfolio")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {(tierStatus?.active_photos || 0) > 0 ? "Update" : "Add"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tierStatus?.verified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-700">Verification</span>
                  </div>
                  <button
                    onClick={() => router.push("/provider/verification")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {tierStatus?.verified ? "Verified ✓" : "Get Verified"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderDashboardContent />
    </ProtectedRoute>
  );
}
