// app/api/cron/send-monthly-reports/route.ts

/**
 * BATCH 7: Reports & Summaries - Monthly Reports Cron Job
 *
 * This cron job runs monthly to send:
 * - Pro providers: Monthly performance report with earnings
 * - Admins: Monthly platform performance summary
 *
 * Recommended schedule: 1st of each month at 9 AM
 */

import { NextRequest, NextResponse } from "next/server";
import { createReportGenerationService } from "@/lib/services/report-generation.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized monthly reports access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting monthly reports generation...");

    const reportService = createReportGenerationService();

    // Generate monthly performance reports for pro providers
    const proProvidersResult = await reportService.generatePerformanceReportPro(
      "monthly"
    );

    // Generate monthly performance reports for admins
    const adminResult = await reportService.generateMonthlyPerformanceReport();

    const totalReports =
      proProvidersResult.reportsGenerated + adminResult.reportsGenerated;
    const allErrors = [...proProvidersResult.errors, ...adminResult.errors];

    if (proProvidersResult.success && adminResult.success) {
      console.log("✅ Monthly reports generation completed successfully");
      return NextResponse.json(
        {
          success: true,
          message: "Monthly reports generated",
          reportsGenerated: totalReports,
          proProviders: proProvidersResult.reportsGenerated,
          admins: adminResult.reportsGenerated,
          errors: allErrors,
        },
        { status: 200 }
      );
    } else {
      console.error("⚠️  Monthly reports generation completed with errors");
      return NextResponse.json(
        {
          success: false,
          message: "Monthly reports generated with errors",
          reportsGenerated: totalReports,
          errors: allErrors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Fatal error in monthly reports cron job:", error);
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
