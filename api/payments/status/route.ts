// =====================================================
// 2. CHECK PAYMENT STATUS
// app/api/payments/status/route.ts
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { createPaymentService } from "@/lib/services/payment.service";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get reference ID from query params
    const searchParams = request.nextUrl.searchParams;
    const referenceId = searchParams.get("referenceId");

    if (!referenceId) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      );
    }

    // Verify transaction belongs to user
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("user_id")
      .eq("reference_id", referenceId)
      .single();

    if (!transaction || transaction.user_id !== user.id) {
      return NextResponse.json(
        { error: "Transaction not found or unauthorized" },
        { status: 404 }
      );
    }

    // Initialize services
    const mtnService = createMTNMoMoService();
    const paymentService = createPaymentService(supabase, mtnService);

    // Check payment status
    const result = await paymentService.checkPaymentStatus(referenceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
