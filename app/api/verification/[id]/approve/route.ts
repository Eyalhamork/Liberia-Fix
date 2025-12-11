// app/api/verification/[id]/approve/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single() as { data: { user_type: string | null } | null };

    if (!profile || profile.user_type !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get verification document
    const { data: verification, error: fetchError } = await (supabase as any)
      .from("provider_verification_documents")
      .select("*, providers(user_id, business_name)")
      .eq("id", params.id)
      .single() as {
        data: {
          id: string;
          provider_id: string;
          document_type: string;
          providers: { user_id: string; business_name: string };
        } | null;
        error: any;
      };

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: "Verification document not found" },
        { status: 404 }
      );
    }

    // Update verification status to approved
    const { error: updateError } = await (supabase as any)
      .from("provider_verification_documents")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      throw updateError;
    }

    // Update provider status
    const { error: providerError } = await (supabase as any)
      .from("providers")
      .update({
        verification_status: "verified",
        verified: true,
      })
      .eq("id", verification.provider_id);

    if (providerError) {
      throw providerError;
    }

    // Create notification for provider
    await (supabase as any).from("booking_notifications").insert({
      user_id: verification.providers.user_id,
      type: "verification_approved",
      title: "Account Verified!",
      message:
        "Congratulations! Your account has been verified. You now have a verified badge on your profile.",
      read: false,
    });

    // Log admin action
    await (supabase as any).from("admin_activity_log").insert({
      admin_id: user.id,
      action: "approve_verification",
      target_type: "verification_document",
      target_id: params.id,
      details: {
        provider_id: verification.provider_id,
        business_name: verification.providers.business_name,
        document_type: verification.document_type,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification approved successfully",
    });
  } catch (error) {
    console.error("Error approving verification:", error);
    return NextResponse.json(
      { error: "Failed to approve verification" },
      { status: 500 }
    );
  }
}
