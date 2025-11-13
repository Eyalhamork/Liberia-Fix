// lib/services/admin-notification.service.ts

/**
 * BATCH 6: Admin Alerts
 *
 * Centralized service for sending notifications to admins
 * Handles all critical events that require admin attention
 */

import { createClient } from "@supabase/supabase-js";

export type AdminAlertType =
  | "new_provider_signup"
  | "verification_request"
  | "payment_dispute"
  | "flagged_content"
  | "system_error"
  | "payment_gateway_down"
  | "fraud_alert";

export type AdminAlertPriority = "low" | "medium" | "high" | "critical";

interface AdminNotificationData {
  type: AdminAlertType;
  priority?: AdminAlertPriority;
  data: Record<string, any>;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface AdminNotificationResult {
  success: boolean;
  notificationIds: string[];
  errors: string[];
}

export class AdminNotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get all admin user IDs
   */
  private async getAdminUserIds(): Promise<string[]> {
    try {
      const { data: admins, error } = await this.supabase
        .from("users")
        .select("id")
        .eq("user_type", "admin")
        .eq("active", true);

      if (error) {
        console.error("Error fetching admin users:", error);
        return [];
      }

      return (admins || []).map((admin) => admin.id);
    } catch (error) {
      console.error("Error getting admin user IDs:", error);
      return [];
    }
  }

  /**
   * Get title and body templates for alert type
   */
  private getTemplates(type: AdminAlertType): {
    title: string;
    body: string;
  } {
    const templates: Record<AdminAlertType, { title: string; body: string }> = {
      new_provider_signup: {
        title: "New Provider Signup",
        body: "{{provider_name}} signed up as a {{category}} provider",
      },
      verification_request: {
        title: "Verification Request",
        body: "{{provider_name}} submitted {{document_type}} for verification",
      },
      payment_dispute: {
        title: "Payment Dispute! ⚠️",
        body: "Dispute opened for ${{amount}} involving {{parties}}",
      },
      flagged_content: {
        title: "Content Flagged 🚩",
        body: "{{content_type}} reported by {{reporter}}",
      },
      system_error: {
        title: "System Error! 🔴",
        body: "{{error_type}} error (severity: {{severity}})",
      },
      payment_gateway_down: {
        title: "Payment Gateway Down! 🚨",
        body: "{{gateway_name}} is experiencing issues - {{error_message}}",
      },
      fraud_alert: {
        title: "Fraud Alert! 🚨",
        body: "Suspicious activity detected: {{fraud_type}} by {{user_identifier}}",
      },
    };

    return templates[type];
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(
    template: string,
    data: Record<string, any>
  ): string {
    let result = template;
    Object.keys(data).forEach((key) => {
      const value = data[key];
      result = result.replace(
        new RegExp(`{{${key}}}`, "g"),
        value !== null && value !== undefined ? String(value) : ""
      );
    });
    return result;
  }

  /**
   * Determine priority based on alert type if not explicitly provided
   */
  private determinePriority(type: AdminAlertType): AdminAlertPriority {
    const priorityMap: Record<AdminAlertType, AdminAlertPriority> = {
      new_provider_signup: "medium",
      verification_request: "high",
      payment_dispute: "critical",
      flagged_content: "high",
      system_error: "critical",
      payment_gateway_down: "critical",
      fraud_alert: "critical",
    };

    return priorityMap[type];
  }

  /**
   * Send notification to all admins
   */
  async notifyAdmins(
    notification: AdminNotificationData
  ): Promise<AdminNotificationResult> {
    const result: AdminNotificationResult = {
      success: true,
      notificationIds: [],
      errors: [],
    };

    try {
      // Get all admin user IDs
      const adminIds = await this.getAdminUserIds();

      if (adminIds.length === 0) {
        console.warn("No admin users found to notify");
        result.success = false;
        result.errors.push("No admin users found");
        return result;
      }

      // Get templates
      const templates = this.getTemplates(notification.type);

      // Replace variables in templates
      const title = this.replaceVariables(templates.title, notification.data);
      const body = this.replaceVariables(templates.body, notification.data);

      // Determine priority
      const priority =
        notification.priority || this.determinePriority(notification.type);

      // Create notification for each admin
      for (const adminId of adminIds) {
        try {
          const { data: createdNotification, error } = await this.supabase
            .from("notifications")
            .insert({
              user_id: adminId,
              type: notification.type,
              title,
              body,
              data: notification.data,
              action_url: notification.actionUrl || "/admin/dashboard",
              related_entity_type: notification.relatedEntityType,
              related_entity_id: notification.relatedEntityId,
              priority,
            })
            .select()
            .single();

          if (error) {
            console.error(
              `Error creating notification for admin ${adminId}:`,
              error
            );
            result.errors.push(
              `Failed to notify admin ${adminId}: ${error.message}`
            );
          } else {
            result.notificationIds.push(createdNotification.id);
            console.log(
              `✅ Admin notification sent: ${notification.type} to admin ${adminId}`
            );
          }
        } catch (adminError) {
          console.error(`Error notifying admin ${adminId}:`, adminError);
          result.errors.push(
            `Failed to notify admin ${adminId}: ${adminError}`
          );
        }
      }

      // If any notification was sent successfully, consider it a success
      result.success = result.notificationIds.length > 0;
    } catch (error) {
      console.error("Fatal error in notifyAdmins:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }

  /**
   * Convenience method: New Provider Signup
   */
  async notifyNewProviderSignup(
    providerName: string,
    category: string,
    providerId: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "new_provider_signup",
      data: {
        provider_name: providerName,
        category,
      },
      actionUrl: `/admin/providers/${providerId}`,
      relatedEntityType: "provider",
      relatedEntityId: providerId,
    });

    return result.success;
  }

  /**
   * Convenience method: Verification Request
   */
  async notifyVerificationRequest(
    providerName: string,
    documentType: string,
    providerId: string,
    verificationId: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "verification_request",
      priority: "high",
      data: {
        provider_name: providerName,
        document_type: documentType,
      },
      actionUrl: `/admin/verifications/${verificationId}`,
      relatedEntityType: "verification",
      relatedEntityId: verificationId,
    });

    return result.success;
  }

