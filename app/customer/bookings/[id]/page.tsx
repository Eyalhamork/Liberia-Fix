// app/customer/bookings/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Phone,
  MapPin,
  FileText,
  Loader2,
  Award,
  Eye,
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
}

function BookingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user && params.id) {
      fetchBooking(abortController.signal);
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id, params.id]);

  const fetchBooking = async (signal: AbortSignal) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
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
        .eq("id", params.id)
        .eq("customer_id", user?.id)
        .single()
        .abortSignal(signal);

      if (isMountedRef.current && !signal.aborted) {
        if (fetchError) {
          setError(fetchError.message);
        } else if (!data) {
          setError("Booking not found");
        } else {
          setBooking(data as Booking);
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") {
        console.log("Request cancelled");
        return;
      }

      if (isMountedRef.current) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking");
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      confirmed: {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle2,
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${badge.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Paid
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    }
  };

  const getAvgRating = (provider: any) => {
    if (!provider || provider.review_count === 0) return "New";
    return (provider.total_rating / provider.review_count).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This booking doesn't exist"}
          </p>
          <button
            onClick={() => router.push("/customer/bookings")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const provider = booking.providers;
  const avgRating = getAvgRating(provider);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Booking Details
                  </h1>
                  <p className="text-sm text-gray-600">
                    Created on{" "}
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {getPaymentStatusBadge(booking.payment_status)}
                  {getStatusBadge(booking.booking_status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Service Description
                  </p>
                  <p className="text-gray-900 font-medium">
                    {booking.service_description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-700">
                        Booking Fee
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(booking.booking_fee || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-700">
                        Payment Method
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 capitalize">
                      {booking.payment_method?.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {booking.booking_date && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-gray-700">
                        Scheduled Date
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {booking.transaction_id && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                    <p className="text-sm font-mono text-gray-900">
                      {booking.transaction_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            {booking.payment_status === "completed" && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
                <h2 className="text-xl font-bold mb-4">
                  Contact & Communication
                </h2>
                <p className="text-blue-100 mb-4">
                  You've unlocked this provider's contact information. You can
                  now message them directly.
                </p>
                <button
                  onClick={() =>
                    router.push(`/customer/messages/${provider?.user_id}`)
                  }
                  className="w-full px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Send Message to Provider
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Provider Info */}
          <div className="space-y-6">
            {/* Provider Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Provider Details
              </h2>

              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-gray-100">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                    {provider?.business_name?.charAt(0) || "?"}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {provider?.business_name || "Unknown Provider"}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {avgRating}
                    </span>
                    {provider && provider.review_count > 0 && (
                      <span className="text-sm text-gray-500">
                        ({provider.review_count} reviews)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {provider?.hourly_rate && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${provider.hourly_rate}/hr
                      </span>
                    </div>
                  )}

                  {provider?.subscription_tier && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-sm text-gray-600">Tier</span>
                      <span className="text-sm font-bold text-purple-900 uppercase">
                        {provider.subscription_tier}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    router.push(`/search/provider/${provider?.id}`)
                  }
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Eye className="h-5 w-5" />
                  View Full Profile
                </button>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    If you have any issues with this booking, contact our
                    support team.
                  </p>
                  <button
                    onClick={() => router.push("/contact")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Contact Support →
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

export default function BookingDetailPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <BookingDetailContent />
    </ProtectedRoute>
  );
}
