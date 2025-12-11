// =====================================================
// Subscription Billing Service
// lib/services/subscription.service.ts
// Handles recurring subscription payments and billing cycles
// =====================================================

import { createClient } from "@supabase/supabase-js";
import { MTNMoMoService } from "./payment.service";
import {
  ProcessSubscriptionBillingRequest,
  ProcessSubscriptionBillingResponse,
  SUBSCRIPTION_BILLING_CONFIG,
  RETRY_CONFIG,
} from "@/lib/types/payment.types";

export class SubscriptionService {
  private supabase: ReturnType<typeof createClient>;
  private paymentService: MTNMoMoService;

  constructor(
    supabaseClient: ReturnType<typeof createClient>,
    paymentService: MTNMoMoService
  ) {
    this.supabase = supabaseClient;
    this.paymentService = paymentService;
  }

  // =====================================================
  // SUBSCRIPTION BILLING
  // =====================================================

  /**
   * Process billing for a subscription
   * Called automatically for subscriptions nearing expiry
   */
  async processSubscriptionBilling(
    request: ProcessSubscriptionBillingRequest
  ): Promise<ProcessSubscriptionBillingResponse> {
    try {
      // Get subscription details
      const { data: subscription, error: subError } = await (this.supabase as any)
        .from("provider_subscriptions")
        .select(
          `
          *,
          providers!inner (
            id,
            user_id,
            profiles!inner (
              phone,
              email,
              full_name
            )
          )
        `
        )
        .eq("id", request.subscriptionId)
        .single() as {
        data: {
          id: string;
          status: string;
          auto_renew: boolean;
          providers: {
            id: string;
            user_id: string;
            profiles: { phone: string | null; email: string | null; full_name: string | null };
          };
        } | null;
        error: any;
      };

      if (subError || !subscription) {
        return {
          success: false,
          billingHistoryId: "",
          status: "failed",
          error: "Subscription not found",
        };
      }

      // Check if subscription is eligible for billing
      if (subscription.status !== "active") {
        return {
          success: false,
          billingHistoryId: "",
          status: "failed",
          error: "Subscription is not active",
        };
      }

      if (!subscription.auto_renew) {
        return {
          success: false,
          billingHistoryId: "",
          status: "failed",
          error: "Subscription auto-renew is disabled",
        };
      }

      // Check if already billed for this cycle
      const { data: existingBilling } = await (this.supabase as any)
        .from("subscription_billing_history")
        .select("id")
        .eq("subscription_id", request.subscriptionId)
        .eq("billing_cycle_start", request.billingCycleStart)
        .eq("billing_cycle_end", request.billingCycleEnd)
        .eq("status", "paid")
        .single() as {
        data: { id: string } | null;
        error: any;
      };

      if (existingBilling) {
        return {
          success: false,
          billingHistoryId: existingBilling.id,
          status: "paid",
          message: "Already billed for this cycle",
        };
      }

      // Create billing history record
      const { data: billingHistory, error: billingError } = await ((this.supabase as any)
        .from("subscription_billing_history")
        .insert({
          subscription_id: request.subscriptionId,
          billing_cycle_start: request.billingCycleStart,
          billing_cycle_end: request.billingCycleEnd,
          amount: request.amount,
          status: "scheduled",
          billed_at: new Date().toISOString(),
        })
        .select()
        .single()) as {
        data: { id: string; attempts: number } | null;
        error: any;
      };

      if (billingError || !billingHistory) {
        return {
          success: false,
          billingHistoryId: "",
          status: "failed",
          error: "Failed to create billing record",
        };
      }

      // Get provider's phone number for payment
      const providerPhone = subscription.providers.profiles.phone;

      if (!providerPhone) {
        await ((this.supabase as any)
          .from("subscription_billing_history")
          .update({
            status: "failed",
            last_error: "Provider phone number not found",
          })
          .eq("id", billingHistory.id));

        return {
          success: false,
          billingHistoryId: billingHistory.id,
          status: "failed",
          error: "Provider phone number not found",
        };
      }

      // Update billing status to processing
      await ((this.supabase as any)
        .from("subscription_billing_history")
        .update({
          status: "processing",
          attempts: billingHistory.attempts + 1,
        })
        .eq("id", billingHistory.id));

      // Initiate payment
      const paymentResult = await (this.paymentService as any).initiatePayment({
        userId: subscription.providers.user_id,
        amount: request.amount,
        currency: "USD",
        transactionType: "provider_subscription",
        paymentProvider: "mtn_momo",
        payerPhone: providerPhone,
        payerName: subscription.providers.profiles.full_name,
        relatedSubscriptionId: request.subscriptionId,
        metadata: {
          billingHistoryId: billingHistory.id,
          billingCycle: `${request.billingCycleStart} to ${request.billingCycleEnd}`,
        },
      });

      if (paymentResult.success) {
        // Payment initiated successfully
        await ((this.supabase as any)
          .from("subscription_billing_history")
          .update({
            transaction_id: paymentResult.transactionId,
            status: "processing",
          })
          .eq("id", billingHistory.id));

        return {
          success: true,
          billingHistoryId: billingHistory.id,
          transactionId: paymentResult.transactionId,
          status: "processing",
          message: "Billing initiated successfully",
        };
      } else {
        // Payment initiation failed - schedule retry
        const nextRetry = this.calculateNextRetry(billingHistory.attempts + 1);

        await ((this.supabase as any)
          .from("subscription_billing_history")
          .update({
            status: "failed",
            last_error: paymentResult.error,
            next_retry_at: nextRetry,
          })
          .eq("id", billingHistory.id));

        // Add to retry queue
        await (this.supabase as any).from("payment_retry_queue").insert({
          transaction_id: paymentResult.transactionId,
          retry_attempt: billingHistory.attempts + 1,
          next_retry_at: nextRetry,
          status: "queued",
        });

        return {
          success: false,
          billingHistoryId: billingHistory.id,
          status: "failed",
          error: paymentResult.error,
        };
      }
    } catch (error) {
      console.error("Subscription billing error:", error);
      return {
        success: false,
        billingHistoryId: "",
        status: "failed",
        error: "An unexpected error occurred",
      };
    }
  }

