// app/api/service-requests/[id]/select-response/route.ts
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
  const body = await request.json();
  const { response_id } = body;

  if (!response_id) {
    return NextResponse.json(
      { error: "Response ID is required" },
      { status: 400 }
    );
  }

  // Verify service request belongs to user
  const { data: serviceRequest, error: requestError } = await (supabase as any)
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
  const { data: bid, error: bidError } = await (supabase as any)
    .from("service_request_bids")
    .select(
      `
      *,
      providers:provider_id (
        id,
        user_id,
        business_name,
        subscription_tier,
        profiles:user_id (
          full_name,
          phone,
          email
        )
      )
    `
    )
    .eq("id", response_id)
    .eq("request_id", requestId)
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  // Check if request already has maximum selected providers (2)
  const { count: selectedCount } = await (supabase as any)
    .from("service_request_bids")
    .select("*", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("status", "selected");

  if (selectedCount && selectedCount >= 2) {
    return NextResponse.json(
      { error: "Maximum of 2 providers can be selected per request" },
      { status: 400 }
    );
  }

  // Update bid status to selected
  const { data: updatedBid, error: updateError } = await (supabase as any)
    .from("service_request_bids")
    .update({
      status: "selected",
      selected_at: new Date().toISOString(),
    })
    .eq("id", response_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Update service request status to filled if this is the 2nd selection
  if (selectedCount && selectedCount === 1) {
    await (supabase as any)
      .from("service_requests")
      .update({
        status: "filled",
        closed_at: new Date().toISOString(),
      })
      .eq("id", requestId);
  }

  // 🔔 BATCH 2 TRIGGER 5: Response Selected (notify winning provider)
  try {
    const provider = bid.providers;
    await notificationService.createNotification({
      userId: provider.user_id,
      type: "response_selected",
      data: {
        customer_name: serviceRequest.profiles?.full_name || "The customer",
        request_title: serviceRequest.title,
        budget: bid.estimated_cost ? `$${bid.estimated_cost}` : "TBD",
        request_id: requestId,
      },
      actionUrl: `/provider/service-requests/${requestId}`,
      relatedEntityType: "service_request",
      relatedEntityId: requestId,
      priority: "high",
    });
  } catch (error) {
    console.error("Failed to send selection notification:", error);
  }

  // Return provider contact info to customer
  const providerContact = {
    full_name: bid.providers.profiles.full_name,
    phone: bid.providers.profiles.phone,
    email: bid.providers.profiles.email,
    business_name: bid.providers.business_name,
  };

  return NextResponse.json({
    success: true,
    message:
      "Provider selected successfully! You can now contact them directly.",
    provider_contact: providerContact,
    response: updatedBid,
  });
}
