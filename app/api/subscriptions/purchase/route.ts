// app/api/subscriptions/purchase/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { notificationService } from "@/lib/services/notification-service";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tier, phone_number, payment_method } = body;

  // Validate tier
  if (tier !== "pro") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Get provider details
  const { data: provider, error: providerError } = await (supabase as any)
    .from("providers")
    .select("*, profiles:user_id (full_name, email)")
    .eq("user_id", user.id)
    .single();

  if (providerError || !provider) {
    return NextResponse.json(
      { error: "Provider profile not found" },
      { status: 404 }
    );
  }

  // Check if already has active subscription
  const { data: existingSub } = await (supabase as any)
    .from("provider_subscriptions")
    .select("*")
    .eq("provider_id", provider.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .single();

  if (existingSub) {
    return NextResponse.json(
      { error: "You already have an active subscription" },
      { status: 400 }
    );
  }

  const subscriptionAmount = 20.0; // $20/month for Pro
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

  // Create subscription record
  const { data: subscription, error: subError } = await (supabase as any)
    .from("provider_subscriptions")
    .insert({
      provider_id: provider.id,
      tier: "pro",
      amount: subscriptionAmount,
      status: "pending",
      payment_status: "pending",
      expires_at: expiresAt.toISOString(),
      auto_renew: true,
    })
    .select()
    .single();

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  // Create transaction record
  const { data: transaction, error: txError } = await (supabase as any)
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "provider_subscription",
      amount: subscriptionAmount,
      status: "pending",
      payment_method: payment_method || "mtn_momo",
      related_subscription_id: subscription.id,
      metadata: {
        tier: "pro",
        phone_number,
      },
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Simulate payment processing
  // In production, this would call MTN MoMo API
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate 95% success rate
  const paymentSuccess = Math.random() > 0.05;

  if (!paymentSuccess) {
    // Payment failed
    await (supabase as any)
      .from("transactions")
      .update({
        status: "failed",
        error_message: "Payment declined or insufficient funds",
      })
      .eq("id", transaction.id);

    await (supabase as any)
      .from("provider_subscriptions")
      .update({
        status: "failed",
        payment_status: "failed",
      })
      .eq("id", subscription.id);

    // 🔔 BATCH 3 TRIGGER 1: Payment Failed (Subscription)
    try {
      await notificationService.createNotification({
        userId: user.id,
        type: "subscription_failed",
        data: {
          amount: subscriptionAmount.toFixed(2),
          reason: "Payment declined or insufficient funds",
          tier: "pro",
        },
        actionUrl: "/provider/subscription",
        relatedEntityType: "subscription",
        relatedEntityId: subscription.id,
        priority: "critical",
      });
    } catch (error) {
      console.error("Failed to send payment failed notification:", error);
    }

    return NextResponse.json(
      {
        error: "Payment failed. Please try again.",
        subscription_id: subscription.id,
      },
      { status: 400 }
    );
  }

  // Payment successful
  const { data: updatedTransaction } = await (supabase as any)
    .from("transactions")
    .update({
      status: "completed",
      external_transaction_id: `SUB_${Date.now()}`,
    })
    .eq("id", transaction.id)
    .select()
    .single();

  const { data: updatedSubscription } = await (supabase as any)
    .from("provider_subscriptions")
    .update({
      status: "active",
      payment_status: "completed",
      transaction_id: transaction.id,
    })
    .eq("id", subscription.id)
    .select()
    .single();

  // Upgrade provider tier
  await (supabase as any)
    .from("providers")
    .update({
      subscription_tier: "pro",
    })
    .eq("id", provider.id);

  // 🔔 BATCH 3 TRIGGER 3: Payment Received (Subscription Success)
  try {
    await notificationService.createNotification({
      userId: user.id,
      type: "payment_received",
      data: {
        amount: subscriptionAmount.toFixed(2),
        tier: "pro",
        next_billing_date: expiresAt.toLocaleDateString(),
        subscription_id: subscription.id,
      },
      actionUrl: "/provider/subscription",
      relatedEntityType: "subscription",
      relatedEntityId: subscription.id,
      priority: "low",
    });
  } catch (error) {
    console.error("Failed to send payment received notification:", error);
  }

  return NextResponse.json({
    success: true,
    message: "Subscription activated successfully!",
    subscription: updatedSubscription,
    transaction: updatedTransaction,
  });
}
