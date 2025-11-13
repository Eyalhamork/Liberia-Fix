// app/service-requests/[id]/bid/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  MessageSquare,
  Send,
  AlertCircle,
  Loader2,
  Lock,
  Crown,
  TrendingUp,
  FileText,
  MapPin,
  Calendar,
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
  photo_urls: string[];
  bid_count: number;
  created_at: string;
}

interface Provider {
  id: string;
  subscription_tier: string;
  business_name: string;
}

export default function ProviderBidSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canBid, setCanBid] = useState(true);
  const [bidLimitInfo, setBidLimitInfo] = useState({ used: 0, limit: 1 });
  const [alreadyBid, setAlreadyBid] = useState(false);

  // Form state
  const [bidAmount, setBidAmount] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, params.id]);

  const fetchData = async () => {
    try {
      // Get provider info
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("id, subscription_tier, business_name")
        .eq("user_id", user?.id)
        .single();

      if (providerError) throw providerError;
      setProvider(providerData);

      // Check if free tier and get bid limits
      if (providerData.subscription_tier === "free") {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const { data: historyData } = await supabase
          .from("provider_bid_history")
          .select("*")
          .eq("provider_id", providerData.id)
          .eq("year", year)
          .eq("month", month)
          .single();

        if (historyData) {
          setBidLimitInfo({
            used: historyData.bids_used,
            limit: historyData.bids_limit,
          });

          if (historyData.bids_used >= historyData.bids_limit) {
            setCanBid(false);
            setError(
              "You've reached your monthly bid limit. Upgrade to Pro for unlimited bids."
            );
          }
        }
      }

      // Get service request details
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", params.id)
        .eq("status", "active")
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      // Check if already bid
      const { data: existingBid } = await supabase
        .from("service_request_bids")
        .select("id")
        .eq("request_id", params.id)
        .eq("provider_id", providerData.id)
        .single();

      if (existingBid) {
        setAlreadyBid(true);
        setError("You've already submitted a bid for this request");
        setCanBid(false);
      }

      // Set suggested bid amount (midpoint of budget)
      if (requestData.budget_min && requestData.budget_max) {
        const suggested = (
          (requestData.budget_min + requestData.budget_max) /
          2
        ).toFixed(0);
        setBidAmount(suggested);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canBid) {
      alert("You cannot submit a bid at this time");
      return;
    }

    if (!bidAmount || !completionTime || !message) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid bid amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create bid
      const { error: bidError } = await supabase
        .from("service_request_bids")
        .insert({
          request_id: params.id,
          provider_id: provider?.id,
          bid_amount: amount,
          estimated_completion_time: completionTime,
          message: message.trim(),
          status: "pending",
        });

      if (bidError) throw bidError;

      // Update bid history for free tier
      if (provider?.subscription_tier === "free") {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        await supabase.rpc("increment_provider_bid_count", {
          p_provider_id: provider.id,
          p_year: year,
          p_month: month,
        });
      }

      // Track view
      await supabase.from("service_request_views").upsert({
        request_id: params.id,
        provider_id: provider?.id,
        last_viewed_at: new Date().toISOString(),
      });

      // Redirect to provider bids page
      router.push("/provider/bids?success=true");
    } catch (err: any) {
      console.error("Error submitting bid:", err);
      setError(err.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    router.push("/login");
    return null;
  }

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

  // Show upgrade prompt for free tier if can't bid
  if (provider?.subscription_tier === "free" && !canBid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {alreadyBid ? "Already Submitted" : "Bid Limit Reached"}
              </h2>
              <p className="text-gray-600 mb-6">
                {alreadyBid
                  ? "You've already submitted a bid for this request. Check your bids dashboard to track it."
                  : `You've used ${bidLimitInfo.used} of ${bidLimitInfo.limit} free bids this month. Upgrade to Pro for unlimited bidding!`}
              </p>

              {!alreadyBid && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Pro Benefits
                    </h3>
                  </div>
                  <ul className="space-y-2 text-left text-gray-700">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Unlimited bid submissions
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      20 service categories
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      20 portfolio photos
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Priority notifications
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-4">
                    Only{" "}
                    <span className="font-bold text-blue-600">$10/month</span> •
                    First month free until first job won
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/service-requests")}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  {alreadyBid ? "View All Requests" : "Back"}
                </button>
                <button
                  onClick={() =>
                    alreadyBid
                      ? router.push("/provider/bids")
                      : router.push("/provider/subscription")
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  {alreadyBid ? "My Bids" : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !canBid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
            <AlertCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-center mb-2">
              Cannot Submit Bid
            </h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <button
              onClick={() => router.push("/service-requests")}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
            <AlertCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-center mb-2">
              Request Not Found
            </h2>
            <p className="text-gray-600 text-center mb-6">
              This request may have been closed or removed
            </p>
            <button
              onClick={() => router.push("/service-requests")}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/service-requests")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Requests</span>
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Request Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {request.title}
              </h1>
              <p className="text-gray-700 mb-6">{request.description}</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="capitalize">{request.category}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{request.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span>
                    ${request.budget_min} - ${request.budget_max}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="capitalize">
                    {request.urgency.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Posted {new Date(request.created_at).toLocaleDateString()}
                </span>
                <span>•</span>
                <MessageSquare className="h-4 w-4" />
                <span>{request.bid_count} bids received</span>
              </div>
            </div>

            {/* Bid Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Submit Your Bid
              </h2>

              <div className="space-y-6">
                {/* Bid Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Bid Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer budget: ${request.budget_min} - $
                    {request.budget_max}
                  </p>
                </div>

                {/* Estimated Completion Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Completion Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={completionTime}
                      onChange={(e) => setCompletionTime(e.target.value)}
                      placeholder="e.g., 2-3 hours, Same day, 1 week"
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Introduce yourself and explain why you're the best fit for this job..."
                      rows={5}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length} / 500 characters
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting Bid...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Bid
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 sticky top-24 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  Tips for Success
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <span>Be competitive but realistic with your pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <span>Provide accurate completion time estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <span>Highlight your relevant experience and skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <span>Be professional and courteous in your message</span>
                  </li>
                </ul>
              </div>

              {provider?.subscription_tier === "free" && (
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">
                    Free Tier Limit
                  </p>
                  <p className="text-xs text-yellow-800">
                    You have {bidLimitInfo.limit - bidLimitInfo.used} bid
                    {bidLimitInfo.limit - bidLimitInfo.used !== 1
                      ? "s"
                      : ""}{" "}
                    remaining this month.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                  💡 What Happens Next
                </h4>
                <ol className="space-y-2 text-xs text-blue-800">
                  <li>1. Customer reviews all bids</li>
                  <li>2. Customer selects 1-2 providers</li>
                  <li>3. Contact info is revealed</li>
                  <li>4. You negotiate and complete the job</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
