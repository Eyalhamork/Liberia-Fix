// app/api/cron/check-subscription-renewals/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

// This endpoint should be called by Vercel Cron daily
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

  // Find subscriptions expiring in 7 days
  const { data: expiringSubscriptions, error } = await supabase
    .from("provider_subscriptions")
    .select(
      `
      *,
      providers!inner (
        id,
        user_id,
        business_name,
        profiles:user_id (
          full_name,
          email
        )
      )
    `
    )
    .eq("status", "active")
    .gte("expires_at", in6Days.toISOString())
    .lte("expires_at", in7Days.toISOString());

  if (error) {
    console.error("Error fetching expiring subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notificationsSent: string[] = [];
  const errors: string[] = [];

  // 🔔 BATCH 3 TRIGGER 2: Subscription Renewal Reminder (7 days before)
  for (const subscription of expiringSubscriptions || []) {
    try {
      // Check if we already sent this notification
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", subscription.providers.user_id)
        .eq("type", "subscription_renewal")
        .eq("related_entity_id", subscription.id)
        .single();

      if (!existingNotif) {
        const expiresAt = new Date(subscription.expires_at);
        const daysRemaining = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await notificationService.createNotification({
          userId: subscription.providers.user_id,
          type: "subscription_renewal",
          data: {
            days_remaining: daysRemaining.toString(),
            amount: subscription.amount.toFixed(2),
            tier: subscription.tier,
            expires_date: expiresAt.toLocaleDateString(),
          },
          actionUrl: "/provider/subscription",
          relatedEntityType: "subscription",
          relatedEntityId: subscription.id,
          priority: "medium",
        });

        notificationsSent.push(subscription.id);
      }
    } catch (error: any) {
      console.error(
        `Failed to send renewal reminder for subscription ${subscription.id}:`,
        error
      );
      errors.push(`${subscription.id}: ${error.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    expiring_subscriptions: expiringSubscriptions?.length || 0,
    notifications_sent: notificationsSent.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
