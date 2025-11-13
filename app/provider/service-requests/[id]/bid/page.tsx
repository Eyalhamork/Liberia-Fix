// app/provider/service-requests/[id]/bid/page.tsx - Provider Bid Submission
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LockedRequestCard } from "@/components/service-requests/locked-request-card";
import {
  ArrowLeft,
  DollarSign,
  MessageSquare,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
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
  bids_count: number;
}

function ProviderBidPageContent() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Bid form data
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  // Check if provider is Pro tier and free bids remaining
  const [providerData, setProviderData] = useState<any>(null);
  const isProProvider = providerData?.subscription_tier === "pro";
  const freeBidsUsed = providerData?.free_bids_used_this_month || 0;
  const remainingFreeBids = Math.max(0, 1 - freeBidsUsed); // 1 free bid per month
  const canBid = isProProvider || remainingFreeBids > 0;

  // Debug logging
  useEffect(() => {
    if (providerData) {
      console.log("=== BID ELIGIBILITY DEBUG ===");
      console.log("Provider Data:", providerData);
      console.log("Is Pro Provider:", isProProvider);
      console.log("Free Bids Used:", freeBidsUsed);
      console.log("Remaining Free Bids:", remainingFreeBids);
      console.log("Can Bid:", canBid);
      console.log("===========================");
    }
  }, [providerData, isProProvider, freeBidsUsed, remainingFreeBids, canBid]);

  useEffect(() => {
    if (!user || profile?.user_type !== "provider") {
      router.push("/login");
      return;
    }

    if (params.id) {
      fetchRequest();
      fetchProviderData();
    }
  }, [user, profile, params.id]);

  const fetchProviderData = async () => {
    try {
      console.log("🔍 Fetching provider data for user:", user?.id);

      const { data, error } = await supabase
        .from("providers")
        .select(
          "subscription_tier, free_bids_used_this_month, free_bids_reset_at"
        )
        .eq("user_id", user?.id)
        .single();

      console.log("📊 Provider data:", data);
      console.log("❌ Provider error:", error);

      if (error) {
        console.error("🚨 SUPABASE ERROR:", error);
        alert(`Error loading provider data: ${error.message}`);
        // Set default data so page doesn't hang
        setProviderData({
          subscription_tier: "free",
          free_bids_used_this_month: 0,
          free_bids_reset_at: null,
        });
        return;
      }

      if (!data) {
        console.error("🚨 NO DATA RETURNED");
        alert("Could not load provider data. Please try again.");
        setProviderData({
          subscription_tier: "free",
          free_bids_used_this_month: 0,
          free_bids_reset_at: null,
        });
        return;
      }

      // Check if free bids need to be reset
      if (
        data.free_bids_reset_at &&
        new Date(data.free_bids_reset_at) <= new Date()
      ) {
        console.log("🔄 Resetting free bids for new month");

        // Reset free bids for new month
        const { error: updateError } = await supabase
          .from("providers")
          .update({
            free_bids_used_this_month: 0,
            free_bids_reset_at: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ).toISOString(),
          })
          .eq("user_id", user?.id);

        if (!updateError) {
          data.free_bids_used_this_month = 0;
          console.log("✅ Free bids reset successfully");
        }
      }

      console.log("✅ Final provider data:", data);
      console.log("📈 Free bids used:", data.free_bids_used_this_month);
      console.log("🎯 Subscription tier:", data.subscription_tier);

      setProviderData(data);
    } catch (err) {
      console.error("❌ CATCH ERROR:", err);
      alert(`Unexpected error: ${err}`);
      // Set default so page doesn't hang
      setProviderData({
        subscription_tier: "free",
        free_bids_used_this_month: 0,
        free_bids_reset_at: null,
      });
    }
  };

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", params.id)
        .eq("payment_status", "completed")
        .eq("status", "active")
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (err) {
      console.error("Error fetching request:", err);
      setError("Failed to load service request");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!bidAmount || parseFloat(bidAmount) <= 0) {
        throw new Error("Please enter a valid bid amount");
      }

      // Validate bid is within customer budget
      if (request && parseFloat(bidAmount) > request.budget_max) {
        throw new Error(
          `Your bid ($${bidAmount}) exceeds the customer's maximum budget ($${request.budget_max})`
        );
      }

      if (!message.trim()) {
        throw new Error("Please include a message with your bid");
      }

      // Check if can bid
      if (!isProProvider && remainingFreeBids <= 0) {
        throw new Error(
          "You've used your free bid this month. Upgrade to Pro for unlimited bidding!"
        );
      }

      // Get provider ID
      const { data: providerRecord, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (providerError || !providerRecord) {
        throw new Error("Could not find provider profile");
      }

      console.log("💾 Saving bid to database...");

      // Create bid record
      const { data: bidData, error: bidError } = await supabase
        .from("service_request_bids")
        .insert({
          request_id: params.id,
          provider_id: providerRecord.id,
          amount: parseFloat(bidAmount),
          message: message.trim(),
          availability: availability || null,
          estimated_duration: estimatedDuration || null,
          status: "pending",
        })
        .select()
        .single();

      if (bidError) {
        console.error("Bid error:", bidError);

        // Check for duplicate bid
        if (bidError.code === "23505") {
          throw new Error("You've already submitted a bid for this request");
        }

        throw new Error(bidError.message || "Failed to submit bid");
      }

      console.log("✅ Bid created:", bidData);

      // If using free bid, increment counter
      if (!isProProvider && remainingFreeBids > 0) {
        console.log("📈 Incrementing free bid counter...");

        const { error: updateError } = await supabase
          .from("providers")
          .update({
            free_bids_used_this_month: freeBidsUsed + 1,
          })
          .eq("user_id", user?.id);

        if (updateError) {
          console.error("Error updating free bid count:", updateError);
        } else {
          console.log("✅ Free bid counter updated");
        }
      }

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/provider/bids");
      }, 2000);
    } catch (err: any) {
      console.error("❌ Bid submission error:", err);
      setError(err.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !providerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/service-requests")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Browse Requests
          </button>
        </div>
      </div>
    );
  }

  // Show locked card for free tier providers with no bids left
  if (!canBid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>

          <LockedRequestCard
            request={{
              id: parseInt(params.id as string),
              title: request.title,
              category: request.category,
              budgetMin: request.budget_min,
              budgetMax: request.budget_max,
              location: request.location,
              distance: 0,
              urgency: request.urgency,
              bidsCount: request.bids_count || 0,
            }}
            remainingFreeBids={remainingFreeBids}
          />
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Bid Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your bid has been sent to the customer
          </p>
          <p className="text-gray-500 mb-8">
            You'll be notified if they're interested
          </p>
          <div className="bg-white rounded-2xl p-6 max-w-md mx-auto shadow-lg border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-2">Your Bid Amount</p>
            <p className="text-3xl font-bold text-green-600 mb-4">
              ${bidAmount}
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Bid submission form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Request Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Request Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service</p>
                  <p className="font-semibold text-gray-900">{request.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-gray-900">
                    {request.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Budget</p>
                  <p className="font-semibold text-green-600">
                    ${request.budget_min} - ${request.budget_max}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-900">
                    {request.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Bids</p>
                  <p className="font-semibold text-gray-900">
                    {request.bids_count || 0}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  💡 Bidding Tips
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Be competitive with your pricing</li>
                  <li>• Highlight your experience</li>
                  <li>• Respond quickly to increase chances</li>
                  <li>• Be clear about availability</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bid Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Submit Your Bid
              </h1>
              <p className="text-gray-600 mb-6">
                Provide your best quote and details for this service request
              </p>

              {/* Free Tier Warning */}
              {!isProProvider && remainingFreeBids > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">
                        🎁 Using Your Free Bid
                      </p>
                      <p className="text-sm text-blue-700">
                        This is your <strong>1 free bid</strong> for this month.
                        After this, you'll need to upgrade to Pro ($20/month)
                        for unlimited bidding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmitBid} className="space-y-6">
                {/* Bid Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Bid Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter your bid amount"
                      min="0"
                      step="0.01"
                      required
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        bidAmount && parseFloat(bidAmount) > request.budget_max
                          ? "border-red-300 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Customer budget: ${request.budget_min} - $
                      {request.budget_max}
                    </p>
                    {bidAmount &&
                      parseFloat(bidAmount) > request.budget_max && (
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ Exceeds max budget
                        </p>
                      )}
                    {bidAmount &&
                      parseFloat(bidAmount) <= request.budget_max &&
                      parseFloat(bidAmount) > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Within budget
                        </p>
                      )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you're the best fit for this job..."
                    rows={6}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {message.length} / 500 characters
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Availability
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g., Available immediately, Next week, etc."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Estimated Duration
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g., 2-3 hours, 1 day, etc."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-5 w-5" />
                        Submit Bid
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderBidPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderBidPageContent />
    </ProtectedRoute>
  );
}
