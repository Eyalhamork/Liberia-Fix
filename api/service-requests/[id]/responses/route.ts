// app/api/service-requests/[id]/responses/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requestId = params.id;

  // Get service request with bids
  const { data: serviceRequest, error: requestError } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      service_request_bids (
        *,
        providers:provider_id (
          id,
          business_name,
          subscription_tier,
          verified,
          total_rating,
          review_count,
          profiles:user_id (
            full_name,
            phone,
            email,
            avatar_url
          )
        )
      )
    `
    )
    .eq("id", requestId)
    .single();

  if (requestError || !serviceRequest) {
    return NextResponse.json(
      { error: "Service request not found" },
      { status: 404 }
    );
  }

  // Check if user has permission to view bids
  const isCustomer = user?.id === serviceRequest.customer_id;
  const isProvider = serviceRequest.service_request_bids?.some(
    (r: any) => r.providers?.user_id === user?.id
  );

  if (!isCustomer && !isProvider && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    request: serviceRequest,
    responses: serviceRequest.service_request_bids || [],
  });
}

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
  const { estimated_cost, estimated_duration, message } = body;

  // Verify user is a provider
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (providerError || !provider) {
    return NextResponse.json(
      { error: "You must be a provider to submit responses" },
      { status: 403 }
    );
  }

  // Get service request details
  const { data: serviceRequest, error: requestError } = await supabase
    .from("service_requests")
    .select("*, profiles:customer_id (full_name)")
    .eq("id", requestId)
    .single();

  if (requestError || !serviceRequest) {
    return NextResponse.json(
      { error: "Service request not found" },
      { status: 404 }
    );
  }

  // Check if request is still active
  if (serviceRequest.status !== "active") {
    return NextResponse.json(
      { error: "This request is no longer accepting responses" },
      { status: 400 }
    );
  }

  // Check if provider already responded
  const { data: existingBid } = await supabase
    .from("service_request_bids")
    .select("id")
    .eq("request_id", requestId)
    .eq("provider_id", provider.id)
    .single();

  if (existingBid) {
    return NextResponse.json(
      { error: "You have already submitted a bid to this request" },
      { status: 400 }
    );
  }

  // Check provider's bid limits (free tier = 1/month, pro = unlimited)
  if (provider.subscription_tier === "free") {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const { data: bidHistory } = await supabase
      .from("provider_bid_history")
      .select("bids_used")
      .eq("provider_id", provider.id)
      .eq("month", currentMonth + 1)
      .eq("year", currentYear)
      .single();

    if (bidHistory && bidHistory.bids_used >= 1) {
      return NextResponse.json(
        {
          error:
            "You've reached your monthly bid limit. Upgrade to Pro for unlimited bids!",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }
  }

  // Create bid
  const { data: bid, error: createError } = await supabase
    .from("service_request_bids")
    .insert({
      request_id: requestId,
      provider_id: provider.id,
      estimated_cost: estimated_cost || null,
      estimated_duration: estimated_duration || null,
      message,
      status: "pending",
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Update bid count on service request
  await supabase.rpc("increment_bid_count", { request_id: requestId });

  // Update provider's bid history
  if (provider.subscription_tier === "free") {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    await supabase
      .from("provider_bid_history")
      .upsert({
        provider_id: provider.id,
        month: currentMonth,
        year: currentYear,
        bids_used: 1,
      })
      .eq("provider_id", provider.id)
      .eq("month", currentMonth)
      .eq("year", currentYear);
  }

  // Get updated bid count
  const { count: bidCount } = await supabase
    .from("service_request_bids")
    .select("*", { count: "exact", head: true })
    .eq("request_id", requestId);

  // 🔔 BATCH 2 TRIGGER 2: Custom Request Response (notify customer)
  try {
    await notificationService.createNotification({
      userId: serviceRequest.customer_id,
      type: "custom_request_response",
      data: {
        provider_name: provider.business_name,
        request_title: serviceRequest.title,
        response_count: (bidCount || 0).toString(),
        request_id: requestId,
      },
      actionUrl: `/customer/service-requests/${requestId}`,
      relatedEntityType: "service_request",
      relatedEntityId: requestId,
      priority: "high",
    });
  } catch (error) {
    console.error("Failed to send customer notification:", error);
  }

  // 🔔 BATCH 2 TRIGGER 3: Multiple Responses (3+ providers)
  if (bidCount && bidCount === 3) {
    try {
      await notificationService.createNotification({
        userId: serviceRequest.customer_id,
        type: "custom_request_multiple",
        data: {
          response_count: bidCount.toString(),
          request_title: serviceRequest.title,
          request_id: requestId,
        },
        actionUrl: `/customer/service-requests/${requestId}`,
        relatedEntityType: "service_request",
        relatedEntityId: requestId,
        priority: "medium",
      });
    } catch (error) {
      console.error("Failed to send multiple responses notification:", error);
    }
  }

  return NextResponse.json({
    response: bid,
    message: "Response submitted successfully!",
    responseCount: bidCount || 0,
  });
}
