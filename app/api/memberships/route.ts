// app/api/memberships/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's active membership
  const { data: membership, error } = await (supabase as any)
      .from("customer_memberships")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get booking history for upgrade recommendations
  const { count: totalBookings } = await (supabase as any)
      .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", user.id)
    .eq("payment_status", "completed");

  const { data: recentBookings } = await (supabase as any)
      .from("bookings")
    .select("booking_fee, created_at")
    .eq("customer_id", user.id)
    .eq("payment_method", "pay_per_booking")
    .eq("payment_status", "completed")
    .gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ) // Last 30 days
    .order("created_at", { ascending: false });

  const monthlySpending =
    recentBookings?.reduce((sum: number, booking: any) => sum + booking.booking_fee, 0) || 0;
  const monthlyBookings = recentBookings?.length || 0;

  const shouldRecommendUpgrade = monthlySpending >= 5 || monthlyBookings >= 3;

  return NextResponse.json({
    membership: membership || null,
    hasActiveMembership:
      membership?.status === "active" &&
      new Date(membership.expires_at || 0) > new Date(),
    stats: {
      totalBookings: totalBookings || 0,
      monthlyBookings,
      monthlySpending,
      shouldRecommendUpgrade,
    },
  });
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
  const { payment_method = "orange_money" } = body;

  // Check if user already has an active membership
  const { data: existingMembership } = await (supabase as any)
      .from("customer_memberships")
    .select("*")
    .eq("customer_id", user.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .single();

  if (existingMembership) {
    return NextResponse.json(
      { error: "You already have an active membership" },
      { status: 400 }
    );
  }

  // Calculate membership period (1 month)
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Create membership record
  const { data: membership, error: membershipError } = await (supabase as any)
      .from("customer_memberships")
    .insert({
      customer_id: user.id,
      membership_type: "unlimited_monthly",
      status: "active",
      amount: 5.0,
      starts_at: startDate.toISOString(),
      expires_at: endDate.toISOString(),
      auto_renew: true,
    } as any)
    .select()
    .single();

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  // Simulate payment processing
  // In production, integrate with Orange Money/MTN Mobile Money here
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Create transaction record
  const { error: transactionError } = await (supabase as any)
      .from("transactions")
    .insert({
      user_id: user.id,
      type: "customer_membership",
      amount: 5.0,
      status: "completed",
      payment_method,
      external_transaction_id: `MEM_${Date.now()}`,
      related_membership_id: membership.id,
      metadata: {
        membership_type: "unlimited_monthly",
        billing_cycle: "monthly",
      },
    } as any);

  if (transactionError) {
    console.error("Transaction creation failed:", transactionError);
    // Don't fail the whole request for transaction logging issues
  }

  return NextResponse.json({
    membership,
    message:
      "Membership activated successfully! You now have unlimited bookings.",
    benefits: [
      "Unlimited provider bookings",
      "No per-booking fees",
      "Priority customer support",
      "Booking history & management",
      "Cancel anytime",
    ],
  });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cancel active membership
  const { data: membership, error } = await (supabase as any)
      .from("customer_memberships")
    .update({
      status: "cancelled",
      auto_renew: false,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("customer_id", user.id)
    .eq("status", "active")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json(
      { error: "No active membership found to cancel" },
      { status: 404 }
    );
  }

  // Log cancellation transaction
  await (supabase as any).from("transactions").insert({
    user_id: user.id,
    type: "customer_membership",
    amount: 0,
    status: "completed",
    payment_method: "cancellation",
    related_membership_id: membership.id,
    metadata: {
      action: "cancelled",
      cancelled_at: new Date().toISOString(),
    },
  } as any);

  return NextResponse.json({
    message:
      "Membership cancelled successfully. You can still use unlimited bookings until your current period ends.",
    membership,
    remainingDays: Math.ceil(
      (new Date(membership.expires_at!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  });
}
