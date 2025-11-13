// FILE 4: lib/hooks/use-provider.ts (create this)
// ============================================
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_BANK } from "@/lib/data/service-bank";

export function useProvider(providerId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select(
          `
          id,
          user_id,
          business_name,
          description,
          hourly_rate,
          response_time,
          subscription_tier,
          promo_expires_at,
          verified,
          total_rating,
          review_count,
          profiles:user_id (
            full_name,
            phone,
            location,
            avatar_url
          ),
          provider_categories (
            service_category_id
          ),
          provider_specialties (
            service_category_id,
            specialty_id
          ),
          provider_photos (
            id,
            photo_url,
            caption,
            order_index
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            profiles:customer_id (
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("id", providerId)
        .eq("active", true)
        .limit(20, { foreignTable: "reviews" })
        .limit(20, { foreignTable: "provider_photos" })
        .single();

      if (error) throw error;
      if (!data) throw new Error("Provider not found");

      // Handle profile array
      const profileData = Array.isArray(data.profiles)
        ? data.profiles[0]
        : data.profiles;

      return { ...data, profiles: profileData };
    },
    staleTime: 5 * 60 * 1000, // Provider profiles don't change often - cache 5 mins
  });
}
