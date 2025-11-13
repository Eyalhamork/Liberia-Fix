// app/api/bookings/route.ts - CORRECTED WITH MEMBERSHIP PRIORITY
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";
import {
  BOOKING_FEE_CREDITS,
  BOOKING_FEE_AMOUNT,
  getBookingPaymentOptions,
} from "@/lib/constants/wallet";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's bookings (as customer or provider)
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  let query;
  if (profile?.user_type === "provider") {
    // Get provider's bookings
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (provider) {
      query = supabase
        .from("bookings")
        .select(
          `
          *,
          profiles:customer_id (full_name, phone, email),
          service_description
        `
        )
        .eq("provider_id", provider.id)
        .eq("payment_status", "completed");
    }
  } else {
    // Get customer's bookings
    query = supabase
      .from("bookings")
      .select(
        `
        *,
        providers:provider_id (
          business_name,
          profiles:user_id (full_name, phone, email)
        )
      `
      )
      .eq("customer_id", user.id)
      .eq("payment_status", "completed");
  }

  const { data, error } = await query?.order("created_at", {
    ascending: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data || [] });
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
  const { provider_id, payment_method, service_description } = body;

  // Get provider details for notifications
  const { data: provider } = await supabase
    .from("providers")
    .select("business_name, user_id, subscription_tier")
    .eq("id", provider_id)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  // Get customer details
  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name, wallet_balance")
    .eq("id", user.id)
    .single();

  if (!customer) {
    return NextResponse.json(
      { error: "Customer profile not found" },
      { status: 404 }
    );
  }

  // ============================================
  // PAYMENT PRIORITY LOGIC
  // ============================================
  // 1. Check for active membership (unlimited bookings)
  // 2. Check wallet balance
  // 3. Require direct payment

  // Check if customer has active unlimited membership
  const { data: membership } = await supabase
    .from("customer_memberships")
    .select("*")
    .eq("customer_id", user.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .single();

  const walletBalance = customer.wallet_balance || 0;
  const paymentOptions = getBookingPaymentOptions(walletBalance);

  // ============================================
  // OPTION 1: MEMBERSHIP COVERS BOOKING (FREE)
  // ============================================
  if (paymentOptions.has_membership) {
    console.log("💳 Membership covers booking - FREE");

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        id: randomUUID(),
        customer_id: user.id,
        provider_id,
        booking_fee: 0,
        payment_method: "membership",
        payment_status: "completed",
        service_description,
        booking_status: "pending",
        paid_with_wallet: false,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    // Send notifications
    try {
      await notificationService.createNotification({
        userId: user.id,
        type: "booking_confirmed",
        data: {
          provider_name: provider.business_name,
          booking_id: booking.id,
          paid_with: "membership",
        },
        actionUrl: `/customer/bookings/${booking.id}`,
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
      });

      await notificationService.createNotification({
        userId: provider.user_id,
        type:
          provider.subscription_tier === "pro"
            ? "new_booking_pro"
            : "new_booking_free",
        data: {
          customer_name: customer.full_name || "A customer",
          booking_id: booking.id,
          service_description: service_description || "your service",
        },
        actionUrl: `/provider/bookings/${booking.id}`,
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
      });
    } catch (error) {
      console.error("Failed to send notifications:", error);
    }

    return NextResponse.json({
      success: true,
      booking,
      paid_with: "membership",
      message: "Booking successful! Your membership covers this booking.",
      membership_used: true,
    });
  }

  // ============================================
  // OPTION 2: WALLET COVERS BOOKING (FREE)
  // ============================================
  if (
    paymentOptions.can_use_wallet &&
    (payment_method === "wallet" || !payment_method)
  ) {
    console.log("💰 Paying with wallet - instant booking");
    console.log(
      "💰 Wallet balance:",
      walletBalance,
      "Required:",
      BOOKING_FEE_CREDITS
    );

    // Generate booking ID
    const bookingId = randomUUID();

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        id: bookingId,
        customer_id: user.id,
        provider_id,
        booking_fee: BOOKING_FEE_AMOUNT,
        payment_method: "pay_per_booking", // Fixed: use allowed constraint value
        payment_status: "pending",
        service_description,
        booking_status: "pending",
        paid_with_wallet: true,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("❌ Booking insert failed:", bookingError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create booking",
          details: bookingError.message,
        },
        { status: 500 }
      );
    }

    // Deduct credits from wallet
    try {
      const { data: walletTxId, error: deductError } = await supabase.rpc(
        "deduct_wallet_credits",
        {
          p_user_id: user.id,
          p_credits: BOOKING_FEE_CREDITS,
          p_description: `Booking fee for ${provider.business_name}`,
          p_reference_id: booking.id,
        }
      );

      if (deductError) {
        console.error("❌ Wallet deduction error:", deductError);
        // Rollback: delete the booking
        await supabase.from("bookings").delete().eq("id", booking.id);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to deduct wallet credits",
            details: deductError.message,
            message: "Payment processing failed. Your wallet was not charged.",
          },
          { status: 500 }
        );
      }

      console.log(
        "✅ Wallet deducted successfully. Transaction ID:",
        walletTxId
      );

      // Update booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "completed",
          wallet_transaction_id: walletTxId,
          transaction_id: `WALLET_${Date.now()}`,
        })
        .eq("id", booking.id)
        .select()
        .single();

      if (updateError) {
        console.error("Booking update error:", updateError);
      }

      // Get updated wallet balance
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      // Send notifications
      try {
        await notificationService.createNotification({
          userId: user.id,
          type: "booking_confirmed",
          data: {
            provider_name: provider.business_name,
            booking_id: booking.id,
            paid_with: "wallet",
          },
          actionUrl: `/customer/bookings/${booking.id}`,
          relatedEntityType: "booking",
          relatedEntityId: booking.id,
        });

        await notificationService.createNotification({
          userId: provider.user_id,
          type:
            provider.subscription_tier === "pro"
              ? "new_booking_pro"
              : "new_booking_free",
          data: {
            customer_name: customer.full_name || "A customer",
            booking_id: booking.id,
            service_description: service_description || "your service",
          },
          actionUrl: `/provider/bookings/${booking.id}`,
          relatedEntityType: "booking",
          relatedEntityId: booking.id,
        });
      } catch (error) {
        console.error("Failed to send notifications:", error);
      }

      return NextResponse.json({
        success: true,
        booking: updatedBooking,
        paid_with: "wallet",
        new_wallet_balance: updatedProfile?.wallet_balance || 0,
        message: "Booking successful! Contact unlocked instantly.",
      });
    } catch (error: any) {
      console.error("Wallet payment error:", error);
      return NextResponse.json(
        { error: error.message || "Wallet payment failed" },
        { status: 500 }
      );
    }
  }

  // ============================================
  // OPTION 3: WALLET REQUESTED BUT INSUFFICIENT BALANCE
  // ============================================
  if (payment_method === "wallet" && !paymentOptions.can_use_wallet) {
    console.log("❌ Wallet requested but insufficient balance");
    return NextResponse.json(
      {
        success: false,
        error: "Insufficient wallet balance",
        wallet_balance: walletBalance,
        required_credits: BOOKING_FEE_CREDITS,
        shortfall: BOOKING_FEE_CREDITS - walletBalance,
        suggest_topup: true,
        topup_amount: BOOKING_FEE_AMOUNT,
        message: `You need ${BOOKING_FEE_CREDITS} credits but only have ${walletBalance.toFixed(
          1
        )} credits. Please top up your wallet or use another payment method.`,
      },
      { status: 400 }
    );
  }

  // ============================================
  // OPTION 4: DIRECT PAYMENT REQUIRED
  // ============================================
  if (payment_method && payment_method !== "wallet") {
    console.log("💳 Paying with MTN/Orange Money");

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        id: randomUUID(),
        customer_id: user.id,
        provider_id,
        booking_fee: BOOKING_FEE_AMOUNT,
        payment_method: "pay_per_booking", // Fixed: use allowed constraint value
        payment_status: "pending",
        service_description,
        booking_status: "pending",
        paid_with_wallet: false,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: false,
      requires_payment: true,
      booking,
      amount: BOOKING_FEE_AMOUNT,
      payment_method,
      message: "Please complete payment to confirm booking",
    });
  }

  // ============================================
  // NO PAYMENT METHOD PROVIDED + INSUFFICIENT FUNDS
  // ============================================
  return NextResponse.json(
    {
      success: false,
      error: "Payment required",
      payment_options: paymentOptions,
      wallet_balance: walletBalance,
      required_credits: BOOKING_FEE_CREDITS,
      shortfall: BOOKING_FEE_CREDITS - walletBalance,
      suggest_topup: true,
      topup_amount: BOOKING_FEE_AMOUNT,
      message: "Please select a payment method or top up your wallet.",
    },
    { status: 400 }
  );
}
