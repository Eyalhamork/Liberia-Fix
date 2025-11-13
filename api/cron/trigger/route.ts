// =====================================================
// MANUAL TRIGGER FOR TESTING
// app/api/cron/trigger/route.ts
// Only available in development
// =====================================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { job } = await request.json();

    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let endpoint = "";
    switch (job) {
      case "billing":
        endpoint = "/api/cron/process-billing";
        break;
      case "expire":
        endpoint = "/api/cron/expire-subscriptions";
        break;
      case "retry":
        endpoint = "/api/cron/process-retries";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid job type" },
          { status: 400 }
        );
    }

    // Trigger the cron job
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        job,
        result: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Manual trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger job" },
      { status: 500 }
    );
  }
}
