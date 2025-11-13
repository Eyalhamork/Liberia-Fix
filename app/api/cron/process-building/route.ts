// app/api/cron/process-billing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { createPaymentService } from "@/lib/services/payment.service";
import { SubscriptionService } from "@/lib/services/subscription.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize services with service role (bypasses RLS)
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

    console.log("Starting subscription billing process...");

    // Process all due subscriptions
    const results = await subscriptionService.processAllDueSubscriptions();

    console.log("Billing process completed:", results);

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
