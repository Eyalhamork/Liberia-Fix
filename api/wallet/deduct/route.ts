// app/api/wallet/deduct/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BOOKING_FEE_CREDITS } from "@/lib/constants/wallet";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, credits = BOOKING_FEE_CREDITS, description } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    // Get current wallet balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if sufficient balance
    if (profile.wallet_balance < credits) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: credits,
          available: profile.wallet_balance,
        },
        { status: 400 }
      );
    }

    // Use the deduct_wallet_credits function
    const { data: result, error: deductError } = await supabase.rpc(
      "deduct_wallet_credits",
      {
        p_user_id: user.id,
        p_credits: credits,
        p_description:
          description || `Booking fee deducted for booking #${booking_id}`,
        p_reference_id: booking_id,
      }
    );

    if (deductError) {
      console.error("Wallet deduction error:", deductError);
      return NextResponse.json(
        { error: deductError.message || "Failed to deduct credits" },
        { status: 500 }
      );
    }

    // Get the transaction that was just created
    const { data: transaction } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", result)
      .single();

    // Update booking to mark as paid with wallet
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        paid_with_wallet: true,
        wallet_transaction_id: result,
        payment_status: "completed",
      })
      .eq("id", booking_id);

    if (bookingError) {
      console.error("Booking update error:", bookingError);
      // Note: We've already deducted the credits, so we log this but don't fail
    }

    // Get updated balance
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      transaction_id: result,
      transaction,
      new_balance: updatedProfile?.wallet_balance || 0,
      credits_deducted: credits,
      message: "Credits deducted successfully",
    });
  } catch (error: any) {
    console.error("Wallet deduct error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
