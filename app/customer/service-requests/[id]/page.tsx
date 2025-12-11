// app/customer/service-requests/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  MessageSquare,
  Star,
  Phone,
  Mail,
  User,
  Loader2,
  AlertCircle,
  Eye,
  X,
  CheckCircle,
  Shield,
  Sparkles,
  ExternalLink,
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
  views_count: number;
  created_at: string;
  photo_urls: string[];
  preferred_time: string;
  category?: string;
  category_icon?: string;
}

interface Bid {
  id: string;
  provider_id: string;
  amount: number;
  message: string;
  availability: string;
  estimated_duration: string;
  status: string;
  created_at: string;
  provider: {
    id: string;
    business_name: string;
    total_rating: number;
    review_count: number;
    user_id: string;
    profile: {
      full_name: string;
      avatar_url: string;
      phone: string;
      email: string;
    };
  };
}

function CustomerRequestDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const supabase = createClient();
  const isMountedRef = useRef(true);
  const viewsIncrementedRef = useRef(false);

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal for contact reveal
  const [contactModal, setContactModal] = useState<{
    show: boolean;
    provider: Bid["provider"] | null;
  }>({ show: false, provider: null });

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user && params?.id) {
      fetchRequestAndBids(abortController.signal);
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id, params?.id]);

  const incrementViewsCount = async () => {
    // Only increment once per page load
    if (viewsIncrementedRef.current || !params?.id) return;
    viewsIncrementedRef.current = true;

    try {
      const { error } = await (supabase as any).rpc("increment_request_views", {
        request_id: params?.id as string,
      } as any);

      // If RPC doesn't exist, use direct update
      if (error && error.message.includes("function")) {
        const { data: currentRequest } = await (supabase as any)
      .from("service_requests")
          .select("views_count")
          .eq("id", params?.id as string)
          .single() as { data: { views_count: number | null } | null };

        if (currentRequest) {
          await (supabase
            .from("service_requests") as any)
            .update({ views_count: (currentRequest.views_count || 0) + 1 } as any)
            .eq("id", params?.id as string);
        }
      }
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  const fetchRequestAndBids = async (signal: AbortSignal) => {
    if (!params?.id) return;

    try {
      console.log("🔍 Fetching request:", params.id);

      // Fetch request
      const { data: requestData, error: requestError } = await (supabase as any)
      .from("service_requests")
        .select("*")
        .eq("id", params.id as string)
        .eq("customer_id", user?.id as string)
        .abortSignal(signal)
        .single() as any as { data: ServiceRequest | null; error: any };

      if (signal.aborted) return;

      if (requestError) {
        console.error("❌ Request error:", requestError);
        throw requestError;
      }

      if (!requestData) {
        throw new Error("Request not found");
      }

      // Fetch category separately
      if (requestData.service_category_id) {
        const { data: category } = await (supabase as any)
      .from("service_categories")
          .select("name, icon")
          .eq("id", requestData.service_category_id)
          .abortSignal(signal)
          .single() as any as { data: { name: string; icon: string } | null };

        if (signal.aborted) return;

        if (category) {
          requestData.category = category.name;
          requestData.category_icon = category.icon;
        }
      }

      console.log("✅ Request found:", requestData);

      if (isMountedRef.current && !signal.aborted) {
        setRequest(requestData);
        setError(null);

        // Increment views after successfully loading request
        incrementViewsCount();
      }

      // Fetch bids
      console.log("🔍 Fetching bids...");
      const { data: bidsData, error: bidsError } = await (supabase as any)
      .from("service_request_bids")
        .select(
          `
          id,
          provider_id,
          amount,
          message,
          availability,
          estimated_duration,
          status,
          created_at
        `
        )
        .eq("request_id", params.id as string)
        .abortSignal(signal)
        .order("created_at", { ascending: false }) as any as {
          data: Array<{
            id: string;
            provider_id: string;
            amount: number;
            message: string;
            availability: string;
            estimated_duration: string;
            status: string;
            created_at: string;
          }> | null;
          error: any;
        };

      if (signal.aborted) return;

      if (bidsError) {
        console.error("❌ Bids error:", bidsError);
        throw bidsError;
      }

      console.log("📊 Raw bids:", bidsData?.length || 0);

      // Fetch provider details for each bid
      if (bidsData && bidsData.length > 0) {
        const bidsWithProviders = await Promise.all(
          bidsData.map(async (bid) => {
            if (signal.aborted) return null;

            // Get provider info
            const { data: providerData } = await (supabase as any)
      .from("providers")
              .select("id, business_name, total_rating, review_count, user_id")
              .eq("id", bid.provider_id)
              .abortSignal(signal)
              .single() as {
                data: {
                  id: string;
                  business_name: string;
                  total_rating: number;
                  review_count: number;
                  user_id: string;
                } | null;
              };

            if (signal.aborted) return null;

            // Get provider profile
            const { data: profileData } = await (supabase as any)
      .from("profiles")
              .select("full_name, avatar_url, phone, email")
              .eq("id", providerData?.user_id as string)
              .abortSignal(signal)
              .single() as {
                data: {
                  full_name: string;
                  avatar_url: string;
                  phone: string;
                  email: string;
                } | null;
              };

            if (signal.aborted) return null;

            return {
              ...bid,
              provider: {
                ...providerData,
                profile: profileData || {
                  full_name: "Unknown",
                  avatar_url: "",
                  phone: "",
                  email: "",
                },
              },
            };
          })
        );

        if (signal.aborted) return;

        const validBids = bidsWithProviders.filter((bid) => bid !== null);
        console.log("✅ Bids with providers:", validBids.length);

        if (isMountedRef.current && !signal.aborted) {
          setBids(validBids as Bid[]);
        }
      } else {
        if (isMountedRef.current && !signal.aborted) {
          setBids([]);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") {
        console.log("Request aborted or cancelled");
        return;
      }
      console.error("❌ Error:", err);
      if (isMountedRef.current) {
        setError(err.message || "Failed to load request details");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectBid = async (bidId: string, provider: Bid["provider"]) => {
    if (
      !confirm(
        "Select this provider? Their contact information will be revealed."
      )
    )
      return;

    setActionLoading(bidId);

    try {
      const { error: updateError } = await (supabase
        .from("service_request_bids") as any)
        .update({
          status: "selected",
          selected_at: new Date().toISOString(),
        } as any)
        .eq("id", bidId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Show success and contact modal
      setContactModal({ show: true, provider });

      // Refresh data to show updated status
      const abortController = new AbortController();
      await fetchRequestAndBids(abortController.signal);
    } catch (err: any) {
      console.error("Select error:", err);
      alert("Failed to select provider. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseRequest = async () => {
    if (!confirm("Close this request? No more bids will be accepted.")) return;
    if (!params?.id) return;

    try {
      const { error } = await (supabase
        .from("service_requests") as any)
        .update({ status: "closed", closed_at: new Date().toISOString() } as any)
        .eq("id", params?.id as string);

      if (error) throw error;

      router.push("/customer/service-requests");
    } catch (err: any) {
      console.error("Close error:", err);
      alert("Failed to close request.");
    }
  };

  const getAvgRating = (provider: any) => {
    if (!provider.review_count || provider.review_count === 0) return 0;
    return (provider.total_rating / provider.review_count).toFixed(1);
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: { label: "ASAP", class: "bg-red-100 text-red-700 border-red-200" },
      "this-week": {
        label: "This Week",
        class: "bg-yellow-100 text-yellow-700 border-yellow-200",
      },
      flexible: {
        label: "Flexible",
        class: "bg-green-100 text-green-700 border-green-200",
      },
    };
    const badge = badges[urgency as keyof typeof badges] || badges.flexible;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${badge.class}`}
      >
        <Clock className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    );
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

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This request doesn't exist or you don't have access."}
          </p>
          <button
            onClick={() => router.push("/customer/service-requests")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Back to My Requests
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = bids.filter((b) => b.status === "selected").length;
  const canSelectMore = selectedCount < 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/customer/service-requests")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to My Requests</span>
        </button>

        {/* Request Details Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {request.category_icon && (
                  <span className="text-3xl">{request.category_icon}</span>
                )}
                <h1 className="text-3xl font-bold text-gray-900">
                  {request.title}
                </h1>
              </div>
              <p className="text-gray-600 text-lg mb-4">
                {request.description}
              </p>
            </div>
            {request.status === "active" && (
              <button
                onClick={handleCloseRequest}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close Request
              </button>
            )}
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Location</p>
                <p className="font-semibold text-gray-900">
                  {request.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Budget</p>
                <p className="font-semibold text-gray-900">
                  ${request.budget_min} - ${request.budget_max}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600 font-medium">Bids</p>
                <p className="font-semibold text-gray-900">{bids.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
              <Eye className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-xs text-yellow-600 font-medium">Views</p>
                <p className="font-semibold text-gray-900">
                  {request.views_count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {getUrgencyBadge(request.urgency)}
            {request.category && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {request.category}
              </span>
            )}
            <span className="text-sm text-gray-500">
              Posted {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                How Selection Works
              </p>
              <p className="text-sm text-gray-700">
                When you select a provider, their contact information (phone &
                email) is automatically revealed. You can select up to 5
                providers and message them directly.
              </p>
            </div>
          </div>
        </div>

        {/* Bids Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Provider Bids ({bids.length})
              </h2>
              <p className="text-gray-600 text-sm">
                {selectedCount} selected •{" "}
                {canSelectMore
                  ? `${5 - selectedCount} more available`
                  : "Maximum reached"}
              </p>
            </div>
          </div>

          {bids.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Bids Yet
              </h3>
              <p className="text-gray-600">
                Providers will submit bids soon. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {bids.map((bid) => {
                const isSelected = bid.status === "selected";
                const avgRating = getAvgRating(bid.provider);

                return (
                  <div
                    key={bid.id}
                    className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all ${
                      isSelected
                        ? "border-green-300 bg-green-50/50 ring-2 ring-green-200"
                        : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Provider Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {bid.provider.profile.avatar_url ? (
                          <img
                            src={bid.provider.profile.avatar_url}
                            alt={bid.provider.business_name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {bid.provider.business_name}
                              </h3>
                              {bid.provider.review_count > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-semibold text-gray-900">
                                      {avgRating}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    ({bid.provider.review_count} reviews)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            {isSelected && (
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Selected
                              </span>
                            )}
                          </div>

                          {/* Bid Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-2xl font-bold text-green-600">
                                ${bid.amount}
                              </span>
                            </div>

                            <p className="text-gray-700">{bid.message}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {bid.availability || "Not specified"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {bid.estimated_duration || "Not specified"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info (ONLY shown if selected) */}
                          {isSelected && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Shield className="h-5 w-5 text-green-600" />
                                <p className="font-bold text-green-900">
                                  Contact Information Unlocked
                                </p>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3">
                                <a
                                  href={`tel:${bid.provider.profile.phone}`}
                                  className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                                >
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">
                                    {bid.provider.profile.phone}
                                  </span>
                                </a>
                                <a
                                  href={`mailto:${bid.provider.profile.email}`}
                                  className="flex items-center gap-2 p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                                >
                                  <Mail className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-sm">
                                    {bid.provider.profile.email}
                                  </span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-3 lg:min-w-[200px]">
                        {isSelected ? (
                          // Show message button prominently for selected bids
                          <button
                            onClick={() =>
                              router.push(
                                `/customer/messages/${bid.provider.user_id}`
                              )
                            }
                            className="flex-1 lg:flex-none px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Send Message
                          </button>
                        ) : (
                          <>
                            {/* Select button for non-selected bids */}
                            {canSelectMore && (
                              <button
                                onClick={() =>
                                  handleSelectBid(bid.id, bid.provider)
                                }
                                disabled={!!actionLoading}
                                className="flex-1 lg:flex-none px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === bid.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Select Provider
                                  </>
                                )}
                              </button>
                            )}

                            {/* View Profile button */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/search/provider/${bid.provider.user_id}`
                                )
                              }
                              className="flex-1 lg:flex-none px-4 py-3 border-2 border-purple-300 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Profile
                            </button>

                            {/* Message button (secondary for non-selected) */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/customer/messages/${bid.provider.user_id}`
                                )
                              }
                              className="flex-1 lg:flex-none px-4 py-3 border-2 border-blue-300 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Message
                            </button>
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

      {/* Contact Reveal Modal */}
      {contactModal.show && contactModal.provider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Provider Selected!
              </h2>
              <p className="text-gray-600">
                Contact information for{" "}
                <span className="font-semibold">
                  {contactModal.provider.business_name}
                </span>{" "}
                is now available below.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-green-600" />
                <p className="font-bold text-green-900">Contact Information</p>
              </div>

              <div className="space-y-3">
                <a
                  href={`tel:${contactModal.provider.profile.phone}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                >
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold">
                      {contactModal.provider.profile.phone}
                    </p>
                  </div>
                </a>

                <a
                  href={`mailto:${contactModal.provider.profile.email}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-lg text-gray-900 hover:bg-gray-50 transition-colors border border-green-200"
                >
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-sm">
                      {contactModal.provider.profile.email}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setContactModal({ show: false, provider: null })}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setContactModal({ show: false, provider: null });
                  router.push(
                    `/customer/messages/${contactModal.provider?.user_id}`
                  );
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerRequestDetailPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <CustomerRequestDetailContent />
    </ProtectedRoute>
  );
}
