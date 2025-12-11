// app/api/notifications/test-send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificationService } from "@/lib/services/notification-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body (optional custom data)
    let customData: Record<string, any> = {};
    try {
      customData = await request.json();
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log("[Test Send] Sending test notification to user:", user.id);

    // Send a test notification
    const result = await notificationService.createNotification({
      userId: user.id,
      type: "booking_confirmed", // Using an existing template
      data: {
        provider_name: customData.provider_name || "Test Provider",
        booking_id: customData.booking_id || "test-123",
        ...customData,
      },
      actionUrl: "/test-notifications",
    });

    console.log("[Test Send] Result:", result);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to send notification",
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationId: result.notificationId,
      deliveryStatus: result.deliveryStatus,
      message: "Test notification sent! Check your device.",
    });
  } catch (error) {
    console.error("Error in POST /api/notifications/test-send:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
