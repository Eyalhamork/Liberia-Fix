// app/customer/dashboard/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import {
  Search,
  Calendar,
  Heart,
  Star,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Clock,
  FileText,
  Plus,
  Eye,
  MapPin,
  DollarSign,
  Loader2,
  Zap,
  CreditCard,
  AlertCircle,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  urgency: string;
  bid_count: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface Booking {
  id: string;
  provider: {
    name: string;
    avatar: string;
  };
  service_description: string;
  booking_status: string;
  booking_date: string;
  created_at: string;
}

function DashboardContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [stats, setStats] = useState({
    active_requests: 0,
    total_bids: 0,
    total_bookings: 0,
  });

  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user) {
      fetchServiceRequests(abortController.signal);
      fetchBookings(abortController.signal);
      fetchStats(abortController.signal);
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id]); // FIXED: Use user?.id instead of user

  const fetchServiceRequests = async (signal: AbortSignal) => {
    try {
      const { data, error } = await (supabase as any)
      .from("service_requests")
        .select("*")
        .eq("customer_id", user?.id as string)
        .in("status", ["draft", "active"])
        .order("created_at", { ascending: false })
        .limit(3)
        .abortSignal(signal) as {
          data: Array<{
            id: string;
            title: string;
            description: string;
            category: string;
            location: string;
            budget_min: number;
            budget_max: number;
            urgency: string;
            bid_count: number;
            status: string;
            payment_status: string;
            created_at: string;
          }> | null;
          error: any;
        };

      if (isMountedRef.current && !signal.aborted) {
        if (error) throw error;
        setRequests(data || []);
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") return;
      if (isMountedRef.current) {
        console.error("Error fetching requests:", err);
        setLoading(false);
      }
    }
  };

  const fetchBookings = async (signal: AbortSignal) => {
    try {
      const { data, error } = await (supabase as any)
      .from("bookings")
        .select(
          `
          id,
          service_description,
          booking_status,
          booking_date,
          created_at,
          provider:providers(
            business_name,
            profile:profiles(full_name, avatar_url)
          )
        `
        )
        .eq("customer_id", user?.id as string)
        .order("created_at", { ascending: false })
        .limit(3)
        .abortSignal(signal) as {
          data: Array<{
            id: string;
            service_description: string | null;
            booking_status: string;
            booking_date: string;
            created_at: string;
            provider: {
              business_name: string | null;
              profile: {
                full_name: string | null;
                avatar_url: string | null;
              } | null;
            } | null;
          }> | null;
          error: any;
        };

      if (isMountedRef.current && !signal.aborted) {
        if (error) throw error;

        const transformedBookings =
          data?.map((booking) => ({
            id: booking.id,
            provider: {
              name:
                booking.provider?.profile?.full_name ||
                booking.provider?.business_name ||
                "Unknown Provider",
              avatar: booking.provider?.profile?.avatar_url || "",
            },
            service_description: booking.service_description || "",
            booking_status: booking.booking_status,
            booking_date: booking.booking_date,
            created_at: booking.created_at,
          })) || [];

        setBookings(transformedBookings);
        setLoadingBookings(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") return;
      if (isMountedRef.current) {
        console.error("Error fetching bookings:", err);
        setLoadingBookings(false);
      }
    }
  };

  const fetchStats = async (signal: AbortSignal) => {
    try {
      const { count: activeCount } = await (supabase as any)
      .from("service_requests")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user?.id as string)
        .in("status", ["draft", "active"])
        .abortSignal(signal);

      const { data: requestsWithBids } = await (supabase as any)
      .from("service_requests")
        .select("bid_count")
        .eq("customer_id", user?.id as string)
        .abortSignal(signal) as {
          data: Array<{ bid_count: number }> | null;
        };

      const totalBids =
        requestsWithBids?.reduce((sum, r) => sum + r.bid_count, 0) || 0;

      const { count: bookingsCount } = await (supabase as any)
      .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user?.id as string)
        .abortSignal(signal);

      if (isMountedRef.current && !signal.aborted) {
        setStats({
          active_requests: activeCount || 0,
          total_bids: totalBids,
          total_bookings: bookingsCount || 0,
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") return;
      if (isMountedRef.current) {
        console.error("Error fetching stats:", err);
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: { label: "ASAP", color: "bg-red-100 text-red-800", icon: Zap },
      "within-3-days": {
        label: "3 Days",
        color: "bg-orange-100 text-orange-800",
        icon: Clock,
      },
      "this-week": {
        label: "This Week",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      flexible: {
        label: "Flexible",
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
      },
    };
    const badge = badges[urgency as keyof typeof badges] || badges.flexible;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${badge.color}`}
      >
        <badge.icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      confirmed: {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <NotificationBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {profile?.full_name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to find the perfect service provider?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-sm text-blue-100 mb-1">Active Requests</p>
            <p className="text-3xl font-bold text-white">
              {stats.active_requests}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-sm text-purple-100 mb-1">Total Bids</p>
            <p className="text-3xl font-bold text-white">{stats.total_bids}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            </div>
            <p className="text-sm text-green-100 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-white">
              {stats.total_bookings}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push("/search")}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 hover:border-blue-500 hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-blue-50 rounded-xl mb-3 group-hover:bg-blue-100 transition-colors">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Find Services</p>
          </button>

          <button
            onClick={() => router.push("/customer/bookings")}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 hover:border-purple-500 hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-purple-50 rounded-xl mb-3 group-hover:bg-purple-100 transition-colors">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">My Bookings</p>
          </button>

          <button
            onClick={() => router.push("/customer/service-requests")}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 hover:border-orange-500 hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-orange-50 rounded-xl mb-3 group-hover:bg-orange-100 transition-colors">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              Service Requests
            </p>
          </button>

          <button
            onClick={() => router.push("/customer/favorites")}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100 hover:border-pink-500 hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-pink-50 rounded-xl mb-3 group-hover:bg-pink-100 transition-colors">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">Favorites</p>
          </button>
        </div>

        {/* Service Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                My Service Requests
              </h2>
              <p className="text-gray-600 text-sm">
                Track your active service requests and bids
              </p>
            </div>
            <button
              onClick={() => router.push("/customer/service-request/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Create Request</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 shadow-lg border-2 border-blue-200 text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Service Requests Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Post your first service request and get up to 10 competitive
                bids from professional providers in your area!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() =>
                    router.push("/customer/service-request/create")
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Request
                </button>
                <button
                  onClick={() => router.push("/how-it-works")}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-300 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all"
                >
                  <Eye className="h-5 w-5" />
                  How It Works
                </button>
              </div>

              {/* Benefits Grid */}
              <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
                <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
                  <div className="text-2xl mb-2">💰</div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    Compare Prices
                  </p>
                  <p className="text-xs text-gray-600">
                    Get multiple quotes and choose the best deal
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    Fast Responses
                  </p>
                  <p className="text-xs text-gray-600">
                    Receive bids within hours from verified pros
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    Quality Guaranteed
                  </p>
                  <p className="text-xs text-gray-600">
                    All providers are vetted and rated by customers
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Unpaid Requests Warning */}
              {requests.some((r) => r.payment_status === "pending") && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        ⚠️{" "}
                        {
                          requests.filter((r) => r.payment_status === "pending")
                            .length
                        }{" "}
                        Unpaid Request
                        {requests.filter((r) => r.payment_status === "pending")
                          .length > 1
                          ? "s"
                          : ""}
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Complete payment to make your requests visible to
                        providers and start receiving bids.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/customer/service-requests/${request.id}`)
                  }
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {request.title}
                            </h3>
                            {getUrgencyBadge(request.urgency)}
                            {request.payment_status === "pending" && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-semibold">
                                💳 Payment Required
                              </span>
                            )}
                            {request.payment_status === "completed" &&
                              request.status === "active" && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                                  ✅ Live
                                </span>
                              )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-1">
                            {request.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{request.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.location.substring(0, 20)}...</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">
                            ${request.budget_min} - ${request.budget_max}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {request.payment_status === "pending" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/customer/service-request/${request.id}/payment`
                            );
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay $7 Now
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                              {request.bid_count} bid
                              {request.bid_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {requests.length >= 3 && (
                <button
                  onClick={() => router.push("/customer/service-requests")}
                  className="w-full py-4 bg-white border-2 border-blue-200 rounded-2xl font-semibold text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  View All Requests
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Bookings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Recent Bookings
              </h2>
              <p className="text-gray-600 text-sm">
                Your service booking history
              </p>
            </div>
            <button
              onClick={() => router.push("/customer/bookings")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              <Eye className="h-5 w-5" />
              <span className="hidden sm:inline">View All</span>
            </button>
          </div>

          {loadingBookings ? (
            <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 shadow-lg border-2 border-green-200 text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-2xl mb-4">
                <Calendar className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Bookings Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Browse our verified providers and book your first service today!
              </p>
              <button
                onClick={() => router.push("/search")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                <Search className="h-5 w-5" />
                Find Providers
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 transition-all cursor-pointer group"
                  onClick={() => router.push("/customer/bookings")}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {booking.provider.avatar ? (
                        <img
                          src={booking.provider.avatar}
                          alt={booking.provider.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        booking.provider.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-1">
                        {booking.provider.name}
                      </h3>
                      {getBookingStatusBadge(booking.booking_status)}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {booking.service_description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Need a Service? We've Got You Covered!
            </h2>
            <p className="text-blue-100 mb-6">
              Browse thousands of verified providers or post a custom request to
              get competitive bids from top professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/search")}
                className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
              >
                Browse Providers
              </button>
              <button
                onClick={() => router.push("/customer/service-request/create")}
                className="px-8 py-3 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                Post a Request
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