  // =====================================================
  // AUTOMATIC BILLING (Cron Job)
  // =====================================================

  /**
   * Process all subscriptions due for billing
   * Should be called by a cron job (e.g., daily)
   */
  async processAllDueSubscriptions(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Get subscriptions due for billing
      const dueDate = new Date();
      dueDate.setDate(
        dueDate.getDate() + SUBSCRIPTION_BILLING_CONFIG.ADVANCE_BILLING_DAYS
      );

      const { data: subscriptions, error } = await (this.supabase as any)
        .from("provider_subscriptions")
        .select("*")
        .eq("status", "active")
        .eq("auto_renew", true)
        .lte("expires_at", dueDate.toISOString())
        .gte("expires_at", new Date().toISOString()) as {
        data: Array<{
          id: string;
          provider_id: string;
          amount: number;
          expires_at: string;
        }> | null;
        error: any;
      };

      if (error || !subscriptions) {
        results.errors.push("Failed to fetch subscriptions: " + error?.message);
        return results;
      }

      // Process each subscription
      for (const subscription of subscriptions) {
        results.processed++;

        try {
          const cycleStart = new Date(subscription.expires_at);
          const cycleEnd = new Date(cycleStart);
          cycleEnd.setMonth(cycleEnd.getMonth() + 1);

          const billingResult = await this.processSubscriptionBilling({
            subscriptionId: subscription.id,
            providerId: subscription.provider_id,
            amount: subscription.amount,
            billingCycleStart: cycleStart.toISOString().split("T")[0],
            billingCycleEnd: cycleEnd.toISOString().split("T")[0],
          });

          if (billingResult.success || billingResult.status === "processing") {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(
              `Subscription ${subscription.id}: ${billingResult.error}`
            );
          }
        } catch (err) {
          results.failed++;
          results.errors.push(
            `Subscription ${subscription.id}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Process all subscriptions error:", error);
      results.errors.push(
        "Fatal error: " + (error instanceof Error ? error.message : "Unknown")
      );
      return results;
    }
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelledBy: string,
    reason?: string,
    cancellationType:
      | "voluntary"
      | "payment_failed"
      | "admin"
      | "fraud" = "voluntary"
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      // Get subscription
      const { data: subscription, error: subError } = await (this.supabase as any)
        .from("provider_subscriptions")
        .select("*, providers!inner(id)")
        .eq("id", subscriptionId)
        .single() as {
        data: {
          id: string;
          expires_at: string;
          provider_id: string;
          providers: { id: string };
        } | null;
        error: any;
      };

      if (subError || !subscription) {
        return {
          success: false,
          error: "Subscription not found",
        };
      }

      // Calculate effective until date (grace period)
      const effectiveUntil = new Date(subscription.expires_at);
      effectiveUntil.setDate(
        effectiveUntil.getDate() + SUBSCRIPTION_BILLING_CONFIG.GRACE_PERIOD_DAYS
      );

      // Update subscription status
      const { error: updateError } = await ((this.supabase as any)
        .from("provider_subscriptions")
        .update({
          status: "cancelled",
          auto_renew: false,
        })
        .eq("id", subscriptionId));

      if (updateError) {
        return {
          success: false,
          error: "Failed to cancel subscription",
        };
      }

      // Log cancellation
      await (this.supabase as any).from("subscription_cancellations").insert({
        subscription_id: subscriptionId,
        provider_id: subscription.provider_id,
        cancelled_by: cancelledBy,
        cancellation_reason: reason,
        cancellation_type: cancellationType,
        effective_until: effectiveUntil.toISOString().split("T")[0],
      });

      // If grace period hasn't started, downgrade immediately
      if (new Date() > new Date(subscription.expires_at)) {
        await ((this.supabase as any)
          .from("providers")
          .update({ subscription_tier: "free" })
          .eq("id", subscription.provider_id));
      }

      return {
        success: true,
        message: `Subscription cancelled. Access until ${effectiveUntil.toLocaleDateString()}`,
      };
    } catch (error) {
      console.error("Cancel subscription error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Handle expired subscriptions
   * Should be called by a cron job daily
   */
  async handleExpiredSubscriptions(): Promise<{
    processed: number;
    downgraded: number;
  }> {
    const results = {
      processed: 0,
      downgraded: 0,
    };

    try {
      const now = new Date();
      const gracePeriodEnd = new Date(now);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() - SUBSCRIPTION_BILLING_CONFIG.GRACE_PERIOD_DAYS
      );

      // Get expired subscriptions past grace period
      const { data: expiredSubscriptions, error } = await (this.supabase as any)
        .from("provider_subscriptions")
        .select("*")
        .eq("status", "active")
        .lt("expires_at", gracePeriodEnd.toISOString()) as {
        data: Array<{ id: string; provider_id: string }> | null;
        error: any;
      };

      if (error || !expiredSubscriptions) {
        console.error("Failed to fetch expired subscriptions:", error);
        return results;
      }

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        results.processed++;

        try {
          // Mark subscription as expired
          await ((this.supabase as any)
            .from("provider_subscriptions")
            .update({ status: "expired" })
            .eq("id", subscription.id));

          // Downgrade provider to free tier
          await ((this.supabase as any)
            .from("providers")
            .update({ subscription_tier: "free" })
            .eq("id", subscription.provider_id));

          results.downgraded++;

          // TODO: Send notification to provider
          console.log(
            `Provider ${subscription.provider_id} downgraded to free tier`
          );
        } catch (err) {
          console.error(
            `Failed to process expired subscription ${subscription.id}:`,
            err
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Handle expired subscriptions error:", error);
      return results;
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const { data: subscription, error: subError } = await (this.supabase as any)
        .from("provider_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single() as {
        data: {
          id: string;
          status: string;
          expires_at: string;
        } | null;
        error: any;
      };

      if (subError || !subscription) {
        return {
          success: false,
          error: "Subscription not found",
        };
      }

      if (subscription.status !== "cancelled") {
        return {
          success: false,
          error: "Only cancelled subscriptions can be reactivated",
        };
      }

      // Check if still within grace period
      const now = new Date();
      const expiresAt = new Date(subscription.expires_at);
      const gracePeriodEnd = new Date(expiresAt);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + SUBSCRIPTION_BILLING_CONFIG.GRACE_PERIOD_DAYS
      );

      if (now > gracePeriodEnd) {
        return {
          success: false,
          error: "Grace period has ended. Please create a new subscription.",
        };
      }

      // Reactivate subscription
      const { error: updateError } = await ((this.supabase as any)
        .from("provider_subscriptions")
        .update({
          status: "active",
          auto_renew: true,
        })
        .eq("id", subscriptionId));

      if (updateError) {
        return {
          success: false,
          error: "Failed to reactivate subscription",
        };
      }

      return {
        success: true,
        message: "Subscription reactivated successfully",
      };
    } catch (error) {
      console.error("Reactivate subscription error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  // =====================================================
  // RETRY LOGIC
  // =====================================================

  /**
   * Process payment retries
   * Called by cron job to retry failed payments
   */
  async processPaymentRetries(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
    };

    try {
      const now = new Date();

      // Get retries that are due
      const { data: retries, error } = await (this.supabase as any)
        .from("payment_retry_queue")
        .select(
          `
          *,
          payment_transactions!inner (*)
        `
        )
        .eq("status", "queued")
        .lte("next_retry_at", now.toISOString())
        .lt("retry_attempt", "max_retries") as {
        data: Array<{
          id: string;
          retry_attempt: number;
          max_retries: number;
          payment_transactions: {
            user_id: string;
            amount: number;
            currency: string;
            transaction_type: string;
            payer_phone: string;
            payer_name: string;
            related_booking_id: string | null;
            related_subscription_id: string | null;
          };
        }> | null;
        error: any;
      };

      if (error || !retries) {
        console.error("Failed to fetch payment retries:", error);
        return results;
      }

      for (const retry of retries) {
        results.processed++;

        try {
          // Mark as processing
          await ((this.supabase as any)
            .from("payment_retry_queue")
            .update({
              status: "processing",
              last_attempt_at: now.toISOString(),
            })
            .eq("id", retry.id));

          const transaction = retry.payment_transactions;

          // Retry payment
          const paymentResult = await (this.paymentService as any).initiatePayment({
            userId: transaction.user_id,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionType: transaction.transaction_type,
            paymentProvider: "mtn_momo",
            payerPhone: transaction.payer_phone,
            payerName: transaction.payer_name,
            relatedBookingId: transaction.related_booking_id,
            relatedSubscriptionId: transaction.related_subscription_id,
          });

          if (paymentResult.success) {
            // Retry successful
            await ((this.supabase as any)
              .from("payment_retry_queue")
              .update({ status: "completed" })
              .eq("id", retry.id));

            results.successful++;
          } else {
            // Retry failed
            const nextAttempt = retry.retry_attempt + 1;

            if (nextAttempt >= retry.max_retries) {
              // Max retries reached
              await ((this.supabase as any)
                .from("payment_retry_queue")
                .update({
                  status: "max_retries_reached",
                  last_error: paymentResult.error,
                })
                .eq("id", retry.id));

              // Handle subscription cancellation if applicable
              if (transaction.related_subscription_id) {
                await this.cancelSubscription(
                  transaction.related_subscription_id,
                  "system",
                  "Payment failed after maximum retries",
                  "payment_failed"
                );
              }
            } else {
              // Schedule next retry
              const nextRetry = this.calculateNextRetry(nextAttempt);

              await ((this.supabase as any)
                .from("payment_retry_queue")
                .update({
                  status: "queued",
                  retry_attempt: nextAttempt,
                  next_retry_at: nextRetry,
                  last_error: paymentResult.error,
                })
                .eq("id", retry.id));
            }

            results.failed++;
          }
        } catch (err) {
          console.error(`Failed to process retry ${retry.id}:`, err);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error("Process payment retries error:", error);
      return results;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attempt: number): string {
    const delayMinutes =
      RETRY_CONFIG.INITIAL_DELAY_MINUTES *
      Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);

    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);

    return nextRetry.toISOString();
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  async getSubscriptionStats(): Promise<{
    active: number;
    cancelled: number;
    expired: number;
    dueForBilling: number;
    failedPayments: number;
  }> {
    try {
      const [
        { count: active },
        { count: cancelled },
        { count: expired },
        { count: dueForBilling },
        { count: failedPayments },
      ] = await Promise.all([
        this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "cancelled"),
        this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "expired"),
        this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .eq("auto_renew", true)
          .lte(
            "expires_at",
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          ),
        this.supabase
          .from("subscription_billing_history")
          .select("*", { count: "exact", head: true })
          .eq("status", "failed"),
      ]);

      return {
        active: active || 0,
        cancelled: cancelled || 0,
        expired: expired || 0,
        dueForBilling: dueForBilling || 0,
        failedPayments: failedPayments || 0,
      };
    } catch (error) {
      console.error("Get subscription stats error:", error);
      return {
        active: 0,
        cancelled: 0,
        expired: 0,
        dueForBilling: 0,
        failedPayments: 0,
      };
    }
  }
}
