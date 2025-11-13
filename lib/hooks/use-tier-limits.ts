// lib/hooks/use-tier-limits.ts
// Hook to check and enforce tier limits

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface TierLimits {
  maxCategories: number;
  maxSpecialties: number; // per category
  maxPhotos: number;
  canBid: boolean;
  monthlyBidLimit: number; // -1 means unlimited
}

export interface TierStatus {
  tier: "free" | "pro" | "elite";
  effectiveTier: "free" | "pro" | "elite";
  limits: TierLimits;
  usage: {
    categories: number;
    photos: number;
    bidsThisMonth: number;
  };
  canAdd: {
    category: boolean;
    photo: boolean;
    bid: boolean;
  };
  subscription?: {
    expiresAt: string;
    autoRenew: boolean;
  };
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxCategories: 1,
    maxSpecialties: 3,
    maxPhotos: 1,
    canBid: true, // Can bid, but only 1/month
    monthlyBidLimit: 1,
  },
  pro: {
    maxCategories: 5,
    maxSpecialties: 5,
    maxPhotos: 20,
    canBid: true,
    monthlyBidLimit: -1, // unlimited
  },
  elite: {
    maxCategories: 999,
    maxSpecialties: 999,
    maxPhotos: 999,
    canBid: true,
    monthlyBidLimit: -1, // unlimited
  },
};

export function useTierLimits(userId: string | undefined) {
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      fetchTierStatus();
    }
  }, [userId]);

  const fetchTierStatus = async () => {
    try {
      // Get provider data
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (providerError || !provider) {
        setLoading(false);
        return;
      }

      // Determine effective tier (check promo expiry)
      const promoActive =
        provider.promo_expires_at &&
        new Date(provider.promo_expires_at) > new Date();

      const effectiveTier = promoActive ? "pro" : provider.subscription_tier;
      const limits = TIER_LIMITS[effectiveTier];

      // Get usage counts
      const { count: categoryCount } = await supabase
        .from("provider_categories")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      const { count: photoCount } = await supabase
        .from("provider_photos")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      // Get bids this month
      const bidsThisMonth = provider.free_bids_used_this_month || 0;

      // Calculate what they can add
      const canAddCategory = (categoryCount || 0) < limits.maxCategories;
      const canAddPhoto = (photoCount || 0) < limits.maxPhotos;

      let canBid = limits.canBid;
      if (effectiveTier === "free") {
        canBid = bidsThisMonth < limits.monthlyBidLimit;
      }

      // Get subscription info if pro/elite
      let subscriptionInfo = undefined;
      if (provider.subscription_tier !== "free" && !promoActive) {
        const { data: subscription } = await supabase
          .from("provider_subscriptions")
          .select("expires_at, auto_renew")
          .eq("provider_id", provider.id)
          .eq("status", "active")
          .single();

        if (subscription) {
          subscriptionInfo = subscription;
        }
      }

      setTierStatus({
        tier: provider.subscription_tier,
        effectiveTier,
        limits,
        usage: {
          categories: categoryCount || 0,
          photos: photoCount || 0,
          bidsThisMonth,
        },
        canAdd: {
          category: canAddCategory,
          photo: canAddPhoto,
          bid: canBid,
        },
        subscription: subscriptionInfo,
      });
    } catch (error) {
      console.error("Error fetching tier status:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanAdd = (
    type: "category" | "photo" | "bid"
  ): {
    allowed: boolean;
    reason?: string;
  } => {
    if (!tierStatus) {
      return { allowed: false, reason: "Loading tier information..." };
    }

    const { effectiveTier, limits, usage, canAdd } = tierStatus;

    switch (type) {
      case "category":
        if (!canAdd.category) {
          return {
            allowed: false,
            reason: `${
              effectiveTier === "free" ? "Free tier" : "Pro tier"
            } limit: ${limits.maxCategories} categor${
              limits.maxCategories === 1 ? "y" : "ies"
            }. Upgrade to ${
              effectiveTier === "free" ? "Pro" : "Elite"
            } for more.`,
          };
        }
        break;

      case "photo":
        if (!canAdd.photo) {
          return {
            allowed: false,
            reason: `${
              effectiveTier === "free" ? "Free tier" : "Pro tier"
            } limit: ${limits.maxPhotos} photo${
              limits.maxPhotos === 1 ? "" : "s"
            }. Upgrade to ${
              effectiveTier === "free" ? "Pro" : "Elite"
            } for more.`,
          };
        }
        break;

      case "bid":
        if (!canAdd.bid) {
          if (effectiveTier === "free") {
            return {
              allowed: false,
              reason: `You've used your ${limits.monthlyBidLimit} free bid this month. Upgrade to Pro for unlimited bidding!`,
            };
          }
          return {
            allowed: false,
            reason: "Bidding not available",
          };
        }
        break;
    }

    return { allowed: true };
  };

  const refresh = () => {
    fetchTierStatus();
  };

  return {
    tierStatus,
    loading,
    checkCanAdd,
    refresh,
  };
}
