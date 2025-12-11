// lib/hooks/use-notification-count.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";

/**
 * Hook to fetch and subscribe to real-time notification count updates
 * Updates automatically when new notifications arrive or are marked as read
 */
export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() as any;
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    async function fetchCount() {
      try {
        const { data, error } = await (supabase as any)
      .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false) as any as { data: any; error: any };

        if (error) {
          console.error("Error fetching notification count:", error);
          setCount(0);
        } else {
          setCount(data || 0);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();

    // Set up real-time subscription for updates
    const channel = supabase
      .channel("notification-count-updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Notification change detected:", payload);
          // Refetch count on any change
          fetchCount();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { count, loading };
}
