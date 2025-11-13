// lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          user_type: "customer" | "provider" | "admin";
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type?: "customer" | "provider" | "admin";
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type?: "customer" | "provider" | "admin";
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          business_name: string | null;
          description: string | null;
          hourly_rate: number | null;
          response_time: string | null;
          subscription_tier: "free" | "pro"; // Removed "elite"
          verified: boolean;
          active: boolean;
          total_rating: number;
          review_count: number;
          // New Pro tier features
          business_hours: Json | null;
          service_area_radius: number | null;
          service_area_coordinates: string | null; // PostGIS POINT
          multiple_locations: Json | null;
          priority_response: boolean;
          facebook_ad_active: boolean;
          photo_count: number;
          category_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string | null;
          description?: string | null;
          hourly_rate?: number | null;
          response_time?: string | null;
          subscription_tier?: "free" | "pro";
          verified?: boolean;
          active?: boolean;
          total_rating?: number;
          review_count?: number;
          business_hours?: Json | null;
          service_area_radius?: number | null;
          service_area_coordinates?: string | null;
          multiple_locations?: Json | null;
          priority_response?: boolean;
          facebook_ad_active?: boolean;
          photo_count?: number;
          category_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string | null;
          description?: string | null;
          hourly_rate?: number | null;
          response_time?: string | null;
          subscription_tier?: "free" | "pro";
          verified?: boolean;
          active?: boolean;
          total_rating?: number;
          review_count?: number;
          business_hours?: Json | null;
          service_area_radius?: number | null;
          service_area_coordinates?: string | null;
          multiple_locations?: Json | null;
          priority_response?: boolean;
          facebook_ad_active?: boolean;
          photo_count?: number;
          category_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      provider_photos: {
        Row: {
          id: string;
          provider_id: string;
          photo_url: string;
          is_profile_photo: boolean;
          caption: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          photo_url: string;
          is_profile_photo?: boolean;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          photo_url?: string;
          is_profile_photo?: boolean;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      provider_services: {
        Row: {
          id: string;
          provider_id: string;
          service_category_id: string;
          custom_description: string | null;
          price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          service_category_id: string;
          custom_description?: string | null;
          price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          service_category_id?: string;
          custom_description?: string | null;
          price?: number | null;
          created_at?: string;
        };
      };
      customer_memberships: {
        Row: {
          id: string;
          customer_id: string;
          membership_type: "unlimited_monthly";
          status: "active" | "cancelled" | "expired";
          amount: number;
          starts_at: string;
          expires_at: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          membership_type?: "unlimited_monthly";
          status?: "active" | "cancelled" | "expired";
          amount?: number;
          starts_at?: string;
          expires_at?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          membership_type?: "unlimited_monthly";
          status?: "active" | "cancelled" | "expired";
          amount?: number;
          starts_at?: string;
          expires_at?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          provider_id: string;
          booking_fee: number;
          payment_method: "pay_per_booking" | "membership";
          payment_status: "pending" | "completed" | "failed";
          payment_provider: string | null;
          transaction_id: string | null;
          service_description: string | null;
          booking_date: string | null;
          booking_status: "pending" | "confirmed" | "completed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          provider_id: string;
          booking_fee?: number;
          payment_method: "pay_per_booking" | "membership";
          payment_status?: "pending" | "completed" | "failed";
          payment_provider?: string | null;
          transaction_id?: string | null;
          service_description?: string | null;
          booking_date?: string | null;
          booking_status?: "pending" | "confirmed" | "completed" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          provider_id?: string;
          booking_fee?: number;
          payment_method?: "pay_per_booking" | "membership";
          payment_status?: "pending" | "completed" | "failed";
          payment_provider?: string | null;
          transaction_id?: string | null;
          service_description?: string | null;
          booking_date?: string | null;
          booking_status?: "pending" | "confirmed" | "completed" | "cancelled";
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          provider_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          provider_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          customer_id?: string;
          provider_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      provider_subscriptions: {
        Row: {
          id: string;
          provider_id: string;
          tier: "pro"; // Removed "elite"
          status: "active" | "cancelled" | "expired";
          amount: number;
          starts_at: string;
          expires_at: string | null;
          auto_renew: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          tier: "pro";
          status?: "active" | "cancelled" | "expired";
          amount: number;
          starts_at?: string;
          expires_at?: string | null;
          auto_renew?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          tier?: "pro";
          status?: "active" | "cancelled" | "expired";
          amount?: number;
          starts_at?: string;
          expires_at?: string | null;
          auto_renew?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "booking_fee"
            | "provider_subscription"
            | "customer_membership"
            | "refund";
          amount: number;
          status: "pending" | "completed" | "failed";
          payment_method: string | null;
          external_transaction_id: string | null;
          related_booking_id: string | null;
          related_subscription_id: string | null;
          related_membership_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "booking_fee"
            | "provider_subscription"
            | "customer_membership"
            | "refund";
          amount: number;
          status?: "pending" | "completed" | "failed";
          payment_method?: string | null;
          external_transaction_id?: string | null;
          related_booking_id?: string | null;
          related_subscription_id?: string | null;
          related_membership_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "booking_fee"
            | "provider_subscription"
            | "customer_membership"
            | "refund";
          amount?: number;
          status?: "pending" | "completed" | "failed";
          payment_method?: string | null;
          external_transaction_id?: string | null;
          related_booking_id?: string | null;
          related_subscription_id?: string | null;
          related_membership_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for the application
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderInsert =
  Database["public"]["Tables"]["providers"]["Insert"];
export type ProviderUpdate =
  Database["public"]["Tables"]["providers"]["Update"];

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export type CustomerMembership =
  Database["public"]["Tables"]["customer_memberships"]["Row"];
export type CustomerMembershipInsert =
  Database["public"]["Tables"]["customer_memberships"]["Insert"];
export type CustomerMembershipUpdate =
  Database["public"]["Tables"]["customer_memberships"]["Update"];

export type ProviderSubscription =
  Database["public"]["Tables"]["provider_subscriptions"]["Row"];
export type ProviderPhoto =
  Database["public"]["Tables"]["provider_photos"]["Row"];
export type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
