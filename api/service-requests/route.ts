// app/api/service-requests/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";
import { SERVICE_REQUEST_CONSTANTS } from "@/lib/types/service-request.types";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");

  // Public endpoint - anyone can view active requests
  let query = supabase
    .from("service_requests")
    .select(
      `
      *,
      profiles:customer_id (full_name, avatar_url),
      service_categories (name, icon)
    `
    );

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: show only active requests
    query = query.eq("status", "active");
  }

  // Filter by customer if provided (for customer's own requests)
  if (customerId && user?.id === customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    category,
    location,
    budget_min,
    budget_max,
    budget_type,
    urgency,
    preferred_time,
    photo_urls,
  } = body;

  // Validation
  if (!title || !description || !category || !location) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Calculate expiration (48 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SERVICE_REQUEST_CONSTANTS.REQUEST_DURATION_HOURS);

  // Create service request
  const { data: serviceRequest, error: createError } = await supabase
    .from("service_requests")
    .insert({
      customer_id: user.id,
      title,
      description,
      service_category_id: category,
      location,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      budget_type,
      urgency,
      preferred_time: preferred_time || null,
      photo_urls: photo_urls || [],
      status: "pending_payment",
      payment_status: "pending",
      payment_amount: 7.0, // $7 to post a request
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Note: Payment happens separately, then status changes to "active"
  // When payment completes, THAT'S when we trigger provider notifications

  return NextResponse.json({
    request: serviceRequest,
    message: "Service request created. Please complete payment to make it active.",
  });
}

// PUT - Mark request as paid and activate
export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { request_id, transaction_id } = body;

  if (!request_id || !transaction_id) {
    return NextResponse.json(
      { error: "Missing request_id or transaction_id" },
      { status: 400 }
    );
  }

  // Verify request belongs to user
  const { data: serviceRequest, error: fetchError } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", request_id)
    .eq("customer_id", user.id)
    .single();

  if (fetchError || !serviceRequest) {
    return NextResponse.json(
      { error: "Service request not found" },
      { status: 404 }
    );
  }

  if (serviceRequest.payment_status === "completed") {
    return NextResponse.json(
      { error: "Request already paid" },
      { status: 400 }
    );
  }

  // Update request to active
  const { data: updatedRequest, error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: "active",
      payment_status: "completed",
      transaction_id,
      activated_at: new Date().toISOString(),
    })
    .eq("id", request_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Get customer name
  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get category info
  const { data: category } = await supabase
    .from("service_categories")
    .select("name")
    .eq("id", serviceRequest.service_category_id)
    .single();

  // 🔔 BATCH 2 TRIGGER 1: New Custom Request Posted
  // Get all providers in matching category
  const { data: providers } = await supabase
    .from("provider_services")
    .select(
      `
      providers:provider_id (
        id,
        user_id,
        subscription_tier,
        business_name
      )
    `
    )
    .eq("service_category_id", serviceRequest.service_category_id);

  // Notify all providers
  if (providers && providers.length > 0) {
    for (const providerService of providers) {
      const provider = providerService.providers;
      if (!provider) continue;

      try {
        const isFree = provider.subscription_tier === "free";
        const isPro = provider.subscription_tier === "pro";

        // Determine notification type based on tier and urgency
        let notificationType = isFree
          ? "custom_request_new_free"
          : "custom_request_new_pro";

        // 🔔 BATCH 2 TRIGGER 6: Urgent Custom Request (Pro only)
        if (isPro && serviceRequest.urgency === "asap") {
          notificationType = "custom_request_urgent";
        }
        // 🔔 BATCH 2 TRIGGER 7: High Budget Request (Pro only)
        else if (
          isPro &&
          serviceRequest.budget_max &&
          serviceRequest.budget_max > 100
        ) {
          notificationType = "custom_request_high_budget";
        }

        await notificationService.createNotification({
          userId: provider.user_id,
          type: notificationType,
          data: {
            customer_name: customer?.full_name || "A customer",
            category: category?.name || "service",
            budget: serviceRequest.budget_max
              ? `$${serviceRequest.budget_max}`
              : "Open",
            location: serviceRequest.location,
            request_id: serviceRequest.id,
            urgency: serviceRequest.urgency,
          },
          actionUrl: `/provider/service-requests/${serviceRequest.id}`,
          relatedEntityType: "service_request",
          relatedEntityId: serviceRequest.id,
          priority: serviceRequest.urgency === "asap" ? "critical" : "high",
        });
      } catch (error) {
        console.error("Failed to send provider notification:", error);
        // Don't block request activation if notifications fail
      }
    }
  }

  return NextResponse.json({
    request: updatedRequest,
    message: "Service request is now active! Providers can now respond.",
  });
}
