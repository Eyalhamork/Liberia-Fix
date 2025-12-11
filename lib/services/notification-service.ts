// lib/services/notification-service.ts
// @ts-ignore
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type {
  CreateNotificationParams,
  SendNotificationResult,
  NotificationPreferences,
} from "@/lib/types/notifications";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Create and send a notification
   */

  async createNotification(
    params: CreateNotificationParams
  ): Promise<SendNotificationResult> {
    const {
      userId,
      type,
      data = {},
      actionUrl,
      relatedEntityType,
      relatedEntityId,
      scheduledFor,
      expiresAt,
    } = params;

    console.log("🔔 [NotificationService] Starting notification creation...");
    console.log("   User ID:", userId);
    console.log("   Type:", type);
    console.log("   Data:", data);

    try {
      // Step 1: Get notification template
      console.log("📝 [Step 1] Fetching template for type:", type);
      const { data: template, error: templateError } = await this.supabase
        .from("notification_templates")
        .select("*")
        .eq("type", type)
        .eq("active", true)
        .single() as {
          data: {
            title_template: string;
            body_template: string;
            category: string;
            priority: string;
            channels: string[];
          } | null;
          error: any;
        };

      if (templateError || !template) {
        console.error("❌ Template fetch failed:", templateError);
        throw new Error(`Template not found for type: ${type}`);
      }
      console.log("✅ Template found:", template.title_template);

      // Step 2: Replace template variables
      console.log("📝 [Step 2] Replacing template variables...");
      const title = this.replaceVariables(template.title_template, data);
      const body = this.replaceVariables(template.body_template, data);
      console.log("   Title:", title);
      console.log("   Body:", body);

      // Step 3: Get user preferences
      console.log("⚙️ [Step 3] Fetching user preferences...");
      const { data: preferences, error: prefError } = await this.supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single() as { data: NotificationPreferences | null; error: any };

      if (prefError) {
        console.warn("⚠️ Preferences fetch error:", prefError);
        console.warn(
          "⚠️ Continuing without preferences (will allow notification)"
        );
      }
      console.log("   Preferences:", preferences || "NULL (using defaults)");

      // Step 4: Check if notification should be sent
      console.log("✅ [Step 4] Checking if notification should be sent...");
      const shouldSend = this.shouldSendNotification(template, preferences);
      console.log("   Should send?", shouldSend);

      if (!shouldSend) {
        console.log("❌ Notification blocked by preferences");
        return {
          success: false,
          deliveryStatus: {},
          errors: ["Notification blocked by user preferences"],
        };
      }

      // Step 5: Create notification record
      console.log("💾 [Step 5] Creating notification record...");
      const { data: notification, error: notificationError } =
        await this.supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type,
            category: template.category,
            priority: template.priority,
            title,
            body,
            data,
            action_url: actionUrl,
            related_entity_type: relatedEntityType,
            related_entity_id: relatedEntityId,
            channels: template.channels,
            scheduled_for: scheduledFor?.toISOString(),
            expires_at: expiresAt?.toISOString(),
          } as any)
          .select()
          .single() as {
            data: {
              id: string;
              title: string;
              body: string;
              type: string;
              category: string;
              priority: string;
              action_url: string | null;
              data: Record<string, any>;
            } | null;
            error: any;
          };

      if (notificationError || !notification) {
        console.error("❌ Notification insert failed:", notificationError);
        throw new Error("Failed to create notification");
      }
      console.log("✅ Notification created with ID:", notification.id);

      // Step 6: Send notification through configured channels
      console.log("📡 [Step 6] Sending through channels:", template.channels);
      const deliveryStatus: Record<string, string> = {};
      const errors: string[] = [];

      for (const channel of (template.channels as string[])) {
        console.log(`   Processing channel: ${channel}`);
        try {
          if (channel === "push" && preferences?.push_enabled !== false) {
            console.log("   ✅ Sending push notification...");
            await this.sendPushNotification(userId, notification);
            deliveryStatus[channel] = "sent";
            console.log("   ✅ Push sent successfully");
          } else if (
            channel === "email" &&
            preferences?.email_enabled !== false
          ) {
            console.log("   ⏭️ Email not implemented yet");
            deliveryStatus[channel] = "pending";
          } else if (channel === "sms" && preferences?.sms_enabled === true) {
            console.log("   ⏭️ SMS not implemented yet");
            deliveryStatus[channel] = "pending";
          } else {
            console.log(
              `   ⏭️ Channel ${channel} skipped (disabled or not implemented)`
            );
            deliveryStatus[channel] = "skipped";
          }
        } catch (error: any) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`   ❌ Channel ${channel} failed:`, errorMsg);
          deliveryStatus[channel] = "failed";
          errors.push(`${channel}: ${errorMsg}`);

          // Log error
          await this.logNotification(
            notification.id,
            userId,
            channel,
            "failed",
            errorMsg
          );
        }
      }

      // Step 7: Update notification delivery status
      console.log("📊 [Step 7] Updating delivery status...");
      await ((this.supabase as any).from("notifications") as any)
        .update({ delivery_status: deliveryStatus } as any)
        .eq("id", notification.id);

      console.log("🎉 Notification process complete!");
      console.log("   Success:", errors.length === 0);
      console.log("   Delivery status:", deliveryStatus);
      if (errors.length > 0) {
        console.log("   Errors:", errors);
      }

      return {
        success: errors.length === 0,
        notificationId: notification.id,
        deliveryStatus,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("💥 [NotificationService] FATAL ERROR:", error);
      if (error instanceof Error) {
        console.error("   Message:", error.message);
        console.error("   Stack:", error.stack);
      }
      return {
        success: false,
        deliveryStatus: {},
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(
    userId: string,
    notification: any
  ): Promise<void> {
    // Get active subscriptions for user
    const { data: subscriptions, error } = await this.supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true) as {
        data: Array<{
          id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        }> | null;
        error: any;
      };

    if (error || !subscriptions || subscriptions.length === 0) {
      throw new Error("No active subscriptions found");
    }

    const payload = JSON.stringify({
      notification_id: notification.id,
      title: notification.title,
      body: notification.body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: notification.type,
      priority: notification.priority,
      type: notification.type,
      category: notification.category,
      action_url: notification.action_url || "/",
      data: notification.data,
    });

    // Send to all devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );

          // Log success
          await this.logNotification(notification.id, userId, "push", "sent");

          // Update last_used
          await ((this.supabase as any).from("notification_subscriptions") as any)
            .update({ last_used: new Date().toISOString() } as any)
            .eq("id", sub.id);
        } catch (error: any) {
          // Handle expired subscriptions (410 Gone or 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await ((this.supabase as any).from("notification_subscriptions") as any)
              .update({ active: false } as any)
              .eq("id", sub.id);

            console.log(`Deactivated expired subscription: ${sub.id}`);
          }
          throw error;
        }
      })
    );

    // Check if at least one notification was sent successfully
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    if (successCount === 0) {
      throw new Error("Failed to send push notification to any device");
    }

    console.log(
      `Push notification sent to ${successCount}/${subscriptions.length} devices`
    );
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    template: any,
    preferences: NotificationPreferences | null
  ): boolean {
    if (!preferences) return true;

    // Check if category is enabled
    const categoryEnabled =
      preferences.categories?.[
        template.category as keyof typeof preferences.categories
      ];
    if (categoryEnabled === false) {
      return false;
    }

    // Check quiet hours
    if (preferences.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      if (
        this.isInQuietHours(
          currentTime,
          preferences.quiet_hours_start,
          preferences.quiet_hours_end
        )
      ) {
        // Allow critical notifications during quiet hours
        if (template.priority !== "critical") {
          return false;
        }
      }
    }

    // TODO: Check daily limit and frequency limits

    return true;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(current: string, start: string, end: string): boolean {
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(
    template: string,
    data: Record<string, any>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Log notification delivery
   */
  private async logNotification(
    notificationId: string,
    userId: string,
    channel: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await ((this.supabase as any).from("notification_logs") as any).insert({
      notification_id: notificationId,
      user_id: userId,
      channel,
      status,
      error_message: errorMessage,
    } as any);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await ((this.supabase as any).from("notifications") as any)
      .update({
        read: true,
        read_at: new Date().toISOString(),
      } as any)
      .eq("id", notificationId)
      .eq("user_id", userId);

    return !error;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await ((this.supabase as any).from("notifications") as any)
      .update({
        read: true,
        read_at: new Date().toISOString(),
      } as any)
      .eq("user_id", userId)
      .eq("read", false);

    return !error;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    return !error;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    let query = this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    return await query;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    return count || 0;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
