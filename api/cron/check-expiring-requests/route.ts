// app/api/cron/check-expiring-requests/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

// This endpoint should be called by Vercel Cron every hour
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Calculate time window: 24 hours from now
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  // Find active requests expiring in the next 24 hours
  // (but not yet notified - we'll track this with a flag)
  const { data: expiringRequests, error } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      profiles:customer_id (full_name)
    `
    )
    .eq("status", "active")
    .gte("expires_at", in23Hours.toISOString())
    .lte("expires_at", in24Hours.toISOString());

  if (error) {
    console.error("Error fetching expiring requests:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notificationsSent: string[] = [];
  const errors: string[] = [];

  // 🔔 BATCH 2 TRIGGER 8: Request Expiring (notify customer)
  for (const request of expiringRequests || []) {
    // Check if customer has already selected a provider
    const { count: selectedCount } = await supabase
      .from("service_request_responses")
      .select("*", { count: "exact", head: true })
      .eq("service_request_id", request.id)
      .eq("status", "selected");

    // Only notify if no provider has been selected yet
    if (!selectedCount || selectedCount === 0) {
      try {
        // Check if we already sent this notification
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", request.customer_id)
          .eq("type", "custom_request_expiring")
          .eq("related_entity_id", request.id)
          .single();

        if (!existingNotif) {
          // Calculate hours remaining
          const expiresAt = new Date(request.expires_at);
          const hoursRemaining = Math.round(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          await notificationService.createNotification({
            userId: request.customer_id,
            type: "custom_request_expiring",
            data: {
              hours_remaining: hoursRemaining.toString(),
              request_title: request.title,
              request_id: request.id,
            },
            actionUrl: `/customer/service-requests/${request.id}`,
            relatedEntityType: "service_request",
            relatedEntityId: request.id,
            priority: "medium",
          });

          notificationsSent.push(request.id);
        }
      } catch (error: any) {
        console.error(
          `Failed to send expiring notification for request ${request.id}:`,
          error
        );
        errors.push(`${request.id}: ${error.message}`);
      }
    }
  }

  // Auto-expire requests that are past their expiration time
  const { data: expiredRequests, error: expiredError } = await supabase
    .from("service_requests")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", now.toISOString());

  if (!expiredError && expiredRequests && expiredRequests.length > 0) {
    const expiredIds = expiredRequests.map((r: any) => r.id);

    await supabase
      .from("service_requests")
      .update({
        status: "expired",
        closed_at: now.toISOString(),
      })
      .in("id", expiredIds);
  }

  return NextResponse.json({
    success: true,
    expiringRequestsFound: expiringRequests?.length || 0,
    notificationsSent: notificationsSent.length,
    expiredRequests: expiredRequests?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
