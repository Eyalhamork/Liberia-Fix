// lib/hooks/use-promo-check.ts
// Use this in provider dashboard/layout to check promo expiry on load

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePromoCheck(userId: string | undefined) {
  const [promoStatus, setPromoStatus] = useState<{
    isExpired: boolean;
    expiresAt: string | null;
    daysRemaining: number | null;
    tier: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    checkPromoExpiry();
  }, [userId]);

  const checkPromoExpiry = async () => {
    try {
      const { data: provider, error } = await (supabase as any)
      .from("providers")
        .select("id, subscription_tier, promo_expires_at, original_tier")
        .eq("user_id", userId as string)
        .single() as any as {
          data: {
            id: string;
            subscription_tier: string;
            promo_expires_at: string | null;
            original_tier: string | null;
          } | null;
          error: any;
        };

      if (error || !provider) return;

      // If no promo, nothing to check
      if (!provider.promo_expires_at) {
        setPromoStatus({
          isExpired: false,
          expiresAt: null,
          daysRemaining: null,
          tier: provider.subscription_tier,
        });
        return;
      }

      const expiryDate = new Date(provider.promo_expires_at);
      const now = new Date();
      const isExpired = expiryDate <= now;
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      setPromoStatus({
        isExpired,
        expiresAt: provider.promo_expires_at,
        daysRemaining: isExpired ? 0 : daysRemaining,
        tier: provider.subscription_tier,
      });

      // If expired, downgrade immediately
      if (isExpired && provider.subscription_tier === "pro") {
        const newTier = provider.original_tier || "free";

        const { error: updateError } = await (supabase as any)
      .from("providers")
          .update({
            subscription_tier: newTier,
            promo_expires_at: null,
            downgraded_at: now.toISOString(),
          })
          .eq("id", provider.id);

        if (!updateError) {
          setPromoStatus({
            isExpired: true,
            expiresAt: null,
            daysRemaining: 0,
            tier: newTier,
          });

          // Show notification
          alert(
            "Your Pro trial has expired. You've been downgraded to Free tier. Upgrade to continue enjoying Pro features!"
          );

          // Reload to refresh tier-dependent UI
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Promo check error:", err);
    }
  };

  return promoStatus;
}

// Usage in provider dashboard layout:
/*
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const promoStatus = usePromoCheck(user?.id);

  return (
    <div>
      {promoStatus?.daysRemaining && promoStatus.daysRemaining <= 7 && (
        <div className="bg-yellow-100 border-b-2 border-yellow-300 p-4 text-center">
          <p className="text-yellow-900 font-semibold">
            ⚠️ Your Pro trial expires in {promoStatus.daysRemaining} day(s).
            <a href="/provider/subscription" className="underline ml-2">
              Upgrade now to keep Pro features
            </a>
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
*/
