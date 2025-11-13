// app/service-requests/page.tsx - PUBLIC PAGE
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { ProtectedAction } from "@/components/auth/protected-action";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Plus,
  Lock,
  ArrowRight,
  Zap,
  Users,
  Loader2,
} from "lucide-react";

export default function ServiceRequestsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const supabase = createClient();
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      // Fetch only PAID and ACTIVE service requests
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("payment_status", "completed")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServiceRequests(data || []);
    } catch (error) {
      console.error("Error fetching service requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      asap: (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <Zap className="h-3 w-3 mr-1" />
          ASAP
        </Badge>
      ),
      "this-week": (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          This Week
        </Badge>
      ),
      flexible: (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Flexible
        </Badge>
      ),
    };
    return badges[urgency as keyof typeof badges] || null;
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

  // Show login prompt for unauthenticated users
  const LoginPromptBanner = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            Want to Post a Request or Bid?
          </h3>
          <p className="text-blue-100 mb-4">
            Sign up now to post your service request and get professional bids,
            or become a provider to bid on projects.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/signup?type=customer")}
              className="px-6 py-2 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all"
            >
              Sign Up as Customer
            </button>
            <button
              onClick={() => router.push("/signup?type=provider")}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-all border-2 border-blue-400"
            >
              Sign Up as Provider
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Service Requests
          </h1>
          <p className="text-gray-600 text-lg">
            Browse active service requests and submit your professional bid
          </p>
        </div>

        {/* Login Prompt for Unauthenticated Users */}
        {!user && <LoginPromptBanner />}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Create Request Button - Protected for Customers */}
          <ProtectedAction
            action="create service request"
            requireAuth={true}
            requireUserType={["customer"]}
            fallback={
              <button
                onClick={() => router.push("/signup?type=customer")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <Lock className="h-5 w-5" />
                <span>Sign Up to Post Request</span>
              </button>
            }
          >
            <button
              onClick={() => router.push("/customer/service-request/new")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Post Service Request</span>
            </button>
          </ProtectedAction>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          <button className="px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filters</span>
          </button>
        </div>

        {/* Pro Provider Info for Free Providers */}
        {user && profile?.user_type === "provider" && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Pro Feature: Bid on Service Requests
                </h3>
                <p className="text-purple-100 mb-3">
                  You're on the <strong>Free tier</strong>. Upgrade to{" "}
                  <strong>Pro ($20/month)</strong> to submit bids and win more
                  jobs!
                </p>
                <ul className="space-y-1 text-sm text-purple-100 mb-4">
                  <li>✓ Submit unlimited bids</li>
                  <li>✓ Get instant notifications for new requests</li>
                  <li>✓ Higher search ranking</li>
                  <li>✓ Access to analytics dashboard</li>
                </ul>
              </div>
              <button
                onClick={() => router.push("/provider/upgrade")}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all whitespace-nowrap"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Service Requests Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading service requests...</p>
            </div>
          ) : serviceRequests.length > 0 ? (
            serviceRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => router.push(`/service-requests/${request.id}`)}
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getUrgencyBadge(request.urgency)}
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                            {request.category}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {request.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.description}
                    </p>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {request.budget_min && request.budget_max && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-gray-500 text-xs">Budget</p>
                            <p className="font-semibold text-gray-900">
                              ${request.budget_min} - ${request.budget_max}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Location</p>
                          <p className="font-semibold text-gray-900">
                            {request.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Posted</p>
                          <p className="font-semibold text-gray-900">
                            {formatTimeAgo(request.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-gray-500 text-xs">Bids</p>
                          <p className="font-semibold text-gray-900">
                            {request.bid_count || 0} received
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button - Protected for Pro Providers */}
                  <div className="flex items-center">
                    <ProtectedAction
                      action="submit bid"
                      requireAuth={true}
                      requireUserType={["provider"]}
                      fallback={
                        <button
                          onClick={() =>
                            router.push("/login?redirectTo=/service-requests")
                          }
                          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          Login to Bid
                        </button>
                      }
                    >
                      <button
                        onClick={() =>
                          router.push(
                            `/provider/service-requests/${request.id}/bid`
                          )
                        }
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        Submit Bid
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </ProtectedAction>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Service Requests Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to post a service request!
              </p>
              {user && profile?.user_type === "customer" && (
                <button
                  onClick={() => router.push("/customer/service-request/new")}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Post Service Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
