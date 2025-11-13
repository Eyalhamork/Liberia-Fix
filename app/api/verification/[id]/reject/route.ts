// app/api/verification/[id]/reject/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  try {
    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { reason, notes } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get verification document
    const { data: verification, error: fetchError } = await supabase
      .from("provider_verification_documents")
      .select("*, providers(user_id, business_name)")
      .eq("id", params.id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: "Verification document not found" },
        { status: 404 }
      );
    }

    // Update verification status to rejected
    const { error: updateError } = await supabase
      .from("provider_verification_documents")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        admin_notes: notes || null,
      })
      .eq("id", params.id);

    if (updateError) {
      throw updateError;
    }

    // Update provider status
    const { error: providerError } = await supabase
      .from("providers")
      .update({
        verification_status: "rejected",
        verified: false,
      })
      .eq("id", verification.provider_id);

    if (providerError) {
      throw providerError;
    }

    // Create notification for provider
    await supabase.from("booking_notifications").insert({
      user_id: verification.providers.user_id,
      type: "verification_rejected",
      title: "Verification Update Required",
      message: `Your verification was not approved: ${reason}. Please resubmit your documents.`,
      read: false,
    });

    // Log admin action
    await supabase.from("admin_activity_log").insert({
      admin_id: user.id,
      action: "reject_verification",
      target_type: "verification_document",
      target_id: params.id,
      details: {
        provider_id: verification.provider_id,
        business_name: verification.providers.business_name,
        document_type: verification.document_type,
        reason,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting verification:", error);
    return NextResponse.json(
      { error: "Failed to reject verification" },
      { status: 500 }
    );
  }
}
