// lib/types/api.ts

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionRequest {
  provider_id: string;
  payment_method: "orange_money" | "mtn_money";
  amount?: number;
}

export interface ConnectionResponse {
  id: string;
  customer_id: string;
  provider_id: string;
  amount: number;
  payment_status: "pending" | "completed" | "failed";
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  provider?: {
    business_name: string | null;
    profiles: {
      full_name: string | null;
      phone: string | null;
      email: string | null;
    };
  };
}

export interface PaymentRequest {
  type: "connection_fee" | "subscription" | "refund";
  amount: number;
  payment_method: "orange_money" | "mtn_money";
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  transaction_id: string;
  status: "pending" | "completed" | "failed";
  amount: number;
  payment_method: string;
  external_transaction_id?: string;
}

export interface ProviderFilters {
  search?: string;
  category?: string;
  location?: string;
  priceRange?: string;
  rating?: string;
  sortBy?: "recommended" | "rating" | "price-low" | "price-high" | "reviews";
  tier?: "free" | "pro" | "elite";
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  active: boolean;
  provider_count?: number;
}

export interface SubscriptionPlan {
  tier: "pro" | "elite";
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export interface AnalyticsData {
  totalUsers: number;
  totalProviders: number;
  totalConnections: number;
  monthlyRevenue: number;
  growthRate: number;
  topCategories: Array<{
    name: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "connection" | "signup" | "subscription";
    message: string;
    timestamp: string;
  }>;
}
