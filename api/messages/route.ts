// app/api/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificationService } from "@/lib/services/notification-service";

/**
 * BATCH 5: Messages & Communication
 *
 * Notification Triggers:
 * 1. Provider Response (customer notification when provider sends message)
 * 2. Upgrade Prompt (free provider: based on activity)
 */

// GET - Fetch messages between two users
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("otherUserId");

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    // Fetch messages between current user and other user
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching messages:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Filter out expired messages (older than 30 days)
    const now = new Date();
    const validMessages = (messages || []).filter((msg) => {
      const expiresAt = new Date(msg.expires_at);
      return expiresAt > now;
    });

    return NextResponse.json({ messages: validMessages }, { status: 200 });
  } catch (error) {
    console.error("GET messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
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
    const { receiver_id, message, booking_id, service_request_id } = body;

    // Validate required fields
    if (!receiver_id || !message) {
      return NextResponse.json(
        { error: "receiver_id and message are required" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id,
        message: message.trim(),
        booking_id: booking_id || null,
        service_request_id: service_request_id || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    console.log(
      "🚀 CHECKPOINT: Message inserted, about to check notifications"
    );

    // ==========================================
    // NOTIFICATION TRIGGER: Provider Response
    // ==========================================
    try {
      // Get sender's profile to check if they're a provider
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name, user_type")
        .eq("id", user.id)
        .single();

      // Get receiver's profile
      const { data: receiverProfile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", receiver_id)
        .single();

      // DEBUG LOGS - ADD THIS
      console.log("💬 Message notification check:", {
        sender_id: user.id,
        sender_type: senderProfile?.user_type,
        receiver_id,
        receiver_type: receiverProfile?.user_type,
      });

      // If sender is provider and receiver is customer, send notification
      if (
        senderProfile?.user_type === "provider" &&
        receiverProfile?.user_type === "customer"
      ) {
        // Get provider details for notification
        const { data: provider } = await supabase
          .from("providers")
          .select("business_name")
          .eq("user_id", user.id)
          .single();

        const providerName =
          provider?.business_name || senderProfile.full_name || "A provider";

        await notificationService.createNotification({
          userId: receiver_id,
          type: "provider_message",
          data: {
            provider_name: providerName,
            message_preview: message.substring(0, 100),
            sender_id: user.id,
          },
          actionUrl: `/customer/messages/${user.id}`,
          relatedEntityType: "message",
          relatedEntityId: newMessage.id,
        });

        console.log("✅ Provider message notification sent to customer");
      } else {
        console.log("⏭️ Skipping notification - not provider→customer");
      }
    } catch (notificationError) {
      console.error("❌ Notification error:", notificationError);
    }
    return NextResponse.json(
      {
        success: true,
        message: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
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
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    // Mark all messages from otherUserId as read
    const { error: updateError } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .eq("read", false);

    if (updateError) {
      console.error("Error marking messages as read:", updateError);
      return NextResponse.json(
        { error: "Failed to update messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PATCH messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
