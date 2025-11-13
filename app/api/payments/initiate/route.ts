// app/api/payments/initiate/route.ts
// DEBUG VERSION with detailed logging

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { createPaymentService } from "@/lib/services/payment.service";
import { InitiatePaymentRequest } from "@/lib/types/payment.types";

export async function POST(request: NextRequest) {
  console.log("🚀 [PAYMENT INITIATE] Starting payment initiation");

  try {
    // Get authenticated user
    const supabase = createClient();
    console.log("🔐 [AUTH] Checking user authentication");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ [AUTH] Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [AUTH] User authenticated:", user.id);

    // Parse request body
    const body: InitiatePaymentRequest = await request.json();
    console.log("📦 [REQUEST] Parsed body:", {
      amount: body.amount,
      provider: body.paymentProvider,
      phone: body.payerPhone,
      type: body.transactionType,
    });

    // Validation
    if (!body.amount || body.amount <= 0) {
      console.error("❌ [VALIDATION] Invalid amount:", body.amount);
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (
      !body.paymentProvider ||
      !["mtn_momo", "orange_money"].includes(body.paymentProvider)
    ) {
      console.error(
        "❌ [VALIDATION] Invalid payment provider:",
        body.paymentProvider
      );
      return NextResponse.json(
        { error: "Invalid payment provider" },
        { status: 400 }
      );
    }

    if (!body.payerPhone) {
      console.error("❌ [VALIDATION] Missing phone number");
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!body.transactionType) {
      console.error("❌ [VALIDATION] Missing transaction type");
      return NextResponse.json(
        { error: "Transaction type is required" },
        { status: 400 }
      );
    }

    console.log("✅ [VALIDATION] All validations passed");

    // Ensure userId matches authenticated user
    body.userId = user.id;

    // Get IP address and user agent
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log("🌐 [REQUEST INFO]", { ipAddress, userAgent });

    // Check environment variables BEFORE creating services
    console.log("🔧 [ENV CHECK] Checking MTN MoMo configuration:");
    console.log(
      "  - MTN_MOMO_USER_ID:",
      process.env.MTN_MOMO_USER_ID ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "  - MTN_MOMO_API_KEY:",
      process.env.MTN_MOMO_API_KEY ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "  - MTN_MOMO_SUBSCRIPTION_KEY:",
      process.env.MTN_MOMO_SUBSCRIPTION_KEY ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "  - MTN_MOMO_ENVIRONMENT:",
      process.env.MTN_MOMO_ENVIRONMENT || "❌ Missing (defaulting to sandbox)"
    );
    console.log(
      "  - MTN_MOMO_CALLBACK_URL:",
      process.env.MTN_MOMO_CALLBACK_URL || "❌ Missing"
    );
    console.log(
      "  - MTN_MOMO_CURRENCY:",
      process.env.MTN_MOMO_CURRENCY || "❌ Missing (should be EUR for sandbox)"
    );

    // Initialize MTN MoMo service directly
    console.log("🏗️ [SERVICES] Creating MTN MoMo service");
    const paymentService = createMTNMoMoService();

    // Skip provider availability check (MTN only)
    console.log("🔍 [PROVIDER CHECK] Skipped (using MTN MoMo only)");

    // Initiate payment request
    console.log("💳 [PAYMENT] Initiating payment with MTN MoMo");

    const result = await paymentService.requestPayment({
      amount: body.amount,
      currency: (process.env.MTN_MOMO_CURRENCY as any) || "EUR",
      referenceId: crypto.randomUUID(),
      phoneNumber: body.payerPhone,
      payerMessage: "Service booking payment",
      payeeNote: body.transactionType,
    });

    console.log("📤 [PAYMENT] Payment initiation result:", {
      success: result.success,
      hasError: !!result.error,
      referenceId: result.referenceId,
    });

    console.log("📤 [PAYMENT] Payment initiation result:", {
      success: result.success,
      hasError: !!result.error,
      hasTransactionId: !!result.transactionId,
    });

    if (!result.success) {
      console.error("❌ [PAYMENT] Payment initiation failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("✅ [SUCCESS] Payment initiated successfully");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("💥 [ERROR] Unexpected error in payment initiation:");
    console.error("  - Error type:", error?.constructor?.name);
    console.error("  - Error message:", error?.message);
    console.error("  - Stack trace:", error?.stack);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
