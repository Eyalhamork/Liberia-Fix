// app/api/reports/content/route.ts

/**
 * BATCH 6: Admin Alerts - Trigger #4
 *
 * Content Reporting API with automatic admin notification
 * When users report inappropriate content, all admins are notified
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminNotificationService } from "@/lib/services/admin-notification.service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { content_type, content_id, reason, description } = body;

    // Validate required fields
    if (!content_type || !content_id || !reason) {
      return NextResponse.json(
        { error: "content_type, content_id, and reason are required" },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = [
      "provider_profile",
      "review",
      "message",
      "service_request",
      "booking",
      "other",
    ];

    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      "spam",
      "harassment",
      "inappropriate",
      "fraud",
      "misleading",
      "offensive",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const { data: existingReport } = await (supabase as any)
      .from("content_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("content_type", content_type)
      .eq("content_id", content_id)
      .eq("status", "open")
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this content" },
        { status: 409 }
      );
    }

    // Get reporter details
    const { data: reporter } = await (supabase as any)
      .from("users")
      .select("full_name, user_type")
      .eq("id", user.id)
      .single();

    // Create report
    const { data: report, error: insertError } = await (supabase as any)
      .from("content_reports")
      .insert({
        reporter_id: user.id,
        content_type,
        content_id,
        reason,
        description: description || null,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating report:", insertError);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    // ==========================================
    // ADMIN NOTIFICATION TRIGGER: Flagged Content
    // ==========================================
    try {
      const adminNotificationService = createAdminNotificationService();

      // Format content type for display
      const formattedContentType = content_type
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const reporterName = reporter?.full_name || "A user";

      await adminNotificationService.notifyFlaggedContent(
        formattedContentType,
        reporterName,
        content_id,
        report.id
      );

      console.log(`✅ Admin notified of flagged content: ${report.id}`);
    } catch (notificationError) {
      // Log error but don't fail the report submission
      console.error("Admin notification error:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        report,
        message:
          "Report submitted successfully. Our team will review it shortly.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Content report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch content reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await (supabase as any)
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (userData?.user_type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contentType = searchParams.get("content_type");

    // Build query
    let query = supabase
      .from("content_reports")
      .select(
        `
        *,
        reporter:users!content_reports_reporter_id_fkey(id, full_name, user_type)
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    const { data: reports, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching reports:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reports: reports || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
