// =====================================================
// 3. PROCESS PAYMENT RETRIES
// app/api/cron/process-retries/route.ts
// Runs every 30 minutes to retry failed payments
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { createPaymentService } from "@/lib/services/payment.service";
import { SubscriptionService } from "@/lib/services/subscription.service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const mtnService = createMTNMoMoService();
    const paymentService = createPaymentService(supabase, mtnService);
    const subscriptionService = new SubscriptionService(
      supabase,
      paymentService
    );

    console.log("Starting payment retries process...");

    const results = await subscriptionService.processPaymentRetries();

    console.log("Payment retries process completed:", results);

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
