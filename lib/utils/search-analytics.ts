import { createClient } from "@/lib/supabase/client";

export async function trackSearch(searchTerm: string, resultCount: number) {
  try {
    const supabase = createClient();

    // Track search in a non-blocking way
    void supabase
      .from("search_keywords")
      .upsert(
        {
          keyword: searchTerm.toLowerCase(),
          search_count: 1,
        } as any,
        {
          onConflict: "keyword",
          ignoreDuplicates: false,
        }
      )
      .then(() => {
        // Silent success
      });
  } catch (error: any) {
    // Don't block search if analytics fails
    console.error("Search analytics error:", error);
  }
}