  /**
   * Convenience method: Payment Dispute
   */
  async notifyPaymentDispute(
    amount: number,
    parties: string,
    disputeId: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "payment_dispute",
      priority: "critical",
      data: {
        amount: amount.toFixed(2),
        parties,
      },
      actionUrl: `/admin/disputes/${disputeId}`,
      relatedEntityType: "dispute",
      relatedEntityId: disputeId,
    });

    return result.success;
  }

  /**
   * Convenience method: Flagged Content
   */
  async notifyFlaggedContent(
    contentType: string,
    reporter: string,
    contentId: string,
    reportId: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "flagged_content",
      priority: "high",
      data: {
        content_type: contentType,
        reporter,
      },
      actionUrl: `/admin/reports/${reportId}`,
      relatedEntityType: "content_report",
      relatedEntityId: reportId,
    });

    return result.success;
  }

  /**
   * Convenience method: System Error
   */
  async notifySystemError(
    errorType: string,
    severity: "low" | "medium" | "high" | "critical",
    errorDetails: string,
    errorId?: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "system_error",
      priority: "critical",
      data: {
        error_type: errorType,
        severity,
        error_details: errorDetails,
      },
      actionUrl: `/admin/errors${errorId ? `/${errorId}` : ""}`,
      relatedEntityType: "error",
      relatedEntityId: errorId,
    });

    return result.success;
  }

  /**
   * Convenience method: Payment Gateway Down
   */
  async notifyPaymentGatewayDown(
    gatewayName: string,
    errorMessage: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "payment_gateway_down",
      priority: "critical",
      data: {
        gateway_name: gatewayName,
        error_message: errorMessage,
      },
      actionUrl: "/admin/system-status",
    });

    return result.success;
  }

  /**
   * Convenience method: Fraud Alert
   */
  async notifyFraudAlert(
    fraudType: string,
    userIdentifier: string,
    userId: string,
    alertId: string
  ): Promise<boolean> {
    const result = await this.notifyAdmins({
      type: "fraud_alert",
      priority: "critical",
      data: {
        fraud_type: fraudType,
        user_identifier: userIdentifier,
      },
      actionUrl: `/admin/fraud/${alertId}`,
      relatedEntityType: "fraud_alert",
      relatedEntityId: alertId,
    });

    return result.success;
  }
}

/**
 * Factory function
 */
export function createAdminNotificationService(): AdminNotificationService {
  return new AdminNotificationService();
}
