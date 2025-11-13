// app/provider/bookings/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Calendar,
  User,
  Phone,
  MapPin,
  Mail,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  Users,
  MessageSquare,
  Search,
  Shield,
  Info,
} from "lucide-react";

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  booking_fee: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  created_at: string;
  customer_profile?: {
    full_name: string;
    phone: string;
    email: string;
    location: string;
    avatar_url: string;
  };
}

function ProviderBookingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const isMountedRef = useRef(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user) {
      fetchBookings(abortController.signal);
    } else {
      router.push("/login");
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id]);

  const fetchBookings = async (signal: AbortSignal) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Get provider ID
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .abortSignal(signal)
        .single();

      if (signal.aborted) return;

      if (providerError || !provider) {
        console.error("Provider error:", providerError);
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Fetch bookings without join first
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          customer_id,
          provider_id,
          booking_fee,
          payment_method,
          payment_status,
          transaction_id,
          created_at
        `
        )
        .eq("provider_id", provider.id)
        .abortSignal(signal)
        .order("created_at", { ascending: false });

      if (signal.aborted) return;

      if (bookingsError) {
        console.error("❌ Bookings error:", bookingsError);
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Fetch customer profiles separately for each booking
      const bookingsWithProfiles = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          if (signal.aborted) return null;

          // Fetch customer profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, email, location, avatar_url")
            .eq("id", booking.customer_id)
            .abortSignal(signal)
            .single();

          if (signal.aborted) return null;

          return {
            ...booking,
            customer_profile: profile || undefined,
          };
        })
      );

      if (signal.aborted) return;

      if (isMountedRef.current) {
        const validBookings = bookingsWithProfiles.filter((b) => b !== null);
        setBookings(validBookings as Booking[]);

        // Calculate stats
        const completed =
          validBookings.filter((b) => b?.payment_status === "completed")
            .length || 0;
        const pending =
          validBookings.filter((b) => b?.payment_status === "pending").length ||
          0;

        setStats({
          total: validBookings.length,
          completed,
          pending,
        });

        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") {
        return;
      }
      if (isMountedRef.current) {
        console.error("Error:", err);
        setLoading(false);
      }
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && booking.payment_status === "completed") ||
      (filter === "pending" && booking.payment_status === "pending");

    const matchesSearch =
      searchQuery === "" ||
      booking.customer_profile?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking.customer_profile?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">
            Customers who have unlocked your contact information
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                How Bookings Work
              </p>
              <p className="text-sm text-gray-700">
                When customers pay $3 to unlock your contact, they appear here.
                You receive their full contact information and can message them
                directly through the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === "completed"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === "pending"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No matching bookings" : "No bookings yet"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try a different search term"
                : "Customers who unlock your contact will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => {
              const customer = booking.customer_profile;
              const isCompleted = booking.payment_status === "completed";
              const isPending = booking.payment_status === "pending";

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Customer Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="relative">
                        {customer?.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={customer.full_name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {customer?.full_name || "Customer"}
                          </h3>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Paid
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                              <Clock className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Contact Info - Only show if completed */}
                        {isCompleted && customer && (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="h-5 w-5 text-green-600" />
                              <p className="font-bold text-green-900">
                                Customer Contact Information
                              </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <a
                                href={`tel:${customer.phone}`}
                                className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                              >
                                <Phone className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="font-medium">
                                    {customer.phone || "No phone"}
                                  </p>
                                </div>
                              </a>
                              <a
                                href={`mailto:${customer.email}`}
                                className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                              >
                                <Mail className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p className="font-medium text-sm">
                                    {customer.email || "No email"}
                                  </p>
                                </div>
                              </a>
                            </div>
                            {customer.location && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{customer.location}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Info */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-blue-700">
                              ${booking.booking_fee}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {new Date(booking.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isCompleted && (
                      <div className="flex lg:flex-col gap-3 lg:min-w-[180px]">
                        <button
                          onClick={() =>
                            router.push(
                              `/provider/messages/${booking.customer_id}`
                            )
                          }
                          className="flex-1 lg:flex-none px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        {filteredBookings.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">💡 Best Practices</h2>
              <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="font-semibold mb-2">✅ Do:</p>
                  <ul className="space-y-1 text-blue-50">
                    <li>• Respond within 24 hours</li>
                    <li>• Be professional and courteous</li>
                    <li>• Confirm service details clearly</li>
                    <li>• Follow up after service completion</li>
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <p className="font-semibold mb-2">❌ Don't:</p>
                  <ul className="space-y-1 text-blue-50">
                    <li>• Request payment outside platform</li>
                    <li>• Share inappropriate content</li>
                    <li>• Ignore customer messages</li>
                    <li>• Overpromise and underdeliver</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderBookings() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderBookingsContent />
    </ProtectedRoute>
  );
}
