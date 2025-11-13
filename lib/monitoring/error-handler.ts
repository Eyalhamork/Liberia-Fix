// lib/monitoring/error-handler.ts

/**
 * BATCH 6: Admin Alerts - Trigger #5
 *
 * System Error Monitoring with automatic admin notification
 * Catches critical errors and notifies admins
 */

import { createAdminNotificationService } from "@/lib/services/admin-notification.service";
import { createClient } from "@supabase/supabase-js";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

interface SystemError {
  type: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  method?: string;
}

/**
 * Log error to database
 */
async function logError(error: SystemError): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: errorLog, error: insertError } = await supabase
      .from("system_errors")
      .insert({
        error_type: error.type,
        message: error.message,
        stack: error.stack,
        severity: error.severity,
        context: error.context || {},
        user_id: error.userId,
        url: error.url,
        method: error.method,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error logging to database:", insertError);
      return null;
    }

    return errorLog.id;
  } catch (err) {
    console.error("Fatal error in error logging:", err);
    return null;
  }
}

/**
 * Handle system error and notify admins if critical
 */
export async function handleSystemError(error: SystemError): Promise<void> {
  try {
    // Log error to database
    const errorId = await logError(error);

    // Console log for immediate visibility
    console.error("System Error:", {
      type: error.type,
      severity: error.severity,
      message: error.message,
      errorId,
    });

    // ==========================================
    // ADMIN NOTIFICATION TRIGGER: System Error
    // ==========================================
    // Only notify admins for high and critical errors
    if (error.severity === "high" || error.severity === "critical") {
      try {
        const adminNotificationService = createAdminNotificationService();

        // Format error type for display
        const formattedErrorType = error.type
          .split("_")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Truncate message if too long
        const errorDetails =
          error.message.length > 100
            ? error.message.substring(0, 100) + "..."
            : error.message;

        await adminNotificationService.notifySystemError(
          formattedErrorType,
          error.severity,
          errorDetails,
          errorId || undefined
        );

        console.log(`✅ Admin notified of ${error.severity} error`);
      } catch (notificationError) {
        console.error("Failed to notify admins of error:", notificationError);
      }
    }
  } catch (handlingError) {
    // Last resort: console log
    console.error("Fatal error in error handler:", handlingError);
  }
}

/**
 * Wrapper for API route error handling
 */
export function withErrorHandling(handler: Function, routeName: string) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      // Determine severity based on error type
      let severity: ErrorSeverity = "medium";
      let errorType = "unhandled_error";

      if (error.name === "TypeError") {
        errorType = "type_error";
        severity = "high";
      } else if (error.name === "ReferenceError") {
        errorType = "reference_error";
        severity = "critical";
      } else if (error.code === "PGRST") {
        errorType = "database_error";
        severity = "high";
      } else if (error.code === "ETIMEDOUT") {
        errorType = "timeout_error";
        severity = "medium";
      }

      // Log and notify
      await handleSystemError({
        type: errorType,
        message: error.message || "Unknown error",
        stack: error.stack,
        severity,
        context: {
          routeName,
          errorName: error.name,
          errorCode: error.code,
        },
      });

      // Re-throw so API can return proper error response
      throw error;
    }
  };
}

/**
 * Convenience functions for specific error types
 */
export const ErrorMonitor = {
  /**
   * Database error
   */
  async database(error: Error, query?: string): Promise<void> {
    await handleSystemError({
      type: "database_error",
      message: error.message,
      stack: error.stack,
      severity: "high",
      context: { query },
    });
  },

  /**
   * Authentication error
   */
  async auth(error: Error, userId?: string): Promise<void> {
    await handleSystemError({
      type: "auth_error",
      message: error.message,
      stack: error.stack,
      severity: "high",
      context: { userId },
    });
  },

  /**
   * Payment error
   */
  async payment(
    error: Error,
    transactionId?: string,
    amount?: number
  ): Promise<void> {
    await handleSystemError({
      type: "payment_error",
      message: error.message,
      stack: error.stack,
      severity: "critical",
      context: { transactionId, amount },
    });
  },

  /**
   * API error
   */
  async api(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ): Promise<void> {
    await handleSystemError({
      type: "api_error",
      message: error.message,
      stack: error.stack,
      severity: statusCode && statusCode >= 500 ? "high" : "medium",
      context: { endpoint, method, statusCode },
    });
  },

  /**
   * External service error
   */
  async externalService(serviceName: string, error: Error): Promise<void> {
    await handleSystemError({
      type: "external_service_error",
      message: `${serviceName}: ${error.message}`,
      stack: error.stack,
      severity: "high",
      context: { serviceName },
    });
  },
};
