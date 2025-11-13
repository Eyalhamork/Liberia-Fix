// app/service-requests/[id]/page.tsx - Public Service Request Detail
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  User,
  Image as ImageIcon,
  FileText,
  Zap,
  Users,
  Lock,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  urgency: string;
  status: string;
  payment_status: string;
  photo_urls: string[];
  preferred_time: string;
  bid_count: number;
  views_count: number;
  created_at: string;
  expires_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export default function ServiceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchRequest();
      incrementViewCount();
    }
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select(
          `
          *,
          profiles:customer_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", params.id)
        .eq("payment_status", "completed")
        .eq("status", "active")
        .single();

      if (error) throw error;

      if (!data) {
        setError("Service request not found or not available");
        return;
      }

      setRequest(data);
    } catch (err) {
      console.error("Error fetching request:", err);
      setError("Failed to load service request");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      // Only increment if user is a provider
      if (user && profile?.user_type === "provider") {
        await supabase.rpc("increment_request_views", {
          request_id: params.id,
        });
      }
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: {
        label: "ASAP",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Zap,
      },
      "this-week": {
        label: "This Week",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
      },
      flexible: {
        label: "Flexible",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: Clock,
      },
    };

    const badge = badges[urgency as keyof typeof badges] || badges.flexible;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} border-2`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const handleBidClick = () => {
    if (!user) {
      router.push(`/login?redirectTo=/service-requests/${params.id}`);
      return;
    }

    if (profile?.user_type !== "provider") {
      alert("Only providers can bid on service requests");
      return;
    }

    // Redirect to bid page - FIXED PATH
    router.push(`/provider/service-requests/${params.id}/bid`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "This service request doesn't exist or is no longer available"}
          </p>
          <button
            onClick={() => router.push("/service-requests")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Browse All Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                {getUrgencyBadge(request.urgency)}
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border-2">
                  {request.category}
                </Badge>
                <Badge className="bg-green-100 text-green-700 border-green-200 border-2 ml-auto">
                  Active
                </Badge>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {request.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Posted {formatTimeAgo(request.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{request.bid_count || 0} bids</span>
                </div>
                {profile?.user_type === "provider" && (
                  <div className="flex items-center gap-1">
                    <span>👁️ {request.views_count || 0} views</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            </div>

            {/* Photos */}
            {request.photo_urls && request.photo_urls.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Photos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {request.photo_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Request photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Additional Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Location
                    </p>
                    <p className="text-gray-700">{request.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Budget Range
                    </p>
                    <p className="text-gray-700">
                      ${request.budget_min} - ${request.budget_max}
                    </p>
                  </div>
                </div>

                {request.preferred_time && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Preferred Time
                      </p>
                      <p className="text-gray-700">{request.preferred_time}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Expires
                    </p>
                    <p className="text-gray-700">
                      {new Date(request.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Posted By
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {request.profiles?.avatar_url ? (
                    <img
                      src={request.profiles.avatar_url}
                      alt={request.profiles.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    request.profiles?.full_name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {request.profiles?.full_name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Bid?</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Submit your professional quote for this service request
              </p>

              <div className="bg-white/20 rounded-xl p-4 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-100">Budget Range:</span>
                  <span className="font-bold text-white">
                    ${request.budget_min} - ${request.budget_max}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100">Current Bids:</span>
                  <span className="font-bold text-white">
                    {request.bid_count || 0}
                  </span>
                </div>
              </div>

              {!user ? (
                <>
                  <button
                    onClick={handleBidClick}
                    className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md mb-3"
                  >
                    Login to Submit Bid
                  </button>
                  <p className="text-xs text-blue-100 text-center">
                    Sign in as a provider to bid on this request
                  </p>
                </>
              ) : profile?.user_type === "provider" ? (
                <>
                  <button
                    onClick={handleBidClick}
                    className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Submit Your Bid
                  </button>
                  <p className="text-xs text-blue-100 text-center mt-3">
                    ⚡ Respond quickly to increase your chances
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <Lock className="h-12 w-12 mx-auto mb-3 text-white/80" />
                  <p className="text-sm text-blue-100">
                    Only providers can bid on service requests
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Request Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bids Received</span>
                  <span className="font-bold text-gray-900">
                    {request.bid_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="font-bold text-gray-900">
                    {request.views_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Left</span>
                  <span className="font-bold text-gray-900">
                    {Math.ceil(
                      (new Date(request.expires_at).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
