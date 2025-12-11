// app/api/service-requests/[id]/close/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = params.id;

  // Verify service request belongs to user
  const { data: serviceRequest, error: requestError } = await (supabase as any)
      .from("service_requests")
    .select("*")
    .eq("id", requestId)
    .eq("customer_id", user.id)
    .single();

  if (requestError || !serviceRequest) {
    return NextResponse.json(
      { error: "Service request not found or unauthorized" },
      { status: 404 }
    );
  }

  // Close the request
  const { error: updateError } = await (supabase as any)
      .from("service_requests")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 🔔 BATCH 2 TRIGGER 9: Missed Opportunity (notify free providers who viewed)
  // Get all free providers who viewed this request but didn't respond
  const { data: category } = await (supabase as any)
      .from("service_categories")
    .select("name")
    .eq("id", serviceRequest.service_category_id)
    .single();

  // Get free providers who have this category but didn't respond
  const { data: providerServices } = await (supabase as any)
      .from("provider_services")
    .select(
      `
      providers:provider_id (
        id,
        user_id,
        subscription_tier
      )
    `
    )
    .eq("service_category_id", serviceRequest.service_category_id);

  // Get list of providers who already responded
  const { data: bids } = await (supabase as any)
      .from("service_request_bids")
    .select("provider_id")
    .eq("request_id", requestId);

  const respondedProviderIds = new Set(
    bids?.map((r: any) => r.provider_id) || []
  );

  // Notify free providers who didn't respond
  if (providerServices && providerServices.length > 0) {
    for (const ps of providerServices) {
      const provider = ps.providers;
      if (!provider) continue;

      // Only notify free providers who didn't respond
      if (
        provider.subscription_tier === "free" &&
        !respondedProviderIds.has(provider.id)
      ) {
        try {
          await notificationService.createNotification({
            userId: provider.user_id,
            type: "missed_opportunity",
            data: {
              category: category?.name || "service",
              budget: serviceRequest.budget_max
                ? `$${serviceRequest.budget_max}`
                : "TBD",
              upgrade_cta: "Upgrade to Pro to never miss opportunities!",
            },
            actionUrl: "/provider/subscription",
            relatedEntityType: "service_request",
            relatedEntityId: requestId,
            priority: "high",
          });
        } catch (error) {
          console.error(
            "Failed to send missed opportunity notification:",
            error
          );
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: "Service request closed successfully",
  });
}
