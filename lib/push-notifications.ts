// lib/push-notifications.ts
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// NOTE: Service worker is registered by next-pwa and ServiceWorkerRegistration component
// We just use the existing registration here
export async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return null;
  }

  try {
    // Wait for the service worker to be ready (it's registered by next-pwa)
    const registration = await navigator.serviceWorker.ready;
    console.log("Using existing Service Worker registration");
    return registration;
  } catch (error) {
    console.error("Service Worker not available:", error);
    return null;
  }
}

// Generate a stable device ID for this browser
function getDeviceId(): string {
  const storageKey = "device_id";
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    // Create new device ID: timestamp + random string
    deviceId = `device_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

// Get user agent info for device_type
function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "desktop";
}

export async function subscribeToPushNotifications(userId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported");
    return false;
  }

  try {
    // Get the existing service worker registration
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error("No service worker registration available");
      return false;
    }

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, "+")
          .replace(/_/g, "/");
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Save subscription to database
    const supabase = createClient();
    const subscriptionJSON = subscription.toJSON();
    const deviceId = getDeviceId();
    const deviceType = getDeviceType();
    const userAgent = navigator.userAgent.substring(0, 255); // Limit to 255 chars

    console.log("💾 Saving subscription with device_id:", deviceId);

    const { data, error } = await supabase
      .from("notification_subscriptions")
      .upsert(
        {
          user_id: userId,
          device_id: deviceId,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh || "",
          auth: subscriptionJSON.keys?.auth || "",
          device_type: deviceType,
          user_agent: userAgent,
          active: true,
          last_used: new Date().toISOString(),
        },
        {
          onConflict: "user_id,device_id", // Specify the unique constraint
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Error saving subscription:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }

    console.log("✅ Push subscription saved successfully!");
    console.log("Subscription ID:", data?.id);
    return true;
  } catch (error) {
    console.error("❌ Error subscribing to push:", error);
    return false;
  }
}

export async function requestNotificationPermission(userId: string) {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return await subscribeToPushNotifications(userId);
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await subscribeToPushNotifications(userId);
    }
  }

  return false;
}
