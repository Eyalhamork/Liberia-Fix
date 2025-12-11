// app/api/disputes/route.ts

/**
 * BATCH 6: Admin Alerts - Trigger #3
 *
 * Payment Dispute API with automatic admin notification
 * When a customer or provider opens a dispute, all admins are notified
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
    const { booking_id, transaction_id, reason, description } = body;

    // Validate required fields
    if (!booking_id || !reason) {
      return NextResponse.json(
        { error: "booking_id and reason are required" },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      "service_not_provided",
      "payment_not_received",
      "poor_quality",
      "cancellation_dispute",
      "overcharge",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid dispute reason" },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select(
        `
        *,
        customer:users!bookings_customer_id_fkey(id, full_name),
        provider:providers!inner(id, business_name, user_id)
      `
      )
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user is involved in the booking
    const isCustomer = booking.customer_id === user.id;
    const isProvider = booking.provider.user_id === user.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: "You are not authorized to dispute this booking" },
        { status: 403 }
      );
    }

    // Check if dispute already exists
    const { data: existingDispute } = await (supabase as any)
      .from("payment_disputes")
      .select("id")
      .eq("booking_id", booking_id)
      .eq("status", "open")
      .single();

    if (existingDispute) {
      return NextResponse.json(
        { error: "An open dispute already exists for this booking" },
        { status: 409 }
      );
    }

    // Create dispute
    const { data: dispute, error: insertError } = await (supabase as any)
      .from("payment_disputes")
      .insert({
        booking_id,
        transaction_id: transaction_id || null,
        opened_by: user.id,
        opened_by_type: isCustomer ? "customer" : "provider",
        reason,
        description: description || null,
        status: "open",
        amount: booking.booking_fee || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating dispute:", insertError);
      return NextResponse.json(
        { error: "Failed to create dispute" },
        { status: 500 }
      );
    }

    // ==========================================
    // ADMIN NOTIFICATION TRIGGER: Payment Dispute
    // ==========================================
    try {
      const adminNotificationService = createAdminNotificationService();

      // Format parties involved
      const parties = `${booking.customer.full_name} vs ${booking.provider.business_name}`;

      await adminNotificationService.notifyPaymentDispute(
        booking.booking_fee || 0,
        parties,
        dispute.id
      );

      console.log(`✅ Admin notified of payment dispute: ${dispute.id}`);
    } catch (notificationError) {
      // Log error but don't fail the dispute creation
      console.error("Admin notification error:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        dispute,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Dispute creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch disputes
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

    const isAdmin = userData?.user_type === "admin";

    // Build query based on user type
    let query = (supabase as any)
      .from("payment_disputes")
      .select(
        `
        *,
        booking:bookings!inner(
          id,
          booking_fee,
          customer:users!bookings_customer_id_fkey(id, full_name),
          provider:providers!inner(id, business_name)
        )
      `
      )
      .order("created_at", { ascending: false });

    // If not admin, only show user's disputes
    if (!isAdmin) {
      query = query.eq("opened_by", user.id);
    }

    const { data: disputes, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching disputes:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch disputes" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        disputes: disputes || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET disputes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
