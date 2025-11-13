// app/api/cron/send-weekly-reports/route.ts

/**
 * BATCH 7: Reports & Summaries - Weekly Reports Cron Job
 *
 * This cron job runs weekly to send performance summaries:
 * - Free providers: Get activity summary with missed opportunities
 * - Pro providers: Get detailed performance metrics with earnings
 *
 * Recommended schedule: Every Monday at 9 AM local time
 */

import { NextRequest, NextResponse } from "next/server";
import { createReportGenerationService } from "@/lib/services/report-generation.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized weekly reports access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting weekly reports generation...");

    const reportService = createReportGenerationService();

    // Generate reports for free providers
    const freeProvidersResult = await reportService.generateWeeklySummaryFree();

    // Generate reports for pro providers
    const proProvidersResult = await reportService.generatePerformanceReportPro(
      "weekly"
    );

    const totalReports =
      freeProvidersResult.reportsGenerated +
      proProvidersResult.reportsGenerated;
    const allErrors = [
      ...freeProvidersResult.errors,
      ...proProvidersResult.errors,
    ];

    if (freeProvidersResult.success && proProvidersResult.success) {
      console.log("✅ Weekly reports generation completed successfully");
      return NextResponse.json(
        {
          success: true,
          message: "Weekly reports generated",
          reportsGenerated: totalReports,
          freeProviders: freeProvidersResult.reportsGenerated,
          proProviders: proProvidersResult.reportsGenerated,
          errors: allErrors,
        },
        { status: 200 }
      );
    } else {
      console.error("⚠️  Weekly reports generation completed with errors");
      return NextResponse.json(
        {
          success: false,
          message: "Weekly reports generated with errors",
          reportsGenerated: totalReports,
          errors: allErrors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal error in weekly reports cron job:", error);
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
