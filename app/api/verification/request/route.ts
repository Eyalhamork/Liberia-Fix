// app/api/verifications/request/route.ts

/**
 * BATCH 6: Admin Alerts - Trigger #2
 *
 * Verification Request API with automatic admin notification
 * When a provider submits documents for verification, all admins are notified
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
    const { document_type, document_url, notes } = body;

    // Validate required fields
    if (!document_type || !document_url) {
      return NextResponse.json(
        { error: "document_type and document_url are required" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocumentTypes = [
      "business_license",
      "id_card",
      "proof_of_address",
      "certification",
      "insurance",
      "other",
    ];

    if (!validDocumentTypes.includes(document_type)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Get provider profile
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, business_name, verified")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (provider.verified) {
      return NextResponse.json(
        { error: "Provider is already verified" },
        { status: 400 }
      );
    }

    // Create verification request
    const { data: verification, error: insertError } = await supabase
      .from("provider_verifications")
      .insert({
        provider_id: provider.id,
        document_type,
        document_url,
        notes: notes || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating verification request:", insertError);
      return NextResponse.json(
        { error: "Failed to submit verification request" },
        { status: 500 }
      );
    }

    // ==========================================
    // ADMIN NOTIFICATION TRIGGER: Verification Request
    // ==========================================
    try {
      const adminNotificationService = createAdminNotificationService();

      // Format document type for display
      const formattedDocType = document_type
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      await adminNotificationService.notifyVerificationRequest(
        provider.business_name,
        formattedDocType,
        provider.id,
        verification.id
      );

      console.log(
        `✅ Admin notified of verification request: ${provider.business_name}`
      );
    } catch (notificationError) {
      // Log error but don't fail the verification submission
      console.error("Admin notification error:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        verification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Verification request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check verification status
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

    // Get provider profile
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, verified")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 }
      );
    }

    // Get verification requests
    const { data: verifications, error: fetchError } = await supabase
      .from("provider_verifications")
      .select("*")
      .eq("provider_id", provider.id)
      .order("submitted_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching verifications:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch verifications" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verified: provider.verified,
        verifications: verifications || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
