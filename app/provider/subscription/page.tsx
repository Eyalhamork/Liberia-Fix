// app/provider/subscription/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Crown,
  Check,
  Star,
  Zap,
  TrendingUp,
  Award,
  BarChart3,
  Camera,
  Target,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

function ProviderSubscriptionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [currentTier, setCurrentTier] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProviderTier();
    }
  }, [user]);

  // Prevent reload on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !loading) {
        // Don't reload, just stay on current state
        return;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading]);

  const fetchProviderTier = async () => {
    setLoading(true);

    const { data: provider } = await (supabase as any)
      .from("providers")
      .select("subscription_tier, promo_expires_at")
      .eq("user_id", user?.id as string)
      .single() as any as {
        data: {
          subscription_tier: "free" | "pro";
          promo_expires_at: string | null;
        } | null;
      };

    if (provider) {
      const promoActive =
        provider.promo_expires_at &&
        new Date(provider.promo_expires_at) > new Date();

      setCurrentTier(
        promoActive ? "pro" : provider.subscription_tier || "free"
      );
    }

    const { data: subData } = await (supabase as any)
      .from("provider_subscriptions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single() as any as { data: any | null };

    setSubscription(subData);
    setLoading(false);
  };

  const handleUpgradeToPro = () => {
    setShowPaymentModal(true);
  };

  const handleSimulatePayment = async () => {
    setProcessing(true);

    try {
      console.log("🚀 Starting subscription simulation...");

      // Simulate payment delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("💳 Creating simulated transaction...");

      // Create simulated transaction
      const { data: transaction, error: txError } = await (supabase
        .from("transactions") as any)
        .insert({
          user_id: user?.id as string,
          amount: 20,
          type: "provider_subscription",
          status: "completed",
          payment_method: "mtn_momo",
          external_transaction_id: `MOCK_SUB_${Date.now()}`,
          metadata: {
            tier: "pro",
            billingCycle: "monthly",
            simulation: true,
          },
        } as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (txError) {
        console.error("❌ Transaction creation failed:", txError);
        throw new Error(`Transaction error: ${txError.message}`);
      }

      console.log("✅ Transaction created:", transaction?.id);

      // Get provider record
      console.log("👤 Getting provider record...");
      const { data: provider, error: providerError } = await (supabase as any)
      .from("providers")
        .select("*")
        .eq("user_id", user?.id as string)
        .single() as any as { data: { id: string; user_id: string } | null; error: any };

      if (providerError || !provider) {
        throw new Error("Provider profile not found");
      }

      console.log("✅ Provider found:", provider.id);

      // Calculate expiry date (30 days from now)
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Check if provider already has an active subscription
      const { data: existingSubscription } = await (supabase as any)
      .from("provider_subscriptions")
        .select("*")
        .eq("provider_id", provider.id)
        .eq("status", "active")
        .single() as { data: { id: string } | null };

      if (existingSubscription) {
        console.log("⚠️ Cancelling existing subscription...");
        await (supabase
          .from("provider_subscriptions") as any)
          .update({ status: "cancelled", auto_renew: false } as any)
          .eq("id", existingSubscription.id);
      }

      // Create new subscription
      console.log("📝 Creating subscription...");
      const { data: subscription, error: subscriptionError } = await (supabase
        .from("provider_subscriptions") as any)
        .insert({
          provider_id: provider.id as string,
          tier: "pro",
          status: "active",
          amount: 20,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
        } as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (subscriptionError || !subscription) {
        console.error("❌ Subscription creation failed:", subscriptionError);
        throw new Error("Failed to create subscription");
      }

      console.log("✅ Subscription created:", subscription.id);

      // Update provider tier
      console.log("🔄 Updating provider tier...");
      const { error: updateError } = await (supabase
        .from("providers") as any)
        .update({
          subscription_tier: "pro",
          promo_expires_at: null,
        } as any)
        .eq("id", provider.id as string);

      if (updateError) {
        console.error("❌ Provider tier update failed:", updateError);
        // Rollback subscription
        await (supabase as any)
      .from("provider_subscriptions")
          .delete()
          .eq("id", subscription.id);
        throw new Error("Failed to upgrade account");
      }

      console.log("✅ Provider upgraded to Pro!");

      // Link transaction to subscription
      await (supabase
        .from("transactions") as any)
        .update({ related_subscription_id: subscription.id } as any)
        .eq("id", transaction?.id as string);

      console.log("🎉 Subscription activation complete!");

      // Success toast
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[60] flex items-center gap-3 animate-slide-in";
      toast.innerHTML = `
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-semibold">🎉 Upgraded to Pro!</span>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("💥 Subscription error:", error);
      alert(`Failed to activate subscription: ${error.message}`);
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  const proFeatures = [
    { text: "Up to 5 service categories", icon: Target },
    { text: "Up to 20 portfolio photos", icon: Camera },
    { text: "Unlimited bid submissions", icon: Zap },
    { text: "Priority search ranking", icon: TrendingUp },
    { text: "Pro verification badge", icon: Award },
    { text: "Advanced analytics dashboard", icon: BarChart3 },
    { text: "Featured in category pages", icon: Star },
    { text: "Priority customer support", icon: Shield },
  ];

  const freeFeatures = [
    { text: "1 service category", included: true },
    { text: "1 portfolio photo", included: true },
    { text: "1 free bid per month", included: true },
    { text: "Basic profile", included: true },
    { text: "Multiple categories", included: false },
    { text: "Unlimited bidding", included: false },
    { text: "Priority ranking", included: false },
    { text: "Analytics", included: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const isPro = currentTier === "pro";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <style jsx global>{`
        body {
          overflow: auto !important;
        }
      `}</style>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Grow Your Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium features and get more customers with Pro
          </p>
        </div>

        {/* Active Subscription Banner */}
        {isPro && subscription && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Crown className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Pro Plan Active</h3>
                  <p className="text-green-100">
                    Expires:{" "}
                    {new Date(subscription.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  Auto-renewal:{" "}
                  {subscription.auto_renew ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Shield className="h-8 w-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900">Free</h3>
                    <p className="text-gray-600">Basic features</p>
                  </div>
                </div>
                {!isPro && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    CURRENT
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="text-5xl font-black text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Forever free</p>
              </div>

              <div className="space-y-3 mb-8">
                {freeFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="p-1 bg-green-100 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-1 bg-gray-100 rounded-full">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={
                        feature.included ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                disabled
                className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold cursor-not-allowed"
              >
                {isPro ? "Downgrade Available" : "Current Plan"}
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                <Star className="h-4 w-4 fill-white" />
                RECOMMENDED
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl border-4 border-white p-8 h-full text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Pro</h3>
                    <p className="text-blue-100">Premium features</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-black">$20</span>
                    <span className="text-xl text-blue-100">/month</span>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Billed monthly • Cancel anytime
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {proFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
                      >
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {isPro ? (
                  <button
                    disabled
                    className="w-full py-5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Active Plan
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleUpgradeToPro}
                    className="w-full py-5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Upgrade to Pro
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
            Why Choose Pro?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get More Leads
              </h3>
              <p className="text-gray-600">
                Appear at the top of search results and get 3x more customer
                inquiries
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Build Trust
              </h3>
              <p className="text-gray-600">
                Pro badge shows you're serious and verified, boosting customer
                confidence
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Track Performance
              </h3>
              <p className="text-gray-600">
                See detailed analytics on profile views, leads, and conversion
                rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Upgrade to Pro
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

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">
                    Monthly Subscription
                  </span>
                  <span className="text-4xl font-bold text-green-600">$20</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Billed monthly • Cancel anytime • No hidden fees
                </p>
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

                await handleSimulatePayment();

                // Re-enable button in case of error
                if (btn && !btn.disabled) {
                  btn.disabled = false;
                  btn.innerHTML = 'Simulate Payment ($20)';
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              Simulate Payment ($20)
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Test payment • No actual charges • Instant activation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderSubscription() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderSubscriptionContent />
    </ProtectedRoute>
  );
}
