// app/api/payments/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Mock payment processing - replace with actual payment provider integration
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, amount, payment_method, metadata } = body;

  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create transaction record
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type,
      amount,
      status: "completed",
      payment_method,
      external_transaction_id: `TXN_${Date.now()}`,
      metadata,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If it's a subscription payment, update provider subscription
  if (type === "subscription" && metadata?.provider_id && metadata?.tier) {
    await supabase.from("subscriptions").insert({
      provider_id: metadata.provider_id,
      tier: metadata.tier,
      status: "active",
      amount,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    // Update provider tier
    await supabase
      .from("providers")
      .update({ subscription_tier: metadata.tier })
      .eq("id", metadata.provider_id);
  }

  return NextResponse.json({
    transaction: data,
    message: "Payment processed successfully",
  });
}
