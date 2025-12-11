// lib/monitoring/payment-gateway-monitor.ts

/**
 * BATCH 6: Admin Alerts - Trigger #6
 *
 * Payment Gateway Health Monitoring with automatic admin notification
 * Monitors payment gateway status and notifies admins if down
 */

import { createAdminNotificationService } from "@/lib/services/admin-notification.service";
import { createClient } from "@supabase/supabase-js";

interface GatewayHealthCheck {
  gateway: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  error?: string;
  checkedAt: Date;
}

interface GatewayStatus {
  lastCheck: Date;
  status: "healthy" | "degraded" | "down";
  consecutiveFailures: number;
  lastNotification?: Date;
}

// Track gateway status in memory
const gatewayStatuses = new Map<string, GatewayStatus>();

/**
 * Log gateway health check to database
 */
async function logHealthCheck(check: GatewayHealthCheck): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await (supabase as any).from("payment_gateway_health").insert({
      gateway: check.gateway,
      status: check.status,
      response_time_ms: check.responseTime,
      error_message: check.error,
      checked_at: check.checkedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error logging health check:", error);
  }
}

/**
 * Check if we should notify admins
 * Only notify once per hour and after 3 consecutive failures
 */
function shouldNotifyAdmins(gateway: string): boolean {
  const status = gatewayStatuses.get(gateway);

  if (!status) {
    return false;
  }

  // Need at least 3 consecutive failures
  if (status.consecutiveFailures < 3) {
    return false;
  }

  // Don't notify if already notified in last hour
  if (status.lastNotification) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (status.lastNotification > hourAgo) {
      return false;
    }
  }

  return true;
}

/**
 * Update gateway status tracking
 */
function updateGatewayStatus(gateway: string, isHealthy: boolean): void {
  const currentStatus = gatewayStatuses.get(gateway) || {
    lastCheck: new Date(),
    status: "healthy" as const,
    consecutiveFailures: 0,
  };

  if (isHealthy) {
    // Reset failures if healthy
    gatewayStatuses.set(gateway, {
      lastCheck: new Date(),
      status: "healthy",
      consecutiveFailures: 0,
    });
  } else {
    // Increment failures if down
    gatewayStatuses.set(gateway, {
      lastCheck: new Date(),
      status: "down",
      consecutiveFailures: currentStatus.consecutiveFailures + 1,
      lastNotification: currentStatus.lastNotification,
    });
  }
}

/**
 * Check MTN Mobile Money gateway health
 */
export async function checkMTNGateway(): Promise<GatewayHealthCheck> {
  const startTime = Date.now();

  try {
    // Simple health check - ping the API
    const response = await fetch(
      `${process.env.MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_SUBSCRIPTION_KEY || "",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    const responseTime = Date.now() - startTime;

    // Consider gateway healthy if we get any response (even 401/403)
    // We're just checking if it's reachable
    const isHealthy = response.status !== 503 && response.status !== 504;

    return {
      gateway: "mtn_mobile_money",
      status: isHealthy ? "healthy" : "down",
      responseTime,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      gateway: "mtn_mobile_money",
      status: "down",
      responseTime,
      error: error.message,
      checkedAt: new Date(),
    };
  }
}

/**
 * Monitor payment gateway and notify admins if down
 */
export async function monitorPaymentGateway(
  gateway: "mtn_mobile_money"
): Promise<void> {
  try {
    let healthCheck: GatewayHealthCheck;

    // Check specific gateway
    if (gateway === "mtn_mobile_money") {
      healthCheck = await checkMTNGateway();
    } else {
      console.error("Unknown gateway:", gateway);
      return;
    }

    // Log health check
    await logHealthCheck(healthCheck);

    // Update status tracking
    updateGatewayStatus(healthCheck.gateway, healthCheck.status === "healthy");

    // Check if gateway is down
    if (healthCheck.status === "down") {
      console.warn(`⚠️  Payment gateway ${healthCheck.gateway} is DOWN`);

      // ==========================================
      // ADMIN NOTIFICATION TRIGGER: Payment Gateway Down
      // ==========================================
      if (shouldNotifyAdmins(healthCheck.gateway)) {
        const adminNotificationService = createAdminNotificationService();

        const gatewayName =
          healthCheck.gateway === "mtn_mobile_money"
            ? "MTN Mobile Money"
            : healthCheck.gateway;

        const errorMessage =
          healthCheck.error ||
          "Gateway is not responding or returning server errors";

        await adminNotificationService.notifyPaymentGatewayDown(
          gatewayName,
          errorMessage
        );

        // Update last notification time
        const status = gatewayStatuses.get(healthCheck.gateway);
        if (status) {
          status.lastNotification = new Date();
        }

        console.log(`✅ Admin notified of gateway downtime: ${gatewayName}`);
      }
    } else if (healthCheck.status === "healthy") {
      const status = gatewayStatuses.get(healthCheck.gateway);
      if (status && status.consecutiveFailures > 0) {
        console.log(`✅ Payment gateway ${healthCheck.gateway} is back online`);
      }
    }
  } catch (error) {
    console.error("Error monitoring payment gateway:", error);
  }
}

/**
 * Monitor all payment gateways
 */
export async function monitorAllGateways(): Promise<void> {
  console.log("🔍 Checking payment gateway health...");

  // Currently only MTN Mobile Money, but can add more gateways here
  await monitorPaymentGateway("mtn_mobile_money");

  console.log("✅ Gateway health check complete");
}
