// lib/types/database.ts
// Generated from actual Supabase schema

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
      admin_activity_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          details?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      booking_notifications: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          type: string;
          title: string;
          message: string;
          read: boolean | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          booking_id?: string | null;
          type: string;
          title: string;
          message: string;
          read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          booking_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string | null;
          provider_id: string | null;
          booking_fee: number | null;
          payment_method: string | null;
          payment_status: string | null;
          payment_provider: string | null;
          transaction_id: string | null;
          service_description: string | null;
          booking_date: string | null;
          booking_status: string | null;
          created_at: string | null;
          paid_with_wallet: boolean | null;
          wallet_transaction_id: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          provider_id?: string | null;
          booking_fee?: number | null;
          payment_method?: string | null;
          payment_status?: string | null;
          payment_provider?: string | null;
          transaction_id?: string | null;
          service_description?: string | null;
          booking_date?: string | null;
          booking_status?: string | null;
          created_at?: string | null;
          paid_with_wallet?: boolean | null;
          wallet_transaction_id?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          provider_id?: string | null;
          booking_fee?: number | null;
          payment_method?: string | null;
          payment_status?: string | null;
          payment_provider?: string | null;
          transaction_id?: string | null;
          service_description?: string | null;
          booking_date?: string | null;
          booking_status?: string | null;
          created_at?: string | null;
          paid_with_wallet?: boolean | null;
          wallet_transaction_id?: string | null;
        };
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          description: string | null;
          status: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          action_taken: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          description?: string | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          content_type?: string;
          content_id?: string;
          reason?: string;
          description?: string | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      custom_request_views: {
        Row: {
          id: string;
          service_request_id: string;
          provider_id: string;
          subscription_tier_at_view: string;
          viewed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          service_request_id: string;
          provider_id: string;
          subscription_tier_at_view: string;
          viewed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          service_request_id?: string;
          provider_id?: string;
          subscription_tier_at_view?: string;
          viewed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      customer_memberships: {
        Row: {
          id: string;
          customer_id: string | null;
          membership_type: string | null;
          status: string | null;
          amount: number | null;
          starts_at: string | null;
          expires_at: string | null;
          auto_renew: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          membership_type?: string | null;
          status?: string | null;
          amount?: number | null;
          starts_at?: string | null;
          expires_at?: string | null;
          auto_renew?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          membership_type?: string | null;
          status?: string | null;
          amount?: number | null;
          starts_at?: string | null;
          expires_at?: string | null;
          auto_renew?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      fraud_alerts: {
        Row: {
          id: string;
          user_id: string;
          fraud_type: string;
          severity: string;
          evidence: Json | null;
          auto_blocked: boolean | null;
          status: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          action_taken: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          fraud_type: string;
          severity: string;
          evidence?: Json | null;
          auto_blocked?: boolean | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          fraud_type?: string;
          severity?: string;
          evidence?: Json | null;
          auto_blocked?: boolean | null;
          status?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          booking_id: string | null;
          service_request_id: string | null;
          message: string;
          read: boolean | null;
          created_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          booking_id?: string | null;
          service_request_id?: string | null;
          message: string;
          read?: boolean | null;
          created_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          booking_id?: string | null;
          service_request_id?: string | null;
          message?: string;
          read?: boolean | null;
          created_at?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          notification_id: string | null;
          user_id: string;
          channel: string;
          status: string;
          error_message: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          notification_id?: string | null;
          user_id: string;
          channel: string;
          status: string;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          notification_id?: string | null;
          user_id?: string;
          channel?: string;
          status?: string;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean | null;
          email_enabled: boolean | null;
          sms_enabled: boolean | null;
          quiet_hours_enabled: boolean | null;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          push_enabled?: boolean | null;
          email_enabled?: boolean | null;
          sms_enabled?: boolean | null;
          quiet_hours_enabled?: boolean | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          push_enabled?: boolean | null;
          email_enabled?: boolean | null;
          sms_enabled?: boolean | null;
          quiet_hours_enabled?: boolean | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          read: boolean | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          user_type: string | null;
          location: string | null;
          created_at: string | null;
          updated_at: string | null;
          onboarding_completed: boolean | null;
          is_admin: boolean | null;
          blocked_reason: string | null;
          blocked_at: string | null;
          wallet_balance: number | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type?: string | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          onboarding_completed?: boolean | null;
          is_admin?: boolean | null;
          blocked_reason?: string | null;
          blocked_at?: string | null;
          wallet_balance?: number | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_type?: string | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          onboarding_completed?: boolean | null;
          is_admin?: boolean | null;
          blocked_reason?: string | null;
          blocked_at?: string | null;
          wallet_balance?: number | null;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          user_id: string | null;
          business_name: string | null;
          description: string | null;
          hourly_rate: number | null;
          response_time: string | null;
          subscription_tier: string | null;
          verified: boolean | null;
          active: boolean | null;
          total_rating: number | null;
          review_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          business_hours: Json | null;
          service_area_radius: number | null;
          service_area_coordinates: string | null;
          multiple_locations: Json | null;
          priority_response: boolean | null;
          facebook_ad_active: boolean | null;
          photo_count: number | null;
          category_count: number | null;
          free_bids_used_this_month: number | null;
          free_bids_reset_at: string | null;
          promo_expires_at: string | null;
          id_verification_status: string | null;
          id_submitted_at: string | null;
          id_verified_at: string | null;
          national_id_front_url: string | null;
          national_id_back_url: string | null;
          original_tier: string | null;
          verification_status: string | null;
          verification_submitted_at: string | null;
          profile_views: number | null;
          last_upgrade_prompt: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          business_name?: string | null;
          description?: string | null;
          hourly_rate?: number | null;
          response_time?: string | null;
          subscription_tier?: string | null;
          verified?: boolean | null;
          active?: boolean | null;
          total_rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          business_hours?: Json | null;
          service_area_radius?: number | null;
          service_area_coordinates?: string | null;
          multiple_locations?: Json | null;
          priority_response?: boolean | null;
          facebook_ad_active?: boolean | null;
          photo_count?: number | null;
          category_count?: number | null;
          free_bids_used_this_month?: number | null;
          free_bids_reset_at?: string | null;
          promo_expires_at?: string | null;
          id_verification_status?: string | null;
          id_submitted_at?: string | null;
          id_verified_at?: string | null;
          national_id_front_url?: string | null;
          national_id_back_url?: string | null;
          original_tier?: string | null;
          verification_status?: string | null;
          verification_submitted_at?: string | null;
          profile_views?: number | null;
          last_upgrade_prompt?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          business_name?: string | null;
          description?: string | null;
          hourly_rate?: number | null;
          response_time?: string | null;
          subscription_tier?: string | null;
          verified?: boolean | null;
          active?: boolean | null;
          total_rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          business_hours?: Json | null;
          service_area_radius?: number | null;
          service_area_coordinates?: string | null;
          multiple_locations?: Json | null;
          priority_response?: boolean | null;
          facebook_ad_active?: boolean | null;
          photo_count?: number | null;
          category_count?: number | null;
          free_bids_used_this_month?: number | null;
          free_bids_reset_at?: string | null;
          promo_expires_at?: string | null;
          id_verification_status?: string | null;
          id_submitted_at?: string | null;
          id_verified_at?: string | null;
          national_id_front_url?: string | null;
          national_id_back_url?: string | null;
          original_tier?: string | null;
          verification_status?: string | null;
          verification_submitted_at?: string | null;
          profile_views?: number | null;
          last_upgrade_prompt?: string | null;
        };
        Relationships: [];
      };
      provider_photos: {
        Row: {
          id: string;
          provider_id: string;
          photo_url: string;
          is_profile_photo: boolean;
          caption: string | null;
          order_index: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          photo_url: string;
          is_profile_photo?: boolean;
          caption?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          photo_url?: string;
          is_profile_photo?: boolean;
          caption?: string | null;
          order_index?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      provider_services: {
        Row: {
          id: string;
          provider_id: string;
          service_category_id: string;
          custom_description: string | null;
          price: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          service_category_id: string;
          custom_description?: string | null;
          price?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          service_category_id?: string;
          custom_description?: string | null;
          price?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      provider_subscriptions: {
        Row: {
          id: string;
          provider_id: string | null;
          tier: string;
          status: string | null;
          amount: number;
          starts_at: string | null;
          expires_at: string | null;
          created_at: string | null;
          auto_renew: boolean | null;
        };
        Insert: {
          id?: string;
          provider_id?: string | null;
          tier: string;
          status?: string | null;
          amount: number;
          starts_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
          auto_renew?: boolean | null;
        };
        Update: {
          id?: string;
          provider_id?: string | null;
          tier?: string;
          status?: string | null;
          amount?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
          auto_renew?: boolean | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string | null;
          customer_id: string | null;
          provider_id: string | null;
          rating: number | null;
          comment: string | null;
          created_at: string | null;
          status: string | null;
          flagged_reason: string | null;
          helpful_count: number | null;
          updated_at: string | null;
          provider_response: string | null;
          responded_at: string | null;
          punctuality_rating: number | null;
          quality_rating: number | null;
          professionalism_rating: number | null;
          value_rating: number | null;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          customer_id?: string | null;
          provider_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
          status?: string | null;
          flagged_reason?: string | null;
          helpful_count?: number | null;
          updated_at?: string | null;
          provider_response?: string | null;
          responded_at?: string | null;
          punctuality_rating?: number | null;
          quality_rating?: number | null;
          professionalism_rating?: number | null;
          value_rating?: number | null;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          customer_id?: string | null;
          provider_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          created_at?: string | null;
          status?: string | null;
          flagged_reason?: string | null;
          helpful_count?: number | null;
          updated_at?: string | null;
          provider_response?: string | null;
          responded_at?: string | null;
          punctuality_rating?: number | null;
          quality_rating?: number | null;
          professionalism_rating?: number | null;
          value_rating?: number | null;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          active: boolean | null;
          created_at: string | null;
          domain: string | null;
          search_keywords: string | null;
          monthly_searches: number | null;
          display_order: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          domain?: string | null;
          search_keywords?: string | null;
          monthly_searches?: number | null;
          display_order?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          domain?: string | null;
          search_keywords?: string | null;
          monthly_searches?: number | null;
          display_order?: number | null;
        };
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          description: string;
          location: string;
          budget_min: number | null;
          budget_max: number | null;
          budget_type: string | null;
          urgency: string;
          preferred_time: string | null;
          photo_urls: string[] | null;
          status: string | null;
          payment_status: string | null;
          payment_amount: number | null;
          transaction_id: string | null;
          views_count: number | null;
          bid_count: number | null;
          selected_provider_count: number | null;
          created_at: string | null;
          activated_at: string | null;
          expires_at: string | null;
          closed_at: string | null;
          updated_at: string | null;
          paid_at: string | null;
          bids_count: number | null;
          service_category_id: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          title: string;
          description: string;
          location: string;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_type?: string | null;
          urgency: string;
          preferred_time?: string | null;
          photo_urls?: string[] | null;
          status?: string | null;
          payment_status?: string | null;
          payment_amount?: number | null;
          transaction_id?: string | null;
          views_count?: number | null;
          bid_count?: number | null;
          selected_provider_count?: number | null;
          created_at?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          closed_at?: string | null;
          updated_at?: string | null;
          paid_at?: string | null;
          bids_count?: number | null;
          service_category_id?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          title?: string;
          description?: string;
          location?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_type?: string | null;
          urgency?: string;
          preferred_time?: string | null;
          photo_urls?: string[] | null;
          status?: string | null;
          payment_status?: string | null;
          payment_amount?: number | null;
          transaction_id?: string | null;
          views_count?: number | null;
          bid_count?: number | null;
          selected_provider_count?: number | null;
          created_at?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          closed_at?: string | null;
          updated_at?: string | null;
          paid_at?: string | null;
          bids_count?: number | null;
          service_category_id?: string | null;
        };
        Relationships: [];
      };
      service_request_bids: {
        Row: {
          id: string;
          request_id: string;
          provider_id: string;
          amount: number;
          estimated_completion_time: string | null;
          message: string;
          status: string | null;
          viewed_by_customer: boolean | null;
          viewed_at: string | null;
          selected_at: string | null;
          rejected_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          availability: string | null;
          estimated_duration: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          provider_id: string;
          amount: number;
          estimated_completion_time?: string | null;
          message: string;
          status?: string | null;
          viewed_by_customer?: boolean | null;
          viewed_at?: string | null;
          selected_at?: string | null;
          rejected_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          availability?: string | null;
          estimated_duration?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          provider_id?: string;
          amount?: number;
          estimated_completion_time?: string | null;
          message?: string;
          status?: string | null;
          viewed_by_customer?: boolean | null;
          viewed_at?: string | null;
          selected_at?: string | null;
          rejected_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          availability?: string | null;
          estimated_duration?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          amount: number;
          status: string | null;
          payment_method: string | null;
          external_transaction_id: string | null;
          metadata: Json | null;
          created_at: string | null;
          related_booking_id: string | null;
          related_subscription_id: string | null;
          related_membership_id: string | null;
          related_service_request_id: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          amount: number;
          status?: string | null;
          payment_method?: string | null;
          external_transaction_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          related_booking_id?: string | null;
          related_subscription_id?: string | null;
          related_membership_id?: string | null;
          related_service_request_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          amount?: number;
          status?: string | null;
          payment_method?: string | null;
          external_transaction_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          related_booking_id?: string | null;
          related_subscription_id?: string | null;
          related_membership_id?: string | null;
          related_service_request_id?: string | null;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          id: string;
          booking_id: string;
          complainant_id: string;
          respondent_id: string;
          reason: string;
          description: string;
          status: string;
          resolution: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          complainant_id: string;
          respondent_id: string;
          reason: string;
          description: string;
          status?: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          complainant_id?: string;
          respondent_id?: string;
          reason?: string;
          description?: string;
          status?: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_number: string | null;
          document_url: string | null;
          selfie_url: string | null;
          status: string;
          rejection_reason: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          document_number?: string | null;
          document_url?: string | null;
          selfie_url?: string | null;
          status?: string;
          rejection_reason?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_number?: string | null;
          document_url?: string | null;
          selfie_url?: string | null;
          status?: string;
          rejection_reason?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          credits_amount: number;
          balance_before: number;
          balance_after: number;
          description: string | null;
          reference_id: string | null;
          payment_transaction_id: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          credits_amount: number;
          balance_before: number;
          balance_after: number;
          description?: string | null;
          reference_id?: string | null;
          payment_transaction_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          credits_amount?: number;
          balance_before?: number;
          balance_after?: number;
          description?: string | null;
          reference_id?: string | null;
          payment_transaction_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      promotional_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: string;
          discount_value: number;
          max_uses: number | null;
          current_uses: number;
          expires_at: string | null;
          active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: string;
          discount_value: number;
          max_uses?: number | null;
          current_uses?: number;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: string;
          discount_value?: number;
          max_uses?: number | null;
          current_uses?: number;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_revenue_summary: {
        Row: {
          date: string | null;
          transaction_count: number | null;
          booking_revenue: number | null;
          subscription_revenue: number | null;
          total_revenue: number | null;
        };
      };
    };
    Functions: {
      increment_request_views: {
        Args: { request_id: string };
        Returns: void;
      };
      increment_provider_bid_count: {
        Args: { provider_id: string };
        Returns: void;
      };
      increment_bid_count: {
        Args: { request_id: string };
        Returns: void;
      };
      add_wallet_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_credits: number;
          p_description: string;
          p_reference_id?: string;
          p_type?: string;
          p_payment_transaction_id?: string;
          p_metadata?: Record<string, unknown>;
        };
        Returns: string;
      };
      deduct_wallet_credits: {
        Args: {
          p_user_id: string;
          p_credits: number;
          p_description: string;
          p_reference_id?: string;
        };
        Returns: string;
      };
      approve_verification: {
        Args: {
          p_verification_id: string;
          p_admin_id: string;
        };
        Returns: boolean;
      };
      reject_verification: {
        Args: {
          p_verification_id: string;
          p_admin_id: string;
          p_reason: string;
          p_notes?: string | null;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for the application
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderInsert = Database["public"]["Tables"]["providers"]["Insert"];
export type ProviderUpdate = Database["public"]["Tables"]["providers"]["Update"];

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export type CustomerMembership = Database["public"]["Tables"]["customer_memberships"]["Row"];
export type CustomerMembershipInsert = Database["public"]["Tables"]["customer_memberships"]["Insert"];
export type CustomerMembershipUpdate = Database["public"]["Tables"]["customer_memberships"]["Update"];

export type ProviderSubscription = Database["public"]["Tables"]["provider_subscriptions"]["Row"];
export type ProviderPhoto = Database["public"]["Tables"]["provider_photos"]["Row"];
export type ServiceCategory = Database["public"]["Tables"]["service_categories"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type ServiceRequestInsert = Database["public"]["Tables"]["service_requests"]["Insert"];
export type ServiceRequestUpdate = Database["public"]["Tables"]["service_requests"]["Update"];

// Note: service_request_responses doesn't exist in schema, using service_request_bids instead
export type ServiceRequestResponse = Database["public"]["Tables"]["service_request_bids"]["Row"];
export type ServiceRequestBid = Database["public"]["Tables"]["service_request_bids"]["Row"];
export type ServiceRequestBidInsert = Database["public"]["Tables"]["service_request_bids"]["Insert"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type BookingNotification = Database["public"]["Tables"]["booking_notifications"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Dispute = Database["public"]["Tables"]["disputes"]["Row"];
export type VerificationRequest = Database["public"]["Tables"]["verification_requests"]["Row"];
export type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];
export type UserWallet = Database["public"]["Tables"]["user_wallets"]["Row"];
export type AdminActivityLog = Database["public"]["Tables"]["admin_activity_log"]["Row"];
export type ContentReport = Database["public"]["Tables"]["content_reports"]["Row"];
export type FraudAlert = Database["public"]["Tables"]["fraud_alerts"]["Row"];
export type NotificationPreference = Database["public"]["Tables"]["notification_preferences"]["Row"];
export type PushSubscription = Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type PromotionalCode = Database["public"]["Tables"]["promotional_codes"]["Row"];
