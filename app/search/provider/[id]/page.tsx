// app/search/provider/[id]/page.tsx - FINAL VERSION

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { SERVICE_BANK } from "@/lib/data/service-bank";
import { getDefaultAvatar } from "@/lib/utils/avatar";
import { v4 as uuidv4 } from "uuid";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Shield,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Users,
  ThumbsUp,
  Briefcase,
  ArrowRight,
  Lock,
  AlertCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingId] = useState(() => uuidv4());
  const [hasUnlockedContact, setHasUnlockedContact] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const [showWalletConfirmModal, setShowWalletConfirmModal] = useState(false);

  const providerId = params.id as string;

  useEffect(() => {
    if (providerId) {
      fetchProvider();
      checkIfContactUnlocked();
    }
    if (user) {
      fetchWalletBalance();
    }
  }, [providerId, user]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("providers")
        .select(
          `
          *,
          profiles:user_id (full_name, phone, location, avatar_url),
          provider_categories (service_category_id),
          provider_specialties (service_category_id, specialty_id),
          provider_photos (id, photo_url, caption, order_index),
          reviews (
            id,
            rating,
            comment,
            created_at,
            status,
            profiles:customer_id (full_name, avatar_url)
          ),
          bookings (id, payment_status, booking_status)
        `
        )
        .eq("id", providerId)
        .eq("active", true)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setProvider(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkIfContactUnlocked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .eq("provider_id", providerId)
      .eq("payment_status", "completed")
      .single();

    setHasUnlockedContact(!!data);
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const handleBookNow = async () => {
    if (!user) {
      router.push("/login?redirect=/search/provider/" + providerId);
      return;
    }

    // Check wallet balance
    setCheckingWallet(true);
    await fetchWalletBalance();
    setCheckingWallet(false);

    // If balance >= 1, show wallet confirm modal
    if (walletBalance >= 1) {
      setShowWalletConfirmModal(true);
    } else {
      // Show payment modal if insufficient credits
      toast.info("Insufficient Wallet Balance", {
        description: `You need 1 credit but only have ${walletBalance.toFixed(1)} credits. Please complete payment to continue.`,
        duration: 4000,
      });
      setShowPaymentModal(true);
    }
  };

  const handleWalletPayment = async () => {
    // Close the confirmation modal
    setShowWalletConfirmModal(false);

    try {
      // Show loading toast
      const loadingToast = toast.loading("Processing payment...", {
        description: "Deducting 1 credit from your wallet",
      });

      // Create booking with wallet payment
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          service_description: "Direct provider booking",
          payment_method: "wallet",
        }),
      });

      const data = await response.json();
      console.log("📡 API Response:", data);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (data.success) {
        handlePaymentSuccess();

        toast.success("Payment Successful!", {
          description: data.message || "Paid with wallet credits! Contact unlocked.",
          duration: 4000,
        });

        // Refresh wallet balance
        await fetchWalletBalance();
      } else {
        const errorMsg = data.message || data.error || "Payment failed";
        console.error("❌ Booking failed:", errorMsg, data);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Wallet payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Payment failed";

      toast.error("Payment Failed", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleMessageProvider = () => {
    if (!user) {
      router.push("/login?redirect=/search/provider/" + providerId);
      return;
    }

    // provider.user_id is the actual user_id field from providers table
    console.log("Routing to:", `/customer/messages/${provider.user_id}`);
    router.push(`/customer/messages/${provider.user_id}`);
  };

  const handlePaymentSuccess = async () => {
    setHasUnlockedContact(true);
    setShowPaymentModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading provider...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Provider Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "This provider doesn't exist or has been removed."}
            </p>
            <button
              onClick={() => router.push("/search")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowRight className="inline h-5 w-5 mr-2" />
              Browse Providers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // CALCULATE REAL STATS - JOBS = REVIEWS
  // ========================================
  const activeReviews =
    provider.reviews?.filter((r: any) => r.status === "active") || [];
  const actualReviewCount = activeReviews.length;

  // JOBS = REVIEWS (a review means job was completed)
  const completedJobs = actualReviewCount;

  const actualAvgRating =
    actualReviewCount > 0
      ? (
          activeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          actualReviewCount
        ).toFixed(1)
      : "New";

  const completedBookings =
    provider.bookings?.filter((b: any) => b.payment_status === "completed")
      .length || 0;

  // Calculate years of experience
  const accountCreated = new Date(provider.created_at);
  const now = new Date();
  const monthsActive =
    (now.getFullYear() - accountCreated.getFullYear()) * 12 +
    (now.getMonth() - accountCreated.getMonth());
  const yearsExperience =
    monthsActive >= 12 ? Math.floor(monthsActive / 12) : "< 1";

  // Calculate effective tier
  const promoActive =
    provider.promo_expires_at &&
    new Date(provider.promo_expires_at) > new Date();
  const effectiveTier = promoActive ? "pro" : provider.subscription_tier;
  const isPro = effectiveTier === "pro";

  // Get categories and specialties
  const providerCategories =
    provider.provider_categories
      ?.map((pc: any) => {
        const category = SERVICE_BANK.find(
          (c) => c.id === pc.service_category_id
        );
        const specialties = provider.provider_specialties
          ?.filter(
            (ps: any) => ps.service_category_id === pc.service_category_id
          )
          .map((ps: any) =>
            category?.specialties.find((s) => s.id === ps.specialty_id)
          )
          .filter(Boolean);

        return { category, specialties };
      })
      .filter((item: any) => item.category) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgb(37, 99, 235),
            rgb(147, 51, 234)
          );
          border-radius: 10px;
          border: 2px solid rgba(243, 244, 246, 0.5);
        }
      `}</style>

      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Back to search</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Header Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {isPro && (
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <span className="font-bold">
                      PRO VERIFIED PROVIDER
                      {promoActive && " (Promo Active)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Higher Ranking</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    {provider.profiles?.avatar_url ? (
                      <img
                        src={provider.profiles.avatar_url}
                        alt={
                          provider.profiles?.full_name || provider.business_name
                        }
                        className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white text-6xl">
                        {getDefaultAvatar(
                          provider.id,
                          provider.profiles?.full_name || provider.business_name
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                      {provider.business_name || provider.profiles?.full_name}
                      {provider.verified && (
                        <CheckCircle2 className="h-7 w-7 text-blue-600" />
                      )}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">
                      {provider.profiles?.full_name}
                    </p>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100">
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-900">
                          {actualAvgRating}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {actualReviewCount}
                        </span>{" "}
                        {actualReviewCount === 1 ? "review" : "reviews"}
                      </div>
                      <div className="text-gray-400">•</div>
                      <div className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {completedJobs}
                        </span>{" "}
                        {completedJobs === 1 ? "job" : "jobs"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">
                          {provider.profiles?.location || "Monrovia"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-5 w-5 text-green-600" />
                        <span className="font-medium">
                          {provider.response_time || "Within 1 hour"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">
                          {yearsExperience === "< 1"
                            ? "New"
                            : `${yearsExperience}+`}{" "}
                          years
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services/Categories */}
            {providerCategories.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  Services Offered
                </h2>
                <div className="space-y-6">
                  {providerCategories.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <span className="text-4xl">{item.category?.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {item.category?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {item.category?.description}
                          </p>
                        </div>
                      </div>

                      {item.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 ml-14">
                          {item.specialties.map((spec: any) => (
                            <span
                              key={spec.id}
                              className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-semibold border border-blue-200 flex items-center gap-1"
                            >
                              {spec.popular && <span>🔥</span>}
                              {spec.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {provider.description ||
                  "Professional service provider committed to quality work and customer satisfaction."}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">
                    {yearsExperience === "< 1"
                      ? "New"
                      : `${yearsExperience} years`}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">
                    {yearsExperience === "< 1" ? "Year" : "Years"}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-3xl font-bold text-green-600">
                    {completedJobs}
                  </div>
                  <div className="text-sm text-green-700 font-medium">
                    {completedJobs === 1 ? "Job" : "Jobs"}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="text-3xl font-bold text-yellow-600">
                    {actualAvgRating}
                  </div>
                  <div className="text-sm text-yellow-700 font-medium">
                    Rating
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600">
                    {completedBookings}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">
                    Bookings
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio */}
            {provider.provider_photos &&
              provider.provider_photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    Portfolio
                    <span className="text-sm font-normal text-gray-500">
                      ({provider.provider_photos.length} photos)
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {provider.provider_photos
                      .sort(
                        (a: any, b: any) =>
                          (a.order_index || 0) - (b.order_index || 0)
                      )
                      .map((photo: any, idx: number) => (
                        <button
                          key={photo.id}
                          onClick={() => {
                            setSelectedImage(photo);
                            setCurrentImageIndex(idx);
                          }}
                          className="aspect-square rounded-xl overflow-hidden hover:shadow-lg transition-all hover:scale-105 border border-gray-200 group"
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || "Portfolio image"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* Reviews */}
            {activeReviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  Customer Reviews ({actualReviewCount})
                </h2>
                <div className="space-y-6">
                  {activeReviews.map((review: any) => {
                    const reviewProfile = Array.isArray(review.profiles)
                      ? review.profiles[0]
                      : review.profiles;

                    return (
                      <div
                        key={review.id}
                        className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(reviewProfile?.full_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {reviewProfile?.full_name || "Anonymous"}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${provider.hourly_rate || 25}/hr
                  </div>
                  <p className="text-gray-600">Starting rate</p>
                </div>

                {hasUnlockedContact ? (
                  <div className="space-y-3">
                    <a
                      href={`tel:${provider.profiles?.phone}`}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="h-5 w-5" />
                      <span>Call: {provider.profiles?.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${provider.profiles?.phone?.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={handleMessageProvider}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="h-5 w-5" />
                      <span>Message Provider</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleBookNow}
                      disabled={checkingWallet}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingWallet ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          <span>Checking wallet...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span>Book Now - $1</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    {walletBalance > 0 && !checkingWallet && (
                      <div className="mt-2 text-center text-xs text-green-600 font-semibold">
                        💳 You have {walletBalance.toFixed(1)} credits in your wallet
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 text-center text-sm text-gray-500">
                  {hasUnlockedContact
                    ? "✅ Contact unlocked!"
                    : "Launch special: $1 booking fee (regular $3)"}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Why Choose{" "}
                  {
                    (
                      provider.business_name ||
                      provider.profiles?.full_name ||
                      ""
                    ).split(" ")[0]
                  }
                  ?
                </h3>
                <div className="space-y-3">
                  {provider.verified && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          Verified Professional
                        </div>
                        <div className="text-sm text-gray-600">
                          Identity verified
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <ThumbsUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {actualAvgRating} Star Rating
                      </div>
                      <div className="text-sm text-gray-600">
                        From {actualReviewCount}{" "}
                        {actualReviewCount === 1 ? "customer" : "customers"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {completedJobs} {completedJobs === 1 ? "Job" : "Jobs"}{" "}
                        Completed
                      </div>
                      <div className="text-sm text-gray-600">
                        Verified by customer reviews
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Secure Payment
                      </div>
                      <div className="text-sm text-gray-600">
                        Protected by LiberiaFix
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Confirmation Modal */}
      {showWalletConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                💳 Confirm Payment
              </h3>
              <button
                onClick={() => setShowWalletConfirmModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    1 Credit
                  </div>
                  <p className="text-sm text-gray-600">
                    Will be deducted from your wallet
                  </p>
                </div>

                <div className="border-t border-blue-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-bold text-gray-900">
                      {walletBalance.toFixed(1)} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">After Booking:</span>
                    <span className="font-bold text-green-600">
                      {(walletBalance - 1).toFixed(1)} credits
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Contact Info Will Be Unlocked
                </p>
                <p className="text-xs text-green-700 mt-1">
                  You'll be able to call, WhatsApp, and message{" "}
                  {provider?.business_name}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWalletConfirmModal(false)}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletPayment}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                Confirm Payment
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              Instant unlocking • No waiting • Secure payment
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Payment Simulation
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-900 font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  🧪 Test Mode - No Real Money
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This is a simulated payment for testing
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0770123456"
                    defaultValue="0770000000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">
                      Booking Fee
                    </span>
                    <span className="text-3xl font-bold text-green-600">
                      $1
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Launch special! Unlocks direct contact with{" "}
                    {provider?.business_name}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                const btn = document.activeElement as HTMLButtonElement;
                if (btn) {
                  btn.disabled = true;
                  btn.innerHTML =
                    '<div class="flex items-center justify-center gap-2"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Processing...</div>';
                }

                // Simulate payment processing delay
                await new Promise((resolve) => setTimeout(resolve, 2000));

                try {
                  // Create booking via API with simulated payment
                  const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      provider_id: providerId,
                      service_description: "Direct provider booking",
                      payment_method: "mtn_momo", // Direct payment method for simulation
                    }),
                  });

                  const data = await response.json();
                  console.log("📡 Payment Modal API Response:", data);

                  if (data.success || data.requires_payment) {
                    // For simulation, we'll mark it as successful immediately
                    // In production, this would redirect to payment gateway

                    // Simulate transaction record
                    await supabase.from("transactions").insert({
                      user_id: user?.id,
                      type: "booking_fee",
                      amount: 1.0,
                      status: "completed",
                      payment_method: "mtn_momo",
                      external_transaction_id: `MOCK_${Date.now()}`,
                      related_booking_id: data.booking?.id,
                      metadata: {
                        provider_id: providerId,
                        simulation: true,
                      },
                    });

                    // Update booking to completed
                    if (data.booking?.id) {
                      await supabase
                        .from("bookings")
                        .update({
                          payment_status: "completed",
                          transaction_id: `MOCK_${Date.now()}`,
                        })
                        .eq("id", data.booking.id);
                    }

                    handlePaymentSuccess();

                    toast.success("Payment Successful!", {
                      description: "Contact unlocked! You can now call or message the provider.",
                      duration: 4000,
                    });
                  } else {
                    const errorMsg = data.message || data.error || "Payment failed";
                    console.error("❌ Payment failed:", errorMsg, data);
                    throw new Error(errorMsg);
                  }
                } catch (error) {
                  console.error("Payment error:", error);
                  const errorMessage = error instanceof Error ? error.message : "Payment failed";

                  toast.error("Payment Failed", {
                    description: errorMessage,
                    duration: 5000,
                  });

                  if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = "Simulate Payment ($1)";
                  }
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              Simulate Payment ($1)
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Test payment • No actual charges • Instant approval
            </p>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={() => {
              const newIndex =
                currentImageIndex > 0
                  ? currentImageIndex - 1
                  : provider.provider_photos.length - 1;
              setCurrentImageIndex(newIndex);
              setSelectedImage(provider.provider_photos[newIndex]);
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="h-12 w-12" />
          </button>

          <button
            onClick={() => {
              const newIndex =
                currentImageIndex < provider.provider_photos.length - 1
                  ? currentImageIndex + 1
                  : 0;
              setCurrentImageIndex(newIndex);
              setSelectedImage(provider.provider_photos[newIndex]);
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="h-12 w-12" />
          </button>

          <div className="text-center max-w-4xl">
            <img
              src={selectedImage.photo_url}
              alt={selectedImage.caption || "Portfolio image"}
              className="max-h-[80vh] mx-auto rounded-lg shadow-2xl"
            />
            {selectedImage.caption && (
              <p className="text-white text-xl font-medium mt-6">
                {selectedImage.caption}
              </p>
            )}
            <p className="text-gray-400 mt-2">
              {currentImageIndex + 1} / {provider.provider_photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
