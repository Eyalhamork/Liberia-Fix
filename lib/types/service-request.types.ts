// lib/types/service-request.types.ts

export type ServiceRequestStatus =
  | "pending_payment"
  | "active"
  | "filled"
  | "closed"
  | "expired";

export type BidStatus = "pending" | "selected" | "rejected" | "withdrawn";

export type BudgetType = "fixed" | "range" | "open";

export type UrgencyType = "asap" | "within-3-days" | "this-week" | "flexible";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// =====================================================
// DATABASE TYPES
// =====================================================

export interface ServiceRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: BudgetType;
  urgency: UrgencyType;
  preferred_time: string | null;
  photo_urls: string[];
  status: ServiceRequestStatus;
  payment_status: PaymentStatus;
  payment_amount: number;
  transaction_id: string | null;
  views_count: number;
  bid_count: number;
  selected_provider_count: number;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  closed_at: string | null;
  updated_at: string;
}

export interface ServiceRequestBid {
  id: string;
  request_id: string;
  provider_id: string;
  bid_amount: number;
  estimated_completion_time: string;
  message: string;
  status: BidStatus;
  viewed_by_customer: boolean;
  viewed_at: string | null;
  selected_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestView {
  request_id: string;
  provider_id: string;
  last_viewed_at: string;
  view_count: number;
}

export interface ProviderBidHistory {
  id: string;
  provider_id: string;
  year: number;
  month: number;
  bids_used: number;
  bids_limit: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// EXTENDED TYPES WITH RELATIONS
// =====================================================

export interface ServiceRequestWithCustomer extends ServiceRequest {
  customer: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
  };
}

export interface ServiceRequestWithBids extends ServiceRequest {
  bids: ServiceRequestBid[];
}

export interface BidWithProvider extends ServiceRequestBid {
  provider: {
    id: string;
    user_id: string;
    business_name: string;
    total_rating: number;
    review_count: number;
    subscription_tier: "free" | "pro";
    verified: boolean;
    profile: {
      full_name: string;
      phone: string;
      email: string;
      avatar_url: string | null;
    };
  };
}

export interface BidWithRequest extends ServiceRequestBid {
  service_request: ServiceRequestWithCustomer;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateServiceRequestRequest {
  customer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
  budget_type: BudgetType;
  urgency: UrgencyType;
  preferred_time?: string;
  photo_urls?: string[];
}

export interface CreateServiceRequestResponse {
  success: boolean;
  data?: ServiceRequest;
  error?: string;
}

export interface SubmitBidRequest {
  request_id: string;
  provider_id: string;
  bid_amount: number;
  estimated_completion_time: string;
  message: string;
}

export interface SubmitBidResponse {
  success: boolean;
  data?: ServiceRequestBid;
  error?: string;
  bids_remaining?: number;
}

export interface SelectBidRequest {
  bid_id: string;
  request_id: string;
}

export interface SelectBidResponse {
  success: boolean;
  provider_contact?: {
    full_name: string;
    phone: string;
    email: string;
  };
  error?: string;
}

export interface MarkRequestFilledRequest {
  request_id: string;
  selected_bid_ids: string[];
}

export interface MarkRequestFilledResponse {
  success: boolean;
  error?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface BidStats {
  total: number;
  pending: number;
  selected: number;
  rejected: number;
}

export interface RequestStats {
  active: number;
  pending_payment: number;
  filled: number;
  closed: number;
  expired: number;
  total_bids: number;
}

export interface ProviderBidLimit {
  used: number;
  limit: number;
  remaining: number;
  can_bid: boolean;
}

// =====================================================
// FILTER & SORT OPTIONS
// =====================================================

export type BidSortOption = "recent" | "price-low" | "price-high" | "rating";

export type RequestFilterOption = "all" | "active" | "closed";

export type BidFilterOption = "all" | "pending" | "selected" | "rejected";

// =====================================================
// BUSINESS RULES CONSTANTS
// =====================================================

export const SERVICE_REQUEST_CONSTANTS = {
  PAYMENT_AMOUNT: 5.0,
  MAX_BIDS_PER_REQUEST: 10,
  MAX_SELECTED_PROVIDERS: 2,
  REQUEST_DURATION_HOURS: 48,
  REFUND_ELIGIBILITY_HOURS: 48,
  FREE_TIER_MONTHLY_BID_LIMIT: 1,
  PRO_TIER_MONTHLY_BID_LIMIT: -1, // unlimited
  MAX_PHOTOS: 3,
} as const;

// =====================================================
// FORM VALIDATION TYPES
// =====================================================

export interface ServiceRequestFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: string;
  budget_max: string;
  budget_type: BudgetType;
  urgency: UrgencyType;
  preferred_time: string;
  photos: File[];
  use_current_location: boolean;
}

export interface BidFormData {
  bid_amount: string;
  estimated_completion_time: string;
  message: string;
}

// =====================================================
// ERROR TYPES
// =====================================================

export interface ServiceRequestError {
  code: string;
  message: string;
  field?: string;
}

export const SERVICE_REQUEST_ERRORS = {
  UNAUTHORIZED: "You must be logged in to perform this action",
  NOT_FOUND: "Service request not found",
  ALREADY_PAID: "This request has already been paid for",
  PAYMENT_FAILED: "Payment processing failed",
  BID_LIMIT_REACHED: "You've reached your monthly bid limit",
  ALREADY_BID: "You've already submitted a bid for this request",
  REQUEST_CLOSED: "This request is no longer accepting bids",
  MAX_BIDS_REACHED: "This request has reached the maximum number of bids",
  INVALID_BID_AMOUNT: "Bid amount must be a positive number",
  INVALID_SELECTION: "You can only select up to 2 providers",
  NOT_YOUR_REQUEST: "You don't have permission to access this request",
  NOT_YOUR_BID: "You don't have permission to access this bid",
} as const;
