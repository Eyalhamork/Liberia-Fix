// app/api/payments/mock-service-request/route.ts
// Mock payment API for service requests - FOR TESTING ONLY

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { service_request_id, phone_number, payment_method } = body;

    if (!service_request_id) {
      return NextResponse.json(
        { error: "Service request ID is required" },
        { status: 400 }
      );
    }

    // Verify service request exists and belongs to user
    const { data: serviceRequest, error: fetchError } = await (supabase as any)
      .from("service_requests")
      .select("*")
      .eq("id", service_request_id)
      .eq("customer_id", user.id)
      .single();

    if (fetchError || !serviceRequest) {
      return NextResponse.json(
        { error: "Service request not found" },
        { status: 404 }
      );
    }

    // Check if already paid
    if (serviceRequest.payment_status === "completed") {
      return NextResponse.json(
        { error: "Service request already paid" },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // MOCK: Simulate 90% success rate
    const paymentSuccess = Math.random() > 0.1;

    if (paymentSuccess) {
      // Create transaction record
      const { data: transaction, error: transactionError } = await (supabase as any)
      .from("transactions")
        .insert({
          user_id: user.id,
          type: "booking_fee", // Or create new type "service_request_posting"
          amount: 7.0,
          status: "completed",
          payment_method: payment_method || "mtn_momo",
          external_transaction_id: `MOCK_SR_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          related_service_request_id: service_request_id,
          metadata: {
            service_request_title: serviceRequest.title,
            phone_number: phone_number,
            mock_payment: true,
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        return NextResponse.json(
          { error: "Failed to create transaction record" },
          { status: 500 }
        );
      }

      // Update service request payment status
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error: updateError } = await (supabase as any)
      .from("service_requests")
        .update({
          payment_status: "completed",
          status: "active",
          transaction_id: transaction.id,
          paid_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", service_request_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update service request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
        transaction: transaction,
        service_request_id: service_request_id,
      });
    } else {
      // Simulate payment failure
      return NextResponse.json(
        {
          success: false,
          error: "Payment failed. Please try again.",
          message:
            "Mock payment simulation failed (10% random failure for testing)",
        },
        { status: 402 }
      );
    }
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
