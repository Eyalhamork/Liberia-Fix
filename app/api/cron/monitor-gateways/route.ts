import { NextRequest, NextResponse } from "next/server";
import { monitorAllGateways } from "@/lib/monitoring/payment-gate-way-monitor";
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized gateway monitor access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting payment gateway monitoring...");

    // Monitor all payment gateways
    await monitorAllGateways();

    console.log("✅ Payment gateway monitoring completed");

    return NextResponse.json(
      {
        success: true,
        message: "Payment gateway monitoring completed",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fatal error in gateway monitoring cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
