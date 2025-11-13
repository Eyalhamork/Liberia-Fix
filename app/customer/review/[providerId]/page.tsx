// app/customer/review/[providerId]/page.tsx - LEAVE A REVIEW
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  Star,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  Award,
  Sparkles,
} from "lucide-react";

function LeaveReviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const providerId = params.providerId as string;
  const bookingId = searchParams.get("booking_id");

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [categories, setCategories] = useState({
    punctuality: 0,
    quality: 0,
    professionalism: 0,
    value: 0,
  });

  useEffect(() => {
    if (user && providerId) {
      fetchProvider();
      checkExistingReview();
    }
  }, [user, providerId]);

  const fetchProvider = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("providers")
        .select(
          `
          id,
          business_name,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", providerId)
        .single();

      if (fetchError) throw fetchError;
      setProvider(data);
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError("Provider not found");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async () => {
    try {
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("customer_id", user?.id)
        .eq("provider_id", providerId)
        .single();

      if (existing) {
        setError("You have already reviewed this provider");
      }
    } catch (err) {
      // No existing review - this is fine
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (comment.length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Insert review
      const { error: insertError } = await supabase.from("reviews").insert({
        customer_id: user.id,
        provider_id: providerId,
        booking_id: bookingId || null,
        rating,
        comment: comment.trim(),
        punctuality_rating: categories.punctuality || null,
        quality_rating: categories.quality || null,
        professionalism_rating: categories.professionalism || null,
        value_rating: categories.value || null,
      });

      if (insertError) throw insertError;

      // Update provider's total rating and count
      const { data: currentProvider } = await supabase
        .from("providers")
        .select("total_rating, review_count")
        .eq("id", providerId)
        .single();

      if (currentProvider) {
        const newTotalRating = currentProvider.total_rating + rating;
        const newReviewCount = currentProvider.review_count + 1;

        await supabase
          .from("providers")
          .update({
            total_rating: newTotalRating,
            review_count: newReviewCount,
          })
          .eq("id", providerId);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/search/provider/${providerId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.message || "Failed to submit review");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-orange-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thank You! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your review has been submitted successfully
            </p>
            <p className="text-gray-500">Redirecting to provider profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-red-600 bg-clip-text text-transparent mb-4">
            Leave a Review
          </h1>
          <p className="text-lg text-gray-600">
            Share your experience to help others make informed decisions
          </p>
        </div>

        {/* Provider Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-8">
          <div className="flex items-center gap-4">
            {provider?.profiles?.avatar_url ? (
              <img
                src={provider.profiles.avatar_url}
                alt={provider.profiles.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {provider?.profiles?.full_name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {provider?.profiles?.full_name}
              </h2>
              <p className="text-gray-600">{provider?.business_name}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Review Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
        >
          <div className="p-6 md:p-8 space-y-8">
            {/* Overall Rating */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4 text-center">
                Overall Rating *
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating > 0 && (
                  <span className="font-semibold">
                    {rating === 5
                      ? "Excellent! 🌟"
                      : rating === 4
                      ? "Great! 😊"
                      : rating === 3
                      ? "Good 👍"
                      : rating === 2
                      ? "Fair 😐"
                      : "Needs Improvement 😞"}
                  </span>
                )}
              </p>
            </div>

            {/* Category Ratings */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4">
                Category Ratings (Optional)
              </label>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries({
                  punctuality: "Punctuality",
                  quality: "Quality of Work",
                  professionalism: "Professionalism",
                  value: "Value for Money",
                }).map(([key, label]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {label}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setCategories({ ...categories, [key]: star })
                          }
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= categories[key as keyof typeof categories]
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about your experience. What did you like? How was the service? Would you recommend this provider?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
                rows={6}
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 characters (min 10)
              </p>
            </div>

            {/* Review Guidelines */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">
                    Review Guidelines
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Be honest and constructive</li>
                    <li>• Focus on your personal experience</li>
                    <li>• Avoid offensive or inappropriate language</li>
                    <li>• Reviews cannot be edited once submitted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <button
              type="submit"
              disabled={submitting || rating === 0 || comment.length < 10}
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Review...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Help Others</h3>
            <p className="text-sm text-gray-600">
              Your review helps others find great providers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Reward Quality</h3>
            <p className="text-sm text-gray-600">
              Great reviews help providers grow their business
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Build Trust</h3>
            <p className="text-sm text-gray-600">
              Honest reviews build a trustworthy community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaveReviewPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <LeaveReviewContent />
    </ProtectedRoute>
  );
}
