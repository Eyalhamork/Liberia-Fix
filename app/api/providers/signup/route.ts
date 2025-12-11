// app/api/providers/signup/route.ts

/**
 * BATCH 6: Admin Alerts - Trigger #1
 *
 * Provider Signup API with automatic admin notification
 * When a new provider signs up, all admins are notified
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
    const { business_name, category, description, phone, location, services } =
      body;

    // Validate required fields
    if (!business_name || !category) {
      return NextResponse.json(
        { error: "business_name and category are required" },
        { status: 400 }
      );
    }

    // Check if provider profile already exists
    const { data: existingProvider } = await (supabase as any)
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingProvider) {
      return NextResponse.json(
        { error: "Provider profile already exists" },
        { status: 409 }
      );
    }

    // Create provider profile
    const { data: newProvider, error: insertError } = await (supabase as any)
      .from("providers")
      .insert({
        user_id: user.id,
        business_name,
        category,
        description: description || null,
        phone: phone || null,
        location: location || null,
        services: services || [],
        subscription_tier: "free", // Start with free tier
        verified: false,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating provider:", insertError);
      return NextResponse.json(
        { error: "Failed to create provider profile" },
        { status: 500 }
      );
    }

    // Update user type to provider
    await (supabase as any)
      .from("users")
      .update({ user_type: "provider" })
      .eq("id", user.id);

    // ==========================================
    // ADMIN NOTIFICATION TRIGGER: New Provider Signup
    // ==========================================
    try {
      const adminNotificationService = createAdminNotificationService();
      await adminNotificationService.notifyNewProviderSignup(
        business_name,
        category,
        newProvider.id
      );

      console.log(`✅ Admin notified of new provider signup: ${business_name}`);
    } catch (notificationError) {
      // Log error but don't fail the signup
      console.error("Admin notification error:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        provider: newProvider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Provider signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
