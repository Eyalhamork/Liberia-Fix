// app/provider/bids/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Phone,
  Mail,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Loader2,
  Award,
  Calendar,
  MapPin,
  Shield,
  Info,
  User,
} from "lucide-react";

interface Bid {
  id: string;
  provider_id: string;
  amount: number;
  estimated_duration: string;
  availability: string;
  message: string;
  status: string;
  created_at: string;
  selected_at: string | null;
  service_requests: {
    id: string;
    title: string;
    description: string;
    location: string;
    budget_min: number;
    budget_max: number;
    urgency: string;
    status: string;
    customer_id: string;
    service_category_id: string;
  };
  customer_profile?: {
    full_name: string;
    phone: string;
    email: string;
    avatar_url: string;
  };
}

function ProviderBidsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();
  const isMountedRef = useRef(true);

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "selected" | "rejected"
  >("all");
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    selected: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    if (searchParams?.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user) {
      fetchBids(abortController.signal);
    } else {
      router.push("/login");
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id, filter]);

  const fetchBids = async (signal: AbortSignal) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Get provider ID
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .abortSignal(signal)
        .single();

      if (signal.aborted) return;

      if (providerError || !providerData) {
        console.error("Provider error:", providerError);
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Build query with filter
      let query = supabase
        .from("service_request_bids")
        .select(
          `
          *,
          service_requests!inner(
            id,
            title,
            description,
            location,
            budget_min,
            budget_max,
            urgency,
            status,
            customer_id,
            service_category_id
          )
        `
        )
        .eq("provider_id", providerData.id)
        .abortSignal(signal)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: bidsData, error: bidsError } = await query;

      if (signal.aborted) return;

      if (isMountedRef.current) {
        if (bidsError) {
          console.error("Bids error:", bidsError);
          setLoading(false);
          return;
        }

        // For selected bids, fetch customer profiles
        const bidsWithCustomers = await Promise.all(
          (bidsData || []).map(async (bid) => {
            if (
              bid.status === "selected" &&
              bid.service_requests?.customer_id
            ) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, phone, email, avatar_url")
                .eq("id", bid.service_requests.customer_id)
                .abortSignal(signal)
                .single();

              if (signal.aborted) return null;

              return {
                ...bid,
                customer_profile: profile || undefined,
              };
            }
            return bid;
          })
        );

        if (signal.aborted) return;

        const validBids = bidsWithCustomers.filter((b) => b !== null);
        setBids(validBids as Bid[]);

        // Calculate stats
        const allBids = bidsData || [];
        const pending = allBids.filter((b) => b.status === "pending").length;
        const selected = allBids.filter((b) => b.status === "selected").length;
        const rejected = allBids.filter((b) => b.status === "rejected").length;

        setStats({
          pending,
          selected,
          rejected,
          total: allBids.length,
        });

        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") {
        console.log("Request cancelled");
        return;
      }
      if (isMountedRef.current) {
        console.error("Error fetching bids:", err);
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      selected: {
        label: "Selected",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
      },
      rejected: {
        label: "Not Selected",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: XCircle,
      },
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge?.icon || AlertCircle;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${badge?.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {badge?.label || status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: "bg-red-100 text-red-700 border-red-200",
      "this-week": "bg-yellow-100 text-yellow-700 border-yellow-200",
      flexible: "bg-green-100 text-green-700 border-green-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${
          badges[urgency as keyof typeof badges] || badges.flexible
        }`}
      >
        <Clock className="h-3 w-3" />
        {urgency.replace("-", " ")}
      </span>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">
                Bid Submitted Successfully!
              </p>
              <p className="text-sm text-green-700">
                The customer will review your bid soon.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bids</h1>
              <p className="text-gray-600">
                Track and manage your service request bids
              </p>
            </div>
            <button
              onClick={() => router.push("/provider/service-requests")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              Browse Requests
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  About Bidding
                </p>
                <p className="text-sm text-gray-700">
                  When a customer selects your bid, their contact information is
                  automatically revealed and you can message them directly. Only
                  customers can initiate messaging before bid selection.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Won</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.selected}
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
                  <p className="text-sm text-gray-600 mb-1">Lost</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.rejected}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border-2 border-gray-100 inline-flex gap-2 mb-6">
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
            onClick={() => setFilter("pending")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filter === "pending"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("selected")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filter === "selected"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Won
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filter === "rejected"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Lost
          </button>
        </div>

        {/* Bids List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : bids.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Bids Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing service requests and submit your first bid
            </p>
            <button
              onClick={() => router.push("/provider/service-requests")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              Browse Requests
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bids.map((bid) => {
              const request = bid.service_requests;
              const isSelected = bid.status === "selected";
              const isRejected = bid.status === "rejected";

              return (
                <div
                  key={bid.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all ${
                    isSelected
                      ? "border-green-300 ring-2 ring-green-200"
                      : "border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {request.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {request.description}
                          </p>
                        </div>
                        {getStatusBadge(bid.status)}
                      </div>

                      {/* Request Meta */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>
                            Budget: ${request.budget_min} - $
                            {request.budget_max}
                          </span>
                        </div>
                        {getUrgencyBadge(request.urgency)}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Bid: {new Date(bid.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Bid Details */}
                      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Your Bid
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Bid Amount
                            </p>
                            <p className="text-xl font-bold text-blue-600">
                              ${bid.amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">
                              Completion Time
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {bid.estimated_duration}
                            </p>
                          </div>
                        </div>
                        {bid.availability && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-1">
                              Availability
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {bid.availability}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Your Message
                          </p>
                          <p className="text-sm text-gray-700">{bid.message}</p>
                        </div>
                      </div>

                      {/* Customer Contact (if selected) */}
                      {isSelected && bid.customer_profile && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-900">
                              🎉 You Won! Customer Contact Info
                            </h4>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            {bid.customer_profile.avatar_url ? (
                              <img
                                src={bid.customer_profile.avatar_url}
                                alt={bid.customer_profile.full_name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900">
                                {bid.customer_profile.full_name}
                              </p>
                              <p className="text-xs text-gray-600">Customer</p>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <a
                              href={`tel:${bid.customer_profile.phone}`}
                              className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                            >
                              <Phone className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-medium text-sm">
                                  {bid.customer_profile.phone}
                                </p>
                              </div>
                            </a>
                            <a
                              href={`mailto:${bid.customer_profile.email}`}
                              className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                            >
                              <Mail className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-sm break-all">
                                  {bid.customer_profile.email}
                                </p>
                              </div>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Insights for rejected bids */}
                      {isRejected && (
                        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Improvement Tips
                          </h4>
                          <ul className="space-y-1 text-xs text-gray-700">
                            <li>• Consider more competitive pricing</li>
                            <li>• Respond faster to new requests</li>
                            <li>• Provide more detailed proposals</li>
                            <li>• Highlight your unique value proposition</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3 lg:min-w-[200px]">
                      {isSelected && bid.customer_profile && (
                        <button
                          onClick={() =>
                            router.push(
                              `/provider/messages/${request.customer_id}`
                            )
                          }
                          className="flex-1 lg:flex-none px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message Customer
                        </button>
                      )}

                      <button
                        onClick={() =>
                          router.push(
                            `/provider/service-requests/${request.id}`
                          )
                        }
                        className="flex-1 lg:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Request
                      </button>
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

export default function ProviderBidsPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderBidsPageContent />
    </ProtectedRoute>
  );
}
