// app/customer/bookings/page.tsx - FIXED WITH ABORT CONTROLLERS
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { SkeletonBookingCard } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Award,
  ChevronDown,
  Phone,
  MapPin,
  MessageSquare,
  AlertCircle,
  FileText,
} from "lucide-react";

interface Booking {
  id: string;
  provider_id: string;
  customer_id: string;
  booking_fee: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  service_description: string;
  booking_date: string;
  booking_status: string;
  created_at: string;
  providers: {
    id: string;
    business_name: string;
    hourly_rate: number;
    total_rating: number;
    review_count: number;
    subscription_tier: string;
    user_id: string;
  } | null;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

function BookingsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    total_spent: 0,
  });

  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user) {
      fetchBookings(abortController.signal);
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id]); // FIXED: Use user?.id instead of user

  const fetchBookings = async (signal: AbortSignal) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Fetch all bookings (contact unlocks) for this customer
      const { data: bookingsData, error: bookingsError } = await (supabase as any)
      .from("bookings")
        .select(
          `
          id,
          provider_id,
          customer_id,
          booking_fee,
          payment_method,
          payment_status,
          transaction_id,
          service_description,
          booking_date,
          booking_status,
          created_at,
          providers (
            id,
            business_name,
            hourly_rate,
            total_rating,
            review_count,
            subscription_tier,
            user_id
          )
        `
        )
        .eq("customer_id", user?.id as string)
        .order("created_at", { ascending: false })
        .abortSignal(signal) as {
          data: Array<{
            id: string;
            provider_id: string;
            customer_id: string;
            booking_fee: number | null;
            payment_method: string;
            payment_status: string;
            transaction_id: string | null;
            service_description: string | null;
            booking_date: string;
            booking_status: string;
            created_at: string;
            providers: {
              id: string;
              business_name: string;
              hourly_rate: number;
              total_rating: number;
              review_count: number;
              subscription_tier: string;
              user_id: string;
            } | null;
          }> | null;
          error: any;
        };

      if (isMountedRef.current && !signal.aborted) {
        if (bookingsError) throw bookingsError;

        // Fetch reviews for each booking
        const bookingsWithReviews = await Promise.all(
          (bookingsData || []).map(async (booking: any) => {
            const { data: reviewData } = await (supabase as any)
      .from("reviews")
              .select("id, rating, comment, created_at")
              .eq("customer_id", user?.id as string)
              .eq("provider_id", booking.provider_id)
              .order("created_at", { ascending: false })
              .abortSignal(signal) as {
                data: Array<{
                  id: string;
                  rating: number;
                  comment: string;
                  created_at: string;
                }> | null;
              };

            return {
              ...booking,
              reviews: reviewData || [],
            };
          })
        );

        setBookings(bookingsWithReviews as Booking[]);

        // Calculate stats
        const completed = bookingsWithReviews.filter(
          (b: any) => b.payment_status === "completed"
        ).length;
        const totalSpent = bookingsWithReviews
          .filter((b: any) => b.payment_status === "completed")
          .reduce((sum: number, b: any) => sum + (b.booking_fee || 0), 0);

        setStats({
          total: bookingsWithReviews.length,
          completed,
          total_spent: totalSpent,
        });

        setLoading(false);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.code === "PGRST301") {
        console.log("Request cancelled");
        return;
      }

      if (isMountedRef.current) {
        console.error("Error fetching bookings:", error);
        setLoading(false);
      }
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && booking.payment_status === "completed") ||
      (filter === "pending" && booking.payment_status === "pending");

    const matchesSearch = booking.providers?.business_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getAvgRating = (provider: any) => {
    if (!provider || provider.review_count === 0) return "New";
    return (provider.total_rating / provider.review_count).toFixed(1);
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Active
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse mb-8" />
          <SkeletonBookingCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600">
                Manage providers you've unlocked and leave reviews
              </p>
            </div>
          </div>

          {/* Stats Cards - Simplified to match service requests style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Unlocked</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${stats.total_spent.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by provider name..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Filter className="h-5 w-5" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filter Tabs */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-gray-100">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                  filter === "completed"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                  filter === "pending"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Pending
              </button>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Providers Unlocked Yet
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Start unlocking providers to see them here!"}
            </p>
            <button
              onClick={() => router.push("/search")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Search className="h-5 w-5" />
              Find Providers
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const provider = booking.providers;
              const avgRating = getAvgRating(provider);
              const hasReview = booking.reviews.length > 0;
              const review = booking.reviews[0];

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {provider?.business_name || "Unknown Provider"}
                            </h3>
                            {getStatusBadge(booking.payment_status)}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-900">
                              {avgRating}
                            </span>
                            {provider && provider.review_count > 0 && (
                              <span className="text-sm text-gray-500">
                                ({provider.review_count} reviews)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Unlocked:{" "}
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">
                            ${(booking.booking_fee || 0).toFixed(2)} •{" "}
                            {booking.payment_method}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-xs">
                            ID: {booking.transaction_id?.substring(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Review Section */}
                      {hasReview && review && (
                        <div className="mt-4 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-900">
                              Your Review
                            </p>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-700">
                            {review.comment}
                          </p>
                        </div>
                      )}

                      {!hasReview && booking.payment_status === "completed" && (
                        <div className="mt-4 bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                              You haven't reviewed this provider yet
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:min-w-[180px]">
                      <button
                        onClick={() =>
                          router.push(`/customer/bookings/${booking.id}`)
                        }
                        className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>

                      {booking.payment_status === "completed" && (
                        <>
                          <button
                            onClick={() =>
                              router.push(
                                `/customer/messages/${provider?.user_id}`
                              )
                            }
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </button>

                          {!hasReview && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/customer/review/${provider?.id}?booking_id=${booking.id}`
                                )
                              }
                              className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                            >
                              <Star className="h-4 w-4" />
                              Leave Review
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <BookingsContent />
    </ProtectedRoute>
  );
}
