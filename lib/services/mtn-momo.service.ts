// =====================================================
// MTN MoMo Payment Service
// lib/services/mtn-momo.service.ts
// =====================================================

import {
  MTNMoMoCredentials,
  MTNMoMoTokenResponse,
  MTNMoMoPaymentRequest,
  MTNMoMoPaymentResponse,
  Currency,
  PaymentError,
} from "@/lib/types/payment.types";

export class MTNMoMoService {
  private credentials: MTNMoMoCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials: MTNMoMoCredentials) {
    this.credentials = credentials;
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  /**
   * Get OAuth access token from MTN MoMo API
   * Tokens are cached until expiry
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const authString = Buffer.from(
        `${this.credentials.apiUser}:${this.credentials.apiKey}`
      ).toString("base64");

      const response = await fetch(
        `${this.credentials.baseUrl}/collection/token/`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            "Ocp-Apim-Subscription-Key": this.credentials.subscriptionKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw this.createError(
          "AUTH_FAILED",
          `Failed to get access token: ${errorText}`,
          { status: response.status }
        );
      }

      const data: MTNMoMoTokenResponse = await response.json();

      // Cache token (expires_in is in seconds)
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // 60s buffer

      return this.accessToken;
    } catch (error) {
      console.error("MTN MoMo authentication error:", error);
      throw error;
    }
  }

  // =====================================================
  // PAYMENT OPERATIONS
  // =====================================================

  /**
   * Request payment from customer (Collection)
   * This is the main method for receiving payments
   */
  async requestPayment(params: {
    amount: number;
    currency: Currency;
    referenceId: string;
    phoneNumber: string;
    payerMessage: string;
    payeeNote: string;
  }): Promise<{ success: boolean; referenceId: string; error?: PaymentError }> {
    try {
      const token = await this.getAccessToken();

      // Format phone number (remove spaces, ensure correct format)
      const formattedPhone = this.formatPhoneNumber(params.phoneNumber);

      const paymentRequest: MTNMoMoPaymentRequest = {
        amount: params.amount.toFixed(2),
        currency: params.currency,
        externalId: params.referenceId,
        payer: {
          partyIdType: "MSISDN",
          partyId: formattedPhone,
        },
        payerMessage: params.payerMessage,
        payeeNote: params.payeeNote,
      };

      const response = await fetch(
        `${this.credentials.baseUrl}/collection/v1_0/requesttopay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": params.referenceId,
            "X-Target-Environment": this.credentials.environment,
            "Ocp-Apim-Subscription-Key": this.credentials.subscriptionKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentRequest),
        }
      );

      // 202 Accepted means request was received
      if (response.status === 202) {
        return {
          success: true,
          referenceId: params.referenceId,
        };
      }

      // Handle errors
      const errorData = await response.json().catch(() => ({}));
      throw this.createError(
        "PAYMENT_REQUEST_FAILED",
        `Payment request failed: ${response.statusText}`,
        { status: response.status, errorData }
      );
    } catch (error) {
      console.error("MTN MoMo payment request error:", error);

      if (error instanceof Error && "code" in error) {
        return {
          success: false,
          referenceId: params.referenceId,
          error: error as PaymentError,
        };
      }

      return {
        success: false,
        referenceId: params.referenceId,
        error: this.createError(
          "UNKNOWN_ERROR",
          "An unexpected error occurred"
        ),
      };
    }
  }

  /**
   * Check payment status
   * Poll this endpoint to verify payment completion
   */
  async getPaymentStatus(referenceId: string): Promise<{
    success: boolean;
    status: "PENDING" | "SUCCESSFUL" | "FAILED";
    data?: MTNMoMoPaymentResponse;
    error?: PaymentError;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.credentials.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.credentials.environment,
            "Ocp-Apim-Subscription-Key": this.credentials.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw this.createError(
          "STATUS_CHECK_FAILED",
          `Failed to check payment status: ${errorText}`,
          { status: response.status }
        );
      }

      const data: MTNMoMoPaymentResponse = await response.json();

      return {
        success: true,
        status: data.status,
        data,
      };
    } catch (error) {
      console.error("MTN MoMo status check error:", error);

      if (error instanceof Error && "code" in error) {
        return {
          success: false,
          status: "FAILED",
          error: error as PaymentError,
        };
      }

      return {
        success: false,
        status: "FAILED",
        error: this.createError(
          "UNKNOWN_ERROR",
          "An unexpected error occurred"
        ),
      };
    }
  }

  /**
   * Validate account holder (optional check before payment)
   * Verifies if the phone number is a valid MTN MoMo account
   */
  async validateAccountHolder(phoneNumber: string): Promise<{
    success: boolean;
    isValid: boolean;
    accountHolderName?: string;
    error?: PaymentError;
  }> {
    try {
      const token = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(
        `${this.credentials.baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/active`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.credentials.environment,
            "Ocp-Apim-Subscription-Key": this.credentials.subscriptionKey,
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          isValid: data.result === true,
          accountHolderName: data.name,
        };
      }

      return {
        success: true,
        isValid: false,
      };
    } catch (error) {
      console.error("MTN MoMo account validation error:", error);

      // Don't fail the whole flow if validation fails
      return {
        success: false,
        isValid: false,
        error: this.createError(
          "VALIDATION_FAILED",
          "Account validation failed"
        ),
      };
    }
  }

  /**
   * Get account balance (for merchant account)
   * Useful for monitoring and reconciliation
   */
  async getAccountBalance(): Promise<{
    success: boolean;
    availableBalance?: number;
    currency?: string;
    error?: PaymentError;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.credentials.baseUrl}/collection/v1_0/account/balance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.credentials.environment,
            "Ocp-Apim-Subscription-Key": this.credentials.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        throw this.createError(
          "BALANCE_CHECK_FAILED",
          "Failed to retrieve account balance",
          { status: response.status }
        );
      }

      const data = await response.json();

      return {
        success: true,
        availableBalance: parseFloat(data.availableBalance),
        currency: data.currency,
      };
    } catch (error) {
      console.error("MTN MoMo balance check error:", error);

      if (error instanceof Error && "code" in error) {
        return {
          success: false,
          error: error as PaymentError,
        };
      }

      return {
        success: false,
        error: this.createError(
          "UNKNOWN_ERROR",
          "An unexpected error occurred"
        ),
      };
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Format phone number for MTN MoMo
   * Expected format: Country code + number (e.g., 231770123456)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // If number starts with 0, replace with country code (231 for Liberia)
    if (cleaned.startsWith("0")) {
      cleaned = "231" + cleaned.slice(1);
    }

    // If number doesn't start with country code, add it
    if (!cleaned.startsWith("231")) {
      cleaned = "231" + cleaned;
    }

    return cleaned;
  }

  /**
   * Create standardized error object
   */
  private createError(
    code: string,
    message: string,
    details?: any
  ): PaymentError {
    return {
      code,
      message,
      provider: "mtn_momo",
      details,
    };
  }

  /**
   * Validate webhook signature (for webhook endpoint security)
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // MTN MoMo uses HMAC SHA256 for webhook signatures
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      return signature === expectedSignature;
    } catch (error) {
      console.error("Webhook signature validation error:", error);
      return false;
    }
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

/**
 * Create MTN MoMo service instance with credentials from environment
 */
export function createMTNMoMoService(): MTNMoMoService {
  const credentials: MTNMoMoCredentials = {
    apiUser: process.env.MTN_MOMO_API_USER || "",
    apiKey: process.env.MTN_MOMO_API_KEY || "",
    subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY || "",
    environment:
      (process.env.MTN_MOMO_ENVIRONMENT as "sandbox" | "production") ||
      "sandbox",
    baseUrl:
      process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com",
  };

  // Validate required credentials
  if (
    !credentials.apiUser ||
    !credentials.apiKey ||
    !credentials.subscriptionKey
  ) {
    throw new Error(
      "MTN MoMo credentials are not configured. Check environment variables."
    );
  }

  return new MTNMoMoService(credentials);
}

// =====================================================
// USAGE EXAMPLE
// =====================================================

/*
// Initialize service
const mtnService = createMTNMoMoService();

// Request payment
const paymentResult = await mtnService.requestPayment({
  amount: 3.00,
  currency: 'USD',
  referenceId: 'unique-ref-123',
  phoneNumber: '0770123456',
  payerMessage: 'Payment for booking #123',
  payeeNote: 'LiberiaFix booking fee',
});

// Check payment status
const statusResult = await mtnService.getPaymentStatus('unique-ref-123');

if (statusResult.status === 'SUCCESSFUL') {
  console.log('Payment completed!');
}
*/
