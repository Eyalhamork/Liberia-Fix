// app/api/cron/send-daily-admin-reports/route.ts

/**
 * BATCH 7: Reports & Summaries - Daily Admin Reports Cron Job
 *
 * This cron job runs daily to send:
 * - Revenue report: Yesterday's revenue breakdown
 * - User growth report: Weekly user growth metrics (on Mondays)
 *
 * Recommended schedule: Daily at 8 AM local time
 */

import { NextRequest, NextResponse } from "next/server";
import { createReportGenerationService } from "@/lib/services/report-generation.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized daily admin reports access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting daily admin reports generation...");

    const reportService = createReportGenerationService();

    // Always generate daily revenue report
    const revenueResult = await reportService.generateDailyRevenueReport();

    // Check if today is Monday (1 = Monday in JavaScript)
    const today = new Date();
    const isMonday = today.getDay() === 1;

    let growthResult = null;
    if (isMonday) {
      // Generate weekly user growth report on Mondays
      growthResult = await reportService.generateWeeklyUserGrowthReport();
    }

    const totalReports =
      revenueResult.reportsGenerated + (growthResult?.reportsGenerated || 0);
    const allErrors = [
      ...revenueResult.errors,
      ...(growthResult?.errors || []),
    ];

    const overallSuccess =
      revenueResult.success && (!growthResult || growthResult.success);

    if (overallSuccess) {
      console.log("✅ Daily admin reports generation completed successfully");
      return NextResponse.json(
        {
          success: true,
          message: "Daily admin reports generated",
          reportsGenerated: totalReports,
          revenueReports: revenueResult.reportsGenerated,
          userGrowthReports: growthResult?.reportsGenerated || 0,
          wasMonday: isMonday,
          errors: allErrors,
        },
        { status: 200 }
      );
    } else {
      console.error("⚠️  Daily admin reports generation completed with errors");
      return NextResponse.json(
        {
          success: false,
          message: "Daily admin reports generated with errors",
          reportsGenerated: totalReports,
          errors: allErrors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal error in daily admin reports cron job:", error);
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
