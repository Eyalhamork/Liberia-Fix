// =====================================================
// Payment System TypeScript Types
// lib/types/payment.types.ts
// =====================================================

export type PaymentProvider = "mtn_momo" | "orange_money";

export type TransactionType =
  | "booking_fee" // $3 pay-per-contact
  | "provider_subscription" // $20/month Pro subscription
  | "refund"
  | "payout";

export type TransactionStatus =
  | "initiated" // Payment request created
  | "pending" // Waiting for user action
  | "processing" // Being processed by provider
  | "completed" // Successfully completed
  | "failed" // Failed
  | "cancelled" // Cancelled by user
  | "expired" // Payment window expired
  | "refunded"; // Refunded

export type Currency = "USD" | "LRD";

export type BillingStatus =
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "waived"
  | "refunded";

export type CancellationType =
  | "voluntary"
  | "payment_failed"
  | "admin"
  | "fraud";

// =====================================================
// DATABASE TYPES
// =====================================================

export interface PaymentMethod {
  id: string;
  provider_name: PaymentProvider;
  display_name: string;
  is_active: boolean;
  api_base_url?: string;
  api_version?: string;
  supports_subscriptions: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  reference_id: string;
  external_transaction_id?: string;
  user_id?: string;
  related_booking_id?: string;
  related_subscription_id?: string;
  transaction_type: TransactionType;
  payment_method_id?: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  payer_phone?: string;
  payer_name?: string;
  payment_token?: string;
  initiated_at: string;
  completed_at?: string;
  expires_at?: string;
  provider_response?: Record<string, any>;
  error_message?: string;
  error_code?: string;
  retry_count: number;
  webhook_received_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionBillingHistory {
  id: string;
  subscription_id: string;
  transaction_id?: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  amount: number;
  status: BillingStatus;
  attempts: number;
  next_retry_at?: string;
  last_error?: string;
  billed_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWebhook {
  id: string;
  provider: PaymentProvider;
  webhook_id?: string;
  event_type?: string;
  transaction_id?: string;
  reference_id?: string;
  payload: Record<string, any>;
  headers?: Record<string, any>;
  processed: boolean;
  processed_at?: string;
  processing_error?: string;
  signature?: string;
  signature_verified?: boolean;
  ip_address?: string;
  created_at: string;
}

export interface SubscriptionCancellation {
  id: string;
  subscription_id: string;
  provider_id: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancellation_type: CancellationType;
  cancelled_at: string;
  effective_until?: string;
  feedback?: string;
  willing_to_return?: boolean;
  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Initiate Payment Request
export interface InitiatePaymentRequest {
  userId: string;
  amount: number;
  currency: Currency;
  transactionType: TransactionType;
  paymentProvider: PaymentProvider;
  payerPhone: string;
  payerName?: string;
  relatedBookingId?: string;
  relatedSubscriptionId?: string;
  metadata?: Record<string, any>;
}

export interface InitiatePaymentResponse {
  success: boolean;
  transactionId: string;
  referenceId: string;
  paymentUrl?: string; // For redirect-based flows
  paymentToken?: string;
  expiresAt: string;
  message?: string;
  error?: string;
}

// Check Payment Status Request
export interface CheckPaymentStatusRequest {
  referenceId: string;
}

export interface CheckPaymentStatusResponse {
  success: boolean;
  status: TransactionStatus;
  transaction: PaymentTransaction;
  message?: string;
  error?: string;
}

// Process Subscription Billing Request
export interface ProcessSubscriptionBillingRequest {
  subscriptionId: string;
  providerId: string;
  amount: number;
  billingCycleStart: string;
  billingCycleEnd: string;
}

export interface ProcessSubscriptionBillingResponse {
  success: boolean;
  billingHistoryId: string;
  transactionId?: string;
  status: BillingStatus;
  message?: string;
  error?: string;
}

// =====================================================
// MTN MOMO SPECIFIC TYPES
// =====================================================

export interface MTNMoMoCredentials {
  apiUser: string;
  apiKey: string;
  subscriptionKey: string;
  environment: "sandbox" | "production";
  baseUrl: string;
}

export interface MTNMoMoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MTNMoMoPaymentRequest {
  amount: string;
  currency: Currency;
  externalId: string; // Our reference_id
  payer: {
    partyIdType: "MSISDN";
    partyId: string; // Phone number
  };
  payerMessage: string;
  payeeNote: string;
}

export interface MTNMoMoPaymentResponse {
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  financialTransactionId?: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
  reason?: {
    code: string;
    message: string;
  };
}

export interface MTNMoMoWebhookPayload {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  status: "SUCCESSFUL" | "FAILED";
  reason?: {
    code: string;
    message: string;
  };
}

// =====================================================
// ORANGE MONEY SPECIFIC TYPES (for future use)
// =====================================================

export interface OrangeMoneyCredentials {
  merchantId: string;
  apiKey: string;
  environment: "sandbox" | "production";
  baseUrl: string;
}

export interface OrangeMoneyPaymentRequest {
  amount: number;
  currency: Currency;
  reference: string;
  customerMsisdn: string;
  description: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  credentials: MTNMoMoCredentials | OrangeMoneyCredentials;
  webhookSecret: string;
}

export interface PaymentError {
  code: string;
  message: string;
  provider?: PaymentProvider;
  details?: any;
}

export interface SubscriptionBillingJob {
  subscriptionId: string;
  providerId: string;
  amount: number;
  dueDate: string;
  retryAttempt: number;
}

// =====================================================
// HELPER TYPES FOR FRONTEND
// =====================================================

export interface PaymentMethodOption {
  id: string;
  name: string;
  provider: PaymentProvider;
  logo: string;
  isActive: boolean;
  description?: string;
}

export interface PaymentSummary {
  amount: number;
  currency: Currency;
  description: string;
  provider: PaymentProvider;
  phone: string;
}

export interface TransactionHistory {
  transaction: PaymentTransaction;
  paymentMethod?: PaymentMethod;
  relatedBooking?: any;
  relatedSubscription?: any;
}

// =====================================================
// CONSTANTS
// =====================================================

export const PAYMENT_AMOUNTS = {
  BOOKING_FEE: 3.0,
  PRO_SUBSCRIPTION_MONTHLY: 20.0,
} as const;

export const PAYMENT_EXPIRY_MINUTES = 30; // Payment expires after 30 minutes

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MINUTES: 5,
  BACKOFF_MULTIPLIER: 2,
} as const;

export const SUBSCRIPTION_BILLING_CONFIG = {
  ADVANCE_BILLING_DAYS: 3, // Bill 3 days before expiry
  GRACE_PERIOD_DAYS: 3, // Grace period after expiry
  MAX_RETRY_ATTEMPTS: 3,
} as const;
