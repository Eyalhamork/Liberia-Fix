"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { requestNotificationPermission } from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/client";

export function PushNotificationInitializer() {
  const { user } = useAuth();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const attemptAutoSubscribe = async () => {
      if (!user || hasAttempted) return;

      // Only attempt once per session
      setHasAttempted(true);

      // Check if notifications are supported
      if (!("Notification" in window)) {
        console.log("[PushInit] Notifications not supported");
        return;
      }

      // Check if user has already made a decision
      const permission = Notification.permission;

      if (permission === "denied") {
        console.log("[PushInit] User has blocked notifications");
        return;
      }

      if (permission === "granted") {
        console.log("[PushInit] Permission already granted, subscribing...");
        await requestNotificationPermission(user.id);
        return;
      }

      // Check if user has an active subscription already
      const supabase = createClient();
      const { data: existingSubscription } = await supabase
        .from("notification_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (existingSubscription) {
        console.log("[PushInit] User already has active subscription");
        return;
      }

      // Check if we've already prompted this user in localStorage
      const promptKey = `notification_prompted_${user.id}`;
      const hasBeenPrompted = localStorage.getItem(promptKey);

      if (hasBeenPrompted === "true") {
        console.log("[PushInit] User has already been prompted");
        return;
      }

      // Wait a bit before prompting (better UX - let user see the app first)
      setTimeout(async () => {
        console.log("[PushInit] Requesting notification permission...");

        // Mark as prompted before requesting to avoid multiple prompts
        localStorage.setItem(promptKey, "true");

        const success = await requestNotificationPermission(user.id);

        if (success) {
          console.log("[PushInit] ✅ Notifications enabled successfully");
        } else {
          console.log("[PushInit] ❌ User declined or error occurred");
        }
      }, 3000); // Wait 3 seconds after login
    };

    attemptAutoSubscribe();
  }, [user, hasAttempted]);

  return null;
}
