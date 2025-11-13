// app/api/cron/send-upgrade-prompts/route.ts

/**
 * BATCH 5: Messages & Communication - Upgrade Prompt Cron Job
 *
 * This cron job runs daily to analyze free provider activity
 * and send upgrade prompts to those who qualify.
 *
 * Should be triggered by Vercel Cron or similar scheduler.
 *
 * Recommended schedule: Daily at 10 AM local time
 */

import { NextRequest, NextResponse } from "next/server";
import { createUpgradePromptService } from "@/lib/services/upgrade-prompt.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron job access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting upgrade prompt cron job...");

    // Create service and process upgrade prompts
    const upgradePromptService = createUpgradePromptService();
    const result = await upgradePromptService.processUpgradePrompts();

    if (result.success) {
      console.log("✅ Upgrade prompt cron job completed successfully");
      return NextResponse.json(
        {
          success: true,
          message: "Upgrade prompts processed",
          providersNotified: result.providersNotified,
          errors: result.errors,
        },
        { status: 200 }
      );
    } else {
      console.error("❌ Upgrade prompt cron job failed");
      return NextResponse.json(
        {
          success: false,
          message: "Upgrade prompt processing failed",
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal error in upgrade prompt cron job:", error);
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
