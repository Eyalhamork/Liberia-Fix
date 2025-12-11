// lib/services/mtn-momo.service.ts
// Pure fetch implementation - works on Vercel, Cloudflare Workers, anywhere!
// NO DEPENDENCIES - perfect for serverless/edge environments

import type { Currency } from "@/lib/types/payment.types";

interface RequestPaymentParams {
  amount: number;
  currency: Currency;
  referenceId: string;
  phoneNumber: string;
  payerMessage: string;
  payeeNote: string;
}

interface PaymentResponse {
  success: boolean;
  referenceId: string;
  error?: {
    code: string;
    message: string;
    provider: string;
    details?: any;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  data?: any;
  error?: {
    code: string;
    message: string;
    provider: string;
  };
}

export class MTNMoMoService {
  private apiUser: string;
  private apiKey: string;
  private subscriptionKey: string;
  private environment: "sandbox" | "production";
  private baseUrl: string;
  private isConfigured: boolean;

  // Token caching
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.apiUser = process.env.MTN_MOMO_API_USER || "";
    this.apiKey = process.env.MTN_MOMO_API_KEY || "";
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY || "";
    this.environment =
      (process.env.MTN_MOMO_ENVIRONMENT as "sandbox" | "production") ||
      "sandbox";
    this.baseUrl =
      process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

    this.isConfigured = !!(this.apiUser && this.apiKey && this.subscriptionKey);

    if (this.isConfigured) {
      console.log("✅ [MTN MOMO] Service initialized");
    } else {
      console.warn("⚠️ [MTN MOMO] Missing credentials");
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Format phone number for MTN MoMo Liberia
   * Liberians enter: 0881948577
   * MTN expects: 0881948577 (10 digits for sandbox)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // Remove country code if present (231 for Liberia)
    if (cleaned.startsWith("231")) {
      cleaned = cleaned.slice(3);
    }

    // Remove leading zero
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    // Pad to 9 digits if needed, then add leading 0
    cleaned = cleaned.padStart(9, "0");
    cleaned = "0" + cleaned;

    console.log(`📱 [MTN MOMO] Phone formatted: ${phone} -> ${cleaned}`);
    return cleaned;
  }

  /**
   * Get OAuth access token
   * Tokens are cached until expiry
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      console.log("🔑 [MTN MOMO] Using cached token");
      return this.accessToken;
    }

    console.log("🔑 [MTN MOMO] Fetching new access token");

    try {
      const authString = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString(
        "base64"
      );

      const response = await fetch(`${this.baseUrl}/collection/token/`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Ocp-Apim-Subscription-Key": this.subscriptionKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token fetch failed: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      // Cache token (expires_in is in seconds, subtract 60s buffer)
      this.accessToken = data.access_token || "";
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

      console.log("✅ [MTN MOMO] Access token obtained");
      return this.accessToken!;
    } catch (error: any) {
      console.error("❌ [MTN MOMO] Token fetch failed:", error);
      throw error;
    }
  }

  /**
   * Request payment from customer
   * This triggers the USSD prompt on their phone
   */
  async requestPayment(params: RequestPaymentParams): Promise<PaymentResponse> {
    console.log("💳 [MTN MOMO] Requesting payment:", {
      amount: params.amount,
      referenceId: params.referenceId,
      phone: params.phoneNumber,
    });

    if (!this.isAvailable()) {
      return {
        success: false,
        referenceId: params.referenceId,
        error: {
          code: "SERVICE_NOT_AVAILABLE",
          message: "MTN MoMo service is not properly configured",
          provider: "mtn_momo",
        },
      };
    }

    try {
      // Get access token first
      const token = await this.getAccessToken();

      // Format phone number (handles 0881948577, 231881948577, etc.)
      const formattedPhone = this.formatPhoneNumber(params.phoneNumber);

      // Use EUR for sandbox (MTN requirement)
      const currency = this.environment === "sandbox" ? "EUR" : params.currency;

      const requestBody = {
        amount: params.amount.toFixed(2),
        currency: currency,
        externalId: params.referenceId,
        payer: {
          partyIdType: "MSISDN",
          partyId: formattedPhone,
        },
        payerMessage: params.payerMessage,
        payeeNote: params.payeeNote,
      };

      console.log("📤 [MTN MOMO] Request body:", {
        ...requestBody,
        partyId: formattedPhone,
      });

      const response = await fetch(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": params.referenceId,
            "X-Target-Environment": this.environment,
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("📥 [MTN MOMO] Response status:", response.status);

      // 202 Accepted = success
      if (response.status === 202) {
        console.log("✅ [MTN MOMO] Payment request accepted");
        return {
          success: true,
          referenceId: params.referenceId,
        };
      }

      // Handle errors
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      console.error("❌ [MTN MOMO] Request failed:", {
        status: response.status,
        error: errorData,
      });

      return {
        success: false,
        referenceId: params.referenceId,
        error: {
          code: "PAYMENT_REQUEST_FAILED",
          message: `Payment request failed: ${response.statusText}`,
          provider: "mtn_momo",
          details: { status: response.status, errorData },
        },
      };
    } catch (error: any) {
      console.error("💥 [MTN MOMO] Exception:", error);

      return {
        success: false,
        referenceId: params.referenceId,
        error: {
          code: "PAYMENT_EXCEPTION",
          message: error.message || "Payment request failed",
          provider: "mtn_momo",
          details: error,
        },
      };
    }
  }

  /**
   * Check payment status
   * Poll this to verify payment completion
   */
  async getPaymentStatus(referenceId: string): Promise<PaymentStatusResponse> {
    console.log("🔍 [MTN MOMO] Checking payment status:", referenceId);

    if (!this.isAvailable()) {
      return {
        success: false,
        status: "FAILED",
        error: {
          code: "SERVICE_NOT_AVAILABLE",
          message: "MTN MoMo service is not properly configured",
          provider: "mtn_momo",
        },
      };
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.environment,
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Status check failed: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("📥 [MTN MOMO] Transaction status:", data.status);

      return {
        success: true,
        status: data.status as "PENDING" | "SUCCESSFUL" | "FAILED",
        data,
      };
    } catch (error: any) {
      console.error("❌ [MTN MOMO] Status check failed:", error);

      return {
        success: false,
        status: "FAILED",
        error: {
          code: "STATUS_CHECK_FAILED",
          message: error.message || "Failed to check payment status",
          provider: "mtn_momo",
        },
      };
    }
  }

  /**
   * Validate account holder (optional check before payment)
   */
  async validateAccountHolder(phoneNumber: string): Promise<{
    success: boolean;
    isValid: boolean;
    error?: any;
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        isValid: false,
        error: "Service not available",
      };
    }

    try {
      const token = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(
        `${this.baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/active`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.environment,
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          isValid: data.result === true,
        };
      }

      return {
        success: true,
        isValid: false,
      };
    } catch (error) {
      console.error("Account validation error:", error);
      return {
        success: false,
        isValid: false,
        error,
      };
    }
  }
}

/**
 * Factory function
 */
export function createPaymentService(): MTNMoMoService {
  return new MTNMoMoService();
}
