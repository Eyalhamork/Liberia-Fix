// app/api/cron/expire-subscriptions/route.ts
// Cron job to handle expired subscriptions and downgrade providers

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
  );

  const results = {
    checked_at: new Date().toISOString(),
    expired_subscriptions: 0,
    downgraded_providers: 0,
    errors: [] as string[],
  };

  try {
    console.log("🔍 [CRON] Checking for expired subscriptions...");

    // Get all active subscriptions that have expired
    const now = new Date().toISOString();
    const { data: expiredSubscriptions, error: fetchError } = await (supabase as any)
      .from("provider_subscriptions")
      .select("*, providers!inner(id, user_id, subscription_tier)")
      .eq("status", "active")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("❌ [CRON] Failed to fetch subscriptions:", fetchError);
      results.errors.push(`Fetch error: ${fetchError.message}`);
      return NextResponse.json(results, { status: 500 });
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log("✅ [CRON] No expired subscriptions found");
      return NextResponse.json(results);
    }

    console.log(
      `📋 [CRON] Found ${expiredSubscriptions.length} expired subscriptions`
    );
    results.expired_subscriptions = expiredSubscriptions.length;

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        console.log(`⏳ [CRON] Processing subscription ${subscription.id}`);

        // Mark subscription as expired
        const { error: updateSubError } = await (supabase as any)
      .from("provider_subscriptions")
          .update({
            status: "expired",
            auto_renew: false,
          })
          .eq("id", subscription.id);

        if (updateSubError) {
          results.errors.push(
            `Failed to update subscription ${subscription.id}: ${updateSubError.message}`
          );
          continue;
        }

        // Downgrade provider to free tier
        const { error: updateProviderError } = await (supabase as any)
      .from("providers")
          .update({
            subscription_tier: "free",
            promo_expires_at: null, // Clear any promo
          })
          .eq("id", subscription.provider_id);

        if (updateProviderError) {
          results.errors.push(
            `Failed to downgrade provider ${subscription.provider_id}: ${updateProviderError.message}`
          );
          continue;
        }

        // Reset bid count for free tier
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const { error: resetBidsError } = await (supabase as any)
      .from("providers")
          .update({
            free_bids_used_this_month: 0,
            free_bids_reset_at: nextMonth.toISOString(),
          })
          .eq("id", subscription.provider_id);

        if (resetBidsError) {
          console.warn(
            `⚠️ Failed to reset bids for ${subscription.provider_id}`
          );
        }

        console.log(
          `✅ [CRON] Downgraded provider ${subscription.provider_id} to free tier`
        );
        results.downgraded_providers++;

        // TODO: Send email notification
        // await sendSubscriptionExpiredEmail(subscription.providers.user_id);
      } catch (err: any) {
        console.error(
          `❌ [CRON] Error processing subscription ${subscription.id}:`,
          err
        );
        results.errors.push(`Subscription ${subscription.id}: ${err.message}`);
      }
    }

    console.log("✅ [CRON] Subscription expiry check completed");
    console.log(`   - Expired: ${results.expired_subscriptions}`);
    console.log(`   - Downgraded: ${results.downgraded_providers}`);
    console.log(`   - Errors: ${results.errors.length}`);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("💥 [CRON] Fatal error:", error);
    results.errors.push(`Fatal error: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
}

// Also handle subscription renewals (attempt payment for auto-renew)
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    checked_at: new Date().toISOString(),
    subscriptions_due: 0,
    renewal_attempts: 0,
    successful_renewals: 0,
    failed_renewals: 0,
    errors: [] as string[],
  };

  try {
    console.log("🔄 [RENEWAL] Checking for subscriptions due for renewal...");

    // Get subscriptions expiring in next 3 days with auto-renew enabled
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const { data: dueSubscriptions, error: fetchError } = await (supabase as any)
      .from("provider_subscriptions")
      .select(
        `
        *,
        providers!inner(
          id,
          user_id,
          profiles!inner(
            phone,
            email,
            full_name
          )
        )
      `
      )
      .eq("status", "active")
      .eq("auto_renew", true)
      .gte("expires_at", now.toISOString())
      .lte("expires_at", threeDaysLater.toISOString());

    if (fetchError) {
      console.error("❌ [RENEWAL] Fetch error:", fetchError);
      results.errors.push(`Fetch error: ${fetchError.message}`);
      return NextResponse.json(results, { status: 500 });
    }

    if (!dueSubscriptions || dueSubscriptions.length === 0) {
      console.log("✅ [RENEWAL] No subscriptions due for renewal");
      return NextResponse.json(results);
    }

    console.log(
      `📋 [RENEWAL] Found ${dueSubscriptions.length} subscriptions due`
    );
    results.subscriptions_due = dueSubscriptions.length;

    // Process each subscription
    for (const subscription of dueSubscriptions) {
      results.renewal_attempts++;

      try {
        console.log(`💳 [RENEWAL] Attempting renewal for ${subscription.id}`);

        // Calculate new expiry date
        const currentExpiry = new Date(subscription.expires_at);
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + 1); // Add 1 month

        // TODO: Initiate payment via MTN Mobile Money
        // For now, we'll just extend the subscription
        // In production, this should trigger a payment request

        const { error: updateError } = await (supabase as any)
      .from("provider_subscriptions")
          .update({
            expires_at: newExpiry.toISOString(),
          })
          .eq("id", subscription.id);

        if (updateError) {
          results.failed_renewals++;
          results.errors.push(
            `Failed to renew ${subscription.id}: ${updateError.message}`
          );
          continue;
        }

        console.log(`✅ [RENEWAL] Renewed subscription ${subscription.id}`);
        results.successful_renewals++;

        // TODO: Send renewal confirmation email
      } catch (err: any) {
        results.failed_renewals++;
        results.errors.push(`Subscription ${subscription.id}: ${err.message}`);
      }
    }

    console.log("✅ [RENEWAL] Renewal check completed");
    console.log(`   - Due: ${results.subscriptions_due}`);
    console.log(`   - Attempts: ${results.renewal_attempts}`);
    console.log(`   - Successful: ${results.successful_renewals}`);
    console.log(`   - Failed: ${results.failed_renewals}`);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("💥 [RENEWAL] Fatal error:", error);
    results.errors.push(`Fatal error: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
}
