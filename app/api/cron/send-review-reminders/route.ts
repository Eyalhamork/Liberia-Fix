// app/api/cron/send-review-reminders/route.ts
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

  const supabase = await createClient();

  // Calculate date range: bookings completed exactly 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const threeDaysAgoEnd = new Date(threeDaysAgo);
  threeDaysAgoEnd.setHours(23, 59, 59, 999);

  // Find completed bookings from 3 days ago
  const { data: completedBookings, error } = await (supabase as any)
    .from("bookings")
    .select(
      `
      *,
      providers:provider_id (
        id,
        business_name
      ),
      profiles:customer_id (
        id,
        full_name
      )
    `
    )
    .eq("payment_status", "completed")
    .gte("created_at", threeDaysAgo.toISOString())
    .lte("created_at", threeDaysAgoEnd.toISOString());

  if (error) {
    console.error("Error fetching completed bookings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const remindersSent: string[] = [];
  const errors: string[] = [];

  // 🔔 BATCH 4 TRIGGER 2: Review Reminder (3 days after booking)
  for (const booking of completedBookings || []) {
    try {
      // Check if customer already reviewed this provider
      const { data: existingReview } = await (supabase as any)
        .from("reviews")
        .select("id")
        .eq("customer_id", booking.customer_id)
        .eq("provider_id", booking.provider_id)
        .single();

      // Only send reminder if no review exists
      if (!existingReview) {
        // Check if we already sent a reminder for this booking
        const { data: existingNotif } = await (supabase as any)
          .from("notifications")
          .select("id")
          .eq("user_id", booking.customer_id)
          .eq("type", "review_reminder")
          .eq("related_entity_id", booking.id)
          .single();

        if (!existingNotif) {
          await notificationService.createNotification({
            userId: booking.customer_id,
            type: "review_reminder",
            data: {
              provider_name: booking.providers?.business_name || "the provider",
              days_since: "3",
              booking_id: booking.id,
              provider_id: booking.provider_id,
            },
            actionUrl: `/customer/review/${booking.provider_id}?booking_id=${booking.id}`,
            relatedEntityType: "booking",
            relatedEntityId: booking.id,
            priority: "low",
          });

          remindersSent.push(booking.id);
        }
      }
    } catch (error: any) {
      console.error(
        `Failed to send review reminder for booking ${booking.id}:`,
        error
      );
      errors.push(`${booking.id}: ${error.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    completed_bookings: completedBookings?.length || 0,
    reminders_sent: remindersSent.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
