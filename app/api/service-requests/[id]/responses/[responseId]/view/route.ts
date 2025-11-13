// app/api/service-requests/[id]/responses/[responseId]/view/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

export async function POST(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: requestId, responseId } = params;

  // Verify service request belongs to user (customer)
  const { data: serviceRequest, error: requestError } = await supabase
    .from("service_requests")
    .select("*, profiles:customer_id (full_name)")
    .eq("id", requestId)
    .eq("customer_id", user.id)
    .single();

  if (requestError || !serviceRequest) {
    return NextResponse.json(
      { error: "Service request not found or unauthorized" },
      { status: 404 }
    );
  }

  // Get the bid with provider details
  const { data: bid, error: bidError } = await supabase
    .from("service_request_bids")
    .select(
      `
      *,
      providers:provider_id (
        id,
        user_id,
        business_name,
        subscription_tier
      )
    `
    )
    .eq("id", responseId)
    .eq("request_id", requestId)
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  // Check if already viewed
  const alreadyViewed = bid.viewed_by_customer;

  // Mark bid as viewed
  const { error: updateError } = await supabase
    .from("service_request_bids")
    .update({
      viewed_by_customer: true,
      viewed_at: new Date().toISOString(),
    })
    .eq("id", responseId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 🔔 BATCH 2 TRIGGER 4: Response Viewed (notify Pro provider only, and only first time)
  if (!alreadyViewed && bid.providers.subscription_tier === "pro") {
    try {
      await notificationService.createNotification({
        userId: bid.providers.user_id,
        type: "response_viewed",
        data: {
          customer_name: serviceRequest.profiles?.full_name || "The customer",
          request_title: serviceRequest.title,
          request_id: requestId,
        },
        actionUrl: `/provider/service-requests/${requestId}`,
        relatedEntityType: "service_request",
        relatedEntityId: requestId,
        priority: "medium",
      });
    } catch (error) {
      console.error("Failed to send view notification:", error);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Response marked as viewed",
  });
}
