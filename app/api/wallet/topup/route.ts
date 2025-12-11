// app/api/wallet/topup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { getCreditPackageById } from "@/lib/constants/wallet";
import { notificationService } from "@/lib/services/notification-service";
import type { Transaction } from "@/lib/types/database";

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
    const {
      package_id,
      payment_provider = "mtn_momo",
      payer_phone,
      simulate = true, // Default to simulation mode
    } = body;

    console.log("💳 Wallet top-up request:", {
      package_id,
      payment_provider,
      simulate,
      user_id: user.id,
    });

    // Validate package
    const creditPackage = getCreditPackageById(package_id);
    if (!creditPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = (await (supabase as any)
      .from("profiles")
      .select("full_name, phone, wallet_balance")
      .eq("id", user.id)
      .single()) as { data: { full_name: string | null; phone: string | null; wallet_balance: number | null } | null };

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Use phone from request or profile
    const phoneNumber = payer_phone || profile.phone;

    // Create transaction record (matching working subscription format)
    // NOTE: Using "booking_fee" type since "wallet_topup" not in DB constraint yet
    const { data: transaction, error: transactionError } = (await (supabase as any)
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "booking_fee", // Using allowed type until DB constraint updated
        amount: creditPackage.amount,
        status: "pending",
        payment_method: payment_provider,
        metadata: {
          transaction_category: "wallet_topup", // Track actual purpose in metadata
          package_id: creditPackage.id,
          package_label: creditPackage.label,
          credits: creditPackage.credits,
          bonus: creditPackage.bonus,
          total_credits: creditPackage.credits + creditPackage.bonus,
          phone_number: phoneNumber,
          simulation: simulate,
        },
      })
      .select()
      .single()) as { data: Transaction | null; error: any };

    if (transactionError || !transaction) {
      console.error("❌ Transaction creation error:", {
        error: transactionError,
        code: transactionError?.code,
        message: transactionError?.message,
        details: transactionError?.details,
        hint: transactionError?.hint,
      });
      return NextResponse.json(
        {
          error: "Failed to create transaction",
          details: transactionError?.message,
          code: transactionError?.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ Transaction created:", transaction.id);

    // ============================================
    // SIMULATION MODE (Like bookings route)
    // ============================================
    if (simulate) {
      console.log("🧪 SIMULATION MODE - Auto-completing top-up");

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate 95% success rate
      const paymentSuccess = Math.random() > 0.05;

      if (!paymentSuccess) {
        // Payment failed
        await (supabase as any)
      .from("transactions")
          .update({
            status: "failed",
            error_message: "Payment declined (simulated)",
          })
          .eq("id", transaction.id);

        return NextResponse.json(
          {
            success: false,
            error: "Payment failed. Please try again.",
            transaction_id: transaction.id,
            status: "failed",
          },
          { status: 400 }
        );
      }

      // Payment successful - update transaction
      await (supabase as any)
      .from("transactions")
        .update({
          status: "completed",
          external_transaction_id: `WALLET_MOCK_${Date.now()}`,
        })
        .eq("id", transaction.id);

      // Add credits to wallet using RPC function
      const totalCredits = creditPackage.credits + creditPackage.bonus;
      const { error: creditError } = (await (supabase as any).rpc("add_wallet_credits", {
        p_user_id: user.id,
        p_amount: creditPackage.amount,
        p_credits: totalCredits,
        p_description: `Top-up: ${creditPackage.label} (${creditPackage.credits} + ${creditPackage.bonus} bonus)`,
        p_type: "topup",
        p_payment_transaction_id: transaction.id,
        p_metadata: {
          package_id: creditPackage.id,
          package_label: creditPackage.label,
          base_credits: creditPackage.credits,
          bonus_credits: creditPackage.bonus,
        },
      })) as { data: string | null; error: any };

      if (creditError) {
        console.error("❌ Failed to add credits:", creditError);
        return NextResponse.json(
          {
            error: "Payment processed but failed to add credits",
            details: creditError.message,
          },
          { status: 500 }
        );
      }

      // Get updated balance
      const { data: updatedProfile } = (await (supabase as any)
      .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single()) as { data: { wallet_balance: number | null } | null };

      console.log("✅ Credits added successfully:", {
        credits: totalCredits,
        new_balance: updatedProfile?.wallet_balance,
      });

      console.log("🚀 ABOUT TO CREATE NOTIFICATION");

      // Create notification for successful top-up
      try {
        await notificationService.createNotification({
          userId: user.id,
          type: "wallet_topup_success",
          data: {
            credits: totalCredits,
            bonus: creditPackage.bonus,
            amount: creditPackage.amount,
            package_label: creditPackage.label,
          },
          actionUrl: "/customer/wallet",
        });
      } catch (notificationError) {
        // Don't fail the request if notification creation fails
        console.error("Failed to create notification:", notificationError);
      }

      return NextResponse.json({
        success: true,
        transaction_id: transaction.id,
        referenceId: `WALLET_MOCK_${Date.now()}`,
        amount: creditPackage.amount,
        credits: totalCredits,
        new_balance: updatedProfile?.wallet_balance || 0,
        package: creditPackage,
        status: "completed",
        message: "Top-up successful! Credits added to your wallet.",
        simulated: true,
      });
    }

    // ============================================
    // REAL MTN PAYMENT (Production)
    // ============================================
    if (payment_provider === "mtn_momo") {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: "Phone number required" },
          { status: 400 }
        );
      }

      const mtnService = createMTNMoMoService();

      const paymentResult = await (mtnService as any).initiatePayment({
        amount: creditPackage.amount,
        currency: "USD",
        phoneNumber,
        externalReference: transaction.id,
        description: `Wallet top-up: ${creditPackage.label}`,
      });

      if (!paymentResult.success) {
        // Update transaction to failed
        await (supabase as any)
      .from("transactions")
          .update({
            status: "failed",
            error_message: paymentResult.error,
          })
          .eq("id", transaction.id);

        return NextResponse.json(
          { error: paymentResult.error || "Payment initiation failed" },
          { status: 400 }
        );
      }

      // Update transaction with reference
      await (supabase as any)
      .from("transactions")
        .update({
          external_transaction_id: paymentResult.referenceId,
        })
        .eq("id", transaction.id);

      return NextResponse.json({
        success: true,
        transaction_id: transaction.id,
        referenceId: paymentResult.referenceId,
        amount: creditPackage.amount,
        credits: creditPackage.credits + creditPackage.bonus,
        package: creditPackage,
        status: "pending",
        message:
          "Please check your phone and enter your PIN to complete the payment",
      });
    }

    // Orange Money (not yet implemented)
    if (payment_provider === "orange_money") {
      return NextResponse.json(
        { error: "Orange Money coming soon" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: "Invalid payment provider" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Wallet topup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
