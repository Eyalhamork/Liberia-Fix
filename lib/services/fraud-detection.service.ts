// lib/services/fraud-detection.service.ts

/**
 * BATCH 6: Admin Alerts - Trigger #7
 *
 * Fraud Detection Service with automatic admin notification
 * Monitors suspicious activities and notifies admins of potential fraud
 */

import { createAdminNotificationService } from "@/lib/services/admin-notification.service";
import { createClient } from "@supabase/supabase-js";

export type FraudType =
  | "multiple_failed_payments"
  | "rapid_booking_creation"
  | "suspicious_profile_changes"
  | "payment_reversal_pattern"
  | "fake_reviews"
  | "account_takeover"
  | "promo_code_abuse"
  | "identity_theft";

interface FraudAlert {
  userId: string;
  fraudType: FraudType;
  severity: "low" | "medium" | "high" | "critical";
  evidence: Record<string, any>;
  autoBlock?: boolean;
}

interface FraudCheckResult {
  isFraudulent: boolean;
  fraudType?: FraudType;
  confidence: number;
  evidence: Record<string, any>;
}

export class FraudDetectionService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Log fraud alert to database
   */
  private async logFraudAlert(alert: FraudAlert): Promise<string | null> {
    try {
      const { data: fraudAlert, error } = await this.supabase
        .from("fraud_alerts")
        .insert({
          user_id: alert.userId,
          fraud_type: alert.fraudType,
          severity: alert.severity,
          evidence: alert.evidence,
          auto_blocked: alert.autoBlock || false,
          status: "open",
        })
        .select()
        .single();

      if (error) {
        console.error("Error logging fraud alert:", error);
        return null;
      }

      return fraudAlert.id;
    } catch (error) {
      console.error("Fatal error logging fraud alert:", error);
      return null;
    }
  }

  /**
   * Block user account if fraud is critical
   */
  private async blockUser(userId: string, reason: string): Promise<void> {
    try {
      await this.supabase
        .from("users")
        .update({
          active: false,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
        })
        .eq("id", userId);

      console.log(`🚫 User ${userId} blocked due to: ${reason}`);
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  }

  /**
   * Get user identifier for notification
   */
  private async getUserIdentifier(userId: string): Promise<string> {
    try {
      const { data: user } = await this.supabase
        .from("users")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (user) {
        return user.full_name || user.email || userId.substring(0, 8);
      }

      return userId.substring(0, 8);
    } catch (error) {
      return userId.substring(0, 8);
    }
  }

  /**
   * Check for multiple failed payment attempts
   */
  async checkFailedPayments(userId: string): Promise<FraudCheckResult> {
    try {
      // Count failed payments in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { count } = await this.supabase
        .from("payment_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "failed")
        .gte("created_at", oneDayAgo.toISOString());

      const failedCount = count || 0;

      if (failedCount >= 5) {
        return {
          isFraudulent: true,
          fraudType: "multiple_failed_payments",
          confidence: Math.min(failedCount * 0.15, 0.95),
          evidence: {
            failed_payment_count: failedCount,
            time_window: "24 hours",
          },
        };
      }

      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    } catch (error) {
      console.error("Error checking failed payments:", error);
      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    }
  }

  /**
   * Check for rapid booking creation (bot behavior)
   */
  async checkRapidBookings(userId: string): Promise<FraudCheckResult> {
    try {
      // Count bookings in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const { count } = await this.supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", userId)
        .gte("created_at", oneHourAgo.toISOString());

      const bookingCount = count || 0;

      if (bookingCount >= 10) {
        return {
          isFraudulent: true,
          fraudType: "rapid_booking_creation",
          confidence: 0.9,
          evidence: {
            booking_count: bookingCount,
            time_window: "1 hour",
          },
        };
      }

      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    } catch (error) {
      console.error("Error checking rapid bookings:", error);
      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    }
  }

  /**
   * Check for suspicious profile changes
   */
  async checkProfileChanges(userId: string): Promise<FraudCheckResult> {
    try {
      // Count profile updates in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const { data: user } = await this.supabase
        .from("users")
        .select("updated_at")
        .eq("id", userId)
        .single();

      if (user && new Date(user.updated_at) > oneHourAgo) {
        // Check if provider also exists and was updated
        const { data: provider } = await this.supabase
          .from("providers")
          .select("updated_at")
          .eq("user_id", userId)
          .gte("updated_at", oneHourAgo.toISOString())
          .single();

        if (provider) {
          // Multiple rapid changes might indicate account takeover
          return {
            isFraudulent: true,
            fraudType: "suspicious_profile_changes",
            confidence: 0.7,
            evidence: {
              recent_changes: true,
              time_window: "1 hour",
            },
          };
        }
      }

      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    } catch (error) {
      console.error("Error checking profile changes:", error);
      return {
        isFraudulent: false,
        confidence: 0,
        evidence: {},
      };
    }
  }

  /**
   * Run all fraud checks for a user
   */
  async runFraudChecks(userId: string): Promise<FraudAlert | null> {
    try {
      console.log(`🔍 Running fraud checks for user: ${userId}`);

      // Run all checks in parallel
      const [failedPayments, rapidBookings, profileChanges] = await Promise.all(
        [
          this.checkFailedPayments(userId),
          this.checkRapidBookings(userId),
          this.checkProfileChanges(userId),
        ]
      );

      // Find the most severe fraud detected
      const checks = [failedPayments, rapidBookings, profileChanges];
      const fraudulentChecks = checks.filter((check) => check.isFraudulent);

      if (fraudulentChecks.length === 0) {
        return null;
      }

      // Get highest confidence fraud
      const highestConfidence = fraudulentChecks.reduce((max, check) =>
        check.confidence > max.confidence ? check : max
      );

      // Determine severity based on confidence
      let severity: "low" | "medium" | "high" | "critical" = "low";
      if (highestConfidence.confidence >= 0.9) {
        severity = "critical";
      } else if (highestConfidence.confidence >= 0.7) {
        severity = "high";
      } else if (highestConfidence.confidence >= 0.5) {
        severity = "medium";
      }

      // Auto-block if critical
      const autoBlock = severity === "critical";

      return {
        userId,
        fraudType: highestConfidence.fraudType!,
        severity,
        evidence: highestConfidence.evidence,
        autoBlock,
      };
    } catch (error) {
      console.error("Error running fraud checks:", error);
      return null;
    }
  }

  /**
   * Handle fraud alert - log, notify admins, optionally block user
   */
  async handleFraudAlert(alert: FraudAlert): Promise<void> {
    try {
      console.log(
        `🚨 Fraud detected: ${alert.fraudType} for user ${alert.userId}`
      );

      // Log alert to database
      const alertId = await this.logFraudAlert(alert);

      if (!alertId) {
        console.error("Failed to log fraud alert");
        return;
      }

      // Block user if critical
      if (alert.autoBlock) {
        await this.blockUser(
          alert.userId,
          `Automatic block due to ${alert.fraudType}`
        );
      }

      // ==========================================
      // ADMIN NOTIFICATION TRIGGER: Fraud Alert
      // ==========================================
      const adminNotificationService = createAdminNotificationService();

      // Get user identifier
      const userIdentifier = await this.getUserIdentifier(alert.userId);

      // Format fraud type for display
      const formattedFraudType = alert.fraudType
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      await adminNotificationService.notifyFraudAlert(
        formattedFraudType,
        userIdentifier,
        alert.userId,
        alertId
      );

      console.log(`✅ Admin notified of fraud alert: ${alertId}`);
    } catch (error) {
      console.error("Error handling fraud alert:", error);
    }
  }

  /**
   * Monitor user for fraud (to be called after key actions)
   */
  async monitorUser(userId: string): Promise<void> {
    const alert = await this.runFraudChecks(userId);

    if (alert) {
      await this.handleFraudAlert(alert);
    }
  }
}

/**
 * Factory function
 */
export function createFraudDetectionService(): FraudDetectionService {
  return new FraudDetectionService();
}
