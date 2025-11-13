// app/customer/service-requests/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { SkeletonProviderCard } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";

import {
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar,
  CreditCard,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  location: string;
  budget_min: number;
  budget_max: number;
  urgency: string;
  status: string;
  payment_status: string;
  bid_count: number;
  bids_count: number;
  created_at: string;
  expires_at: string;
}

function ServiceRequestsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<
    Record<string, { name: string; icon: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [stats, setStats] = useState({
    active: 0,
    total_bids: 0,
    closed: 0,
  });

  // Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Create abort controller for this effect
    const abortController = new AbortController();

    if (user) {
      // First fetch categories, then fetch requests
      fetchCategories(abortController.signal).then(() => {
        fetchRequests(abortController.signal);
      });
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id, filter]); // Use user.id instead of user

  const fetchCategories = async (signal: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, icon")
        .eq("active", true)
        .abortSignal(signal);

      if (isMountedRef.current && !signal.aborted && data) {
        // Create a lookup object for easy access
        const categoryMap: Record<string, { name: string; icon: string }> = {};
        data.forEach((cat) => {
          categoryMap[cat.id] = { name: cat.name, icon: cat.icon };
        });
        setCategories(categoryMap);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && err.code !== "PGRST301") {
        console.error("Error fetching categories:", err);
      }
    }
  };

  const fetchRequests = async (signal: AbortSignal) => {
    try {
      // Only set loading if component is still mounted
      if (isMountedRef.current) {
        setLoading(true);
      }

      // FIXED: Fetch without join - we'll use categories state instead
      let query = supabase
        .from("service_requests")
        .select("*")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false })
        .abortSignal(signal); // Add abort signal

      if (filter === "active") {
        query = query.in("status", ["draft", "active"]);
      } else if (filter === "closed") {
        query = query.in("status", ["closed", "expired"]);
      }

      const { data, error } = await query;

      // Only update state if component is still mounted and not aborted
      if (isMountedRef.current && !signal.aborted) {
        if (error) {
          console.error("Error fetching requests:", error);
        } else {
          setRequests(data || []);

          // Calculate stats
          const active =
            data?.filter((r) => ["draft", "active"].includes(r.status))
              .length || 0;
          const total_bids =
            data?.reduce(
              (sum, r) => sum + (r.bid_count || r.bids_count || 0),
              0
            ) || 0;
          const closed =
            data?.filter((r) => ["closed", "expired"].includes(r.status))
              .length || 0;

          setStats({ active, total_bids, closed });
        }
        setLoading(false);
      }
    } catch (err: any) {
      // Don't set error state if request was aborted
      if (err.name === "AbortError" || err.code === "PGRST301") {
        console.log("Request cancelled");
        return;
      }

      if (isMountedRef.current) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (request: ServiceRequest) => {
    // Check payment status first
    if (request.payment_status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-3.5 w-3.5" />
          Payment Required
        </span>
      );
    }

    const badges = {
      draft: {
        label: "Draft",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: FileText,
      },
      active: {
        label: "Active",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: TrendingUp,
      },
      closed: {
        label: "Closed",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: X,
      },
      expired: {
        label: "Expired",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Clock,
      },
    };

    const badge = badges[request.status as keyof typeof badges];
    const Icon = badge?.icon || AlertCircle;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${badge?.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {badge?.label || request.status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: "bg-red-100 text-red-800 border-red-200",
      "this-week": "bg-blue-100 text-blue-800 border-blue-200",
      flexible: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
          badges[urgency as keyof typeof badges] || badges.flexible
        }`}
      >
        <Clock className="h-3 w-3" />
        {urgency.replace("-", " ")}
      </span>
    );
  };

  const handleCloseRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to close this request?")) return;

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "closed",
        })
        .eq("id", requestId);

      if (error) throw error;

      // Refetch with current abort controller
      const abortController = new AbortController();
      fetchRequests(abortController.signal);
    } catch (err) {
      console.error("Error closing request:", err);
      alert("Failed to close request");
    }
  };

  if (!user) {
    router.push("/login");
    return null;
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
                My Service Requests
              </h1>
              <p className="text-gray-600">
                Manage your service requests and review bids
              </p>
            </div>
            <button
              onClick={() => router.push("/customer/service-request/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Request
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Requests</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total_bids}
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
                  <p className="text-sm text-gray-600 mb-1">Closed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.closed}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unpaid Requests Warning */}
        {requests.some((r) => r.payment_status === "pending") && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
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
                  Complete payment ($7 each) to make your requests visible to
                  providers and start receiving bids.
                </p>
              </div>
            </div>
          </div>
        )}

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
            onClick={() => setFilter("active")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filter === "active"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filter === "closed"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Closed
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonProviderCard key={i} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Requests Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first service request to get started
            </p>
            <button
              onClick={() => router.push("/customer/service-request/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Request
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => {
              const categoryName =
                categories[request.service_category_id]?.name || "Unknown";
              const bidCount = request.bid_count || request.bids_count || 0;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
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
                        {getStatusBadge(request)}
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{categoryName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>
                            ${request.budget_min} - ${request.budget_max}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getUrgencyBadge(request.urgency)}

                        {request.payment_status === "completed" &&
                          request.status === "active" && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">
                                {bidCount} bid{bidCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:min-w-[180px]">
                      {request.payment_status === "pending" ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/customer/service-request/${request.id}/payment`
                            )
                          }
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-md text-sm flex items-center justify-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay $7 Now
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              router.push(
                                `/customer/service-requests/${request.id}`
                              )
                            }
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>

                          {request.status === "active" && (
                            <button
                              onClick={() => handleCloseRequest(request.id)}
                              className="flex-1 lg:flex-none px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Close
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

export default function CustomerServiceRequestsPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <ServiceRequestsContent />
    </ProtectedRoute>
  );
}
