// lib/hooks/use-providers.ts
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  response_time: string | null;
  subscription_tier: "free" | "pro" | "elite";
  verified: boolean;
  active: boolean;
  total_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    location: string | null;
    avatar_url: string | null;
  };
  provider_services?: {
    service_categories: {
      name: string;
      icon: string | null;
    };
  }[];
}

interface UseProvidersOptions {
  category?: string;
  location?: string;
  tier?: string;
  search?: string;
  limit?: number;
}

export function useProviders(options: UseProvidersOptions = {}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("providers")
        .select(
          `
          *,
          profiles:user_id (full_name, phone, location, avatar_url),
          provider_services (
            service_categories (name, icon)
          )
        `
        )
        .eq("active", true);

      // Apply filters
      if (options.tier) {
        query = query.eq("subscription_tier", options.tier);
      }

      if (options.location) {
        query = query.eq("profiles.location", options.location);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Sort by tier and rating
      query = query
        .order("subscription_tier", { ascending: false })
        .order("total_rating", { ascending: false });

      const { data, error: fetchError } = await query as { data: Provider[] | null; error: any };

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      let filteredProviders = data || [];

      // Apply search filter
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        filteredProviders = filteredProviders.filter(
          (provider: any) =>
            provider.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
            provider.business_name?.toLowerCase().includes(searchTerm) ||
            provider.description?.toLowerCase().includes(searchTerm) ||
            provider.provider_services?.some((service: any) =>
              service.service_categories.name.toLowerCase().includes(searchTerm)
            )
        );
      }

      // Apply category filter
      if (options.category && options.category !== "all") {
        filteredProviders = filteredProviders.filter((provider: any) =>
          provider.provider_services?.some((service: any) =>
            service.service_categories.name
              .toLowerCase()
              .includes(options.category!.toLowerCase())
          )
        );
      }

      setProviders(filteredProviders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [
    options.category,
    options.location,
    options.tier,
    options.search,
    options.limit,
  ]);

  const refetch = () => {
    fetchProviders();
  };

  return {
    providers,
    loading,
    error,
    refetch,
  };
}

export function useProvider(id: string) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await (supabase as any)
      .from("providers")
          .select(
            `
            *,
            profiles:user_id (full_name, phone, location, avatar_url),
            provider_services (
              service_categories (name, icon)
            ),
            reviews (rating, comment, created_at, profiles:customer_id (full_name))
          `
          )
          .eq("id", id)
          .eq("active", true)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setProvider(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProvider();
    }
  }, [id]);

  return {
    provider,
    loading,
    error,
  };
}
