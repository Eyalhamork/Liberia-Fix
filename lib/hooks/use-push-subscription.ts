// lib/hooks/use-push-subscription.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      console.log("[usePushSubscription] Support check:", {
        window: typeof window !== "undefined",
        serviceWorker: "serviceWorker" in navigator,
        pushManager: "PushManager" in window,
        notification: "Notification" in window,
        supported,
      });

      setIsSupported(supported);
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) {
        console.log(
          "[usePushSubscription] Skipping subscription check - not supported"
        );
        return;
      }

      try {
        console.log("[usePushSubscription] Checking existing subscription...");
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();

        console.log(
          "[usePushSubscription] Existing subscription:",
          existingSubscription ? "Found" : "None"
        );

        setSubscription(existingSubscription);
        setIsSubscribed(!!existingSubscription);
      } catch (err) {
        console.error(
          "[usePushSubscription] Error checking subscription:",
          err
        );
      }
    };

    if (isSupported) {
      checkSubscription();
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    console.log(
      "[usePushSubscription] ========== SUBSCRIBE STARTED =========="
    );

    if (!isSupported) {
      const msg = "Push notifications are not supported";
      console.error("[usePushSubscription]", msg);
      setError(msg);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check if already subscribed
      console.log(
        "[usePushSubscription] Step 1: Checking existing subscription..."
      );
      if (isSubscribed && subscription) {
        console.log("[usePushSubscription] Already subscribed, skipping");
        setIsLoading(false);
        return true;
      }

      // Step 2: Check current permission
      console.log(
        "[usePushSubscription] Step 2: Current permission:",
        Notification.permission
      );

      // Step 3: Request permission
      console.log("[usePushSubscription] Step 3: Requesting permission...");
      const permission = await Notification.requestPermission();
      console.log("[usePushSubscription] Permission result:", permission);

      if (permission !== "granted") {
        const msg = `Notification permission ${permission}`;
        console.error("[usePushSubscription]", msg);
        setError(msg);
        setIsLoading(false);
        return false;
      }

      // Step 4: Wait for service worker (registered by next-pwa)
      console.log(
        "[usePushSubscription] Step 4: Waiting for service worker..."
      );
      const registration = await navigator.serviceWorker.ready;
      console.log(
        "[usePushSubscription] Service worker ready:",
        !!registration
      );

      if (!registration) {
        const msg = "Service worker not available";
        console.error("[usePushSubscription]", msg);
        setError(msg);
        setIsLoading(false);
        return false;
      }

      // Step 5: Get VAPID public key
      console.log("[usePushSubscription] Step 5: Getting VAPID key...");
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log("[usePushSubscription] VAPID key present:", !!vapidPublicKey);

      if (!vapidPublicKey) {
        const msg = "VAPID public key not configured";
        console.error("[usePushSubscription]", msg);
        setError(msg);
        setIsLoading(false);
        return false;
      }

      // Step 6: Subscribe to push
      console.log("[usePushSubscription] Step 6: Subscribing to push...");
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      });
      console.log(
        "[usePushSubscription] Push subscription created:",
        !!pushSubscription
      );

      // Step 7: Get authenticated user
      console.log(
        "[usePushSubscription] Step 7: Getting authenticated user..."
      );
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser() as any as { data: { user: any }; error: any };
      console.log("[usePushSubscription] User:", user ? user.id : "Not found");
      console.log("[usePushSubscription] User error:", userError);

      if (userError || !user) {
        const msg = "User not authenticated";
        console.error("[usePushSubscription]", msg, userError);
        setError(msg);
        setIsLoading(false);
        return false;
      }

      // Step 8: Prepare subscription data
      console.log(
        "[usePushSubscription] Step 8: Preparing subscription data..."
      );
      const subscriptionData = pushSubscription.toJSON();
      const deviceId = getDeviceId();

      console.log("[usePushSubscription] Subscription data:", {
        endpoint: subscriptionData.endpoint?.substring(0, 50) + "...",
        hasP256dh: !!subscriptionData.keys?.p256dh,
        hasAuth: !!subscriptionData.keys?.auth,
        deviceId,
      });

      // Step 9: Save subscription to database
      console.log("[usePushSubscription] Step 9: Saving to database...");
      const subscriptionRecord = {
        user_id: user.id,
        device_id: deviceId,
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh,
        auth: subscriptionData.keys!.auth,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        active: true,
        last_used: new Date().toISOString(),
      };

      console.log("[usePushSubscription] Attempting upsert with:", {
        user_id: subscriptionRecord.user_id,
        device_id: subscriptionRecord.device_id,
        endpoint_length: subscriptionRecord.endpoint.length,
      });

      const { data: insertedData, error: dbError } = await (supabase
        .from("notification_subscriptions") as any)
        .upsert(subscriptionRecord as any, {
          onConflict: "user_id,device_id",
        })
        .select() as any as { data: any; error: any };

      console.log("[usePushSubscription] Database response:", {
        data: insertedData,
        error: dbError,
      });

      if (dbError) {
        console.error("[usePushSubscription] Database error details:", {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
        });
        setError("Failed to save subscription: " + dbError.message);
        setIsLoading(false);
        return false;
      }

      console.log("[usePushSubscription] ✅ Successfully saved to database!");

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      setIsLoading(false);

      console.log(
        "[usePushSubscription] ========== SUBSCRIBE COMPLETED =========="
      );
      return true;
    } catch (err) {
      console.error(
        "[usePushSubscription] ========== SUBSCRIBE FAILED =========="
      );
      console.error("[usePushSubscription] Error:", err);
      console.error("[usePushSubscription] Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(err instanceof Error ? err.message : "Subscription failed");
      setIsLoading(false);
      return false;
    }
  }, [isSupported, isSubscribed, subscription, supabase]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    console.log("[usePushSubscription] Unsubscribing...");

    if (!subscription) {
      console.log(
        "[usePushSubscription] No active subscription to unsubscribe from"
      );
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await subscription.unsubscribe();
      console.log("[usePushSubscription] Unsubscribed from push");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const deviceId = getDeviceId();
        const { error } = await (supabase as any)
      .from("notification_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("device_id", deviceId);

        if (error) {
          console.error(
            "[usePushSubscription] Error deleting from database:",
            error
          );
        } else {
          console.log("[usePushSubscription] Deleted from database");
        }
      }

      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);

      console.log("[usePushSubscription] Successfully unsubscribed");
      return true;
    } catch (err) {
      console.error("[usePushSubscription] Error unsubscribing:", err);
      setError(err instanceof Error ? err.message : "Unsubscribe failed");
      setIsLoading(false);
      return false;
    }
  }, [subscription, supabase]);

  // Resubscribe
  const resubscribe = useCallback(async () => {
    if (subscription) {
      await unsubscribe();
    }
    return await subscribe();
  }, [subscription, subscribe, unsubscribe]);

  return {
    isSupported,
    subscription,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    resubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to get or create device ID
function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Helper function to detect device type
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}
