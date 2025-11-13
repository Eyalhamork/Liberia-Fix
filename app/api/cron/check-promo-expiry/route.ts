// API Route: app/api/cron/check-promo-expiry/route.ts
// Call this daily via Vercel Cron or similar

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
  );

  try {
    const now = new Date().toISOString();

    // Find all providers with expired promos
    const { data: expiredProviders, error: fetchError } = await supabase
      .from("providers")
      .select("id, user_id, subscription_tier, promo_expires_at, original_tier")
      .not("promo_expires_at", "is", null)
      .lt("promo_expires_at", now)
      .eq("subscription_tier", "pro"); // Only check Pro tier with active promo

    if (fetchError) throw fetchError;

    if (!expiredProviders || expiredProviders.length === 0) {
      return NextResponse.json({
        message: "No expired promos found",
        checked_at: now,
      });
    }

    console.log(`Found ${expiredProviders.length} expired promos to downgrade`);

    // Downgrade each provider
    const downgradedIds: string[] = [];
    const errors: any[] = [];

    for (const provider of expiredProviders) {
      try {
        // Downgrade to original tier (or free if not set)
        const newTier = provider.original_tier || "free";

        const { error: updateError } = await supabase
          .from("providers")
          .update({
            subscription_tier: newTier,
            promo_expires_at: null,
            downgraded_at: now,
          })
          .eq("id", provider.id);

        if (updateError) {
          errors.push({
            provider_id: provider.id,
            error: updateError.message,
          });
        } else {
          downgradedIds.push(provider.id);

          // Optional: Send email notification
          // await sendPromoExpiryEmail(provider.user_id);
        }
      } catch (err: any) {
        errors.push({
          provider_id: provider.id,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      downgraded_count: downgradedIds.length,
      downgraded_providers: downgradedIds,
      errors: errors.length > 0 ? errors : null,
      checked_at: now,
    });
  } catch (error: any) {
    console.error("Promo expiry check failed:", error);
    return NextResponse.json(
      {
        error: "Failed to check promo expiry",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// To set up Vercel Cron (add to vercel.json):
/*
{
  "crons": [
    {
      "path": "/api/cron/check-promo-expiry",
      "schedule": "0 2 * * *"
    }
  ]
}
*/

// Or call manually with:
// curl -X GET https://your-domain.com/api/cron/check-promo-expiry \
//   -H "Authorization: Bearer YOUR_CRON_SECRET"
