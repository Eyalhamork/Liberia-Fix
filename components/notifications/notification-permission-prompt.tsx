"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { requestNotificationPermission } from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

  // Check current subscription status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Check browser permission
        if ("Notification" in window) {
          setPermission(Notification.permission);
        }

        // Check if user has active subscription in database
        const { data, error } = await (supabase as any)
      .from("notification_subscriptions")
          .select("id, active")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (!error && data) {
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("Error checking notification status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [user, supabase]);

  const handleEnableNotifications = async () => {
    if (!user) {
      setMessage({
        type: "error",
        text: "You must be logged in to enable notifications",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      const success = await requestNotificationPermission(user.id);

      if (success) {
        setIsSubscribed(true);
        setPermission("granted");
        setMessage({
          type: "success",
          text: "Notifications enabled successfully! You'll now receive updates.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to enable notifications. Please check your browser settings.",
        });
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setMessage({
        type: "error",
        text: "An error occurred while enabling notifications.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      // Get device ID from localStorage
      const deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        throw new Error("Device ID not found");
      }

      // Deactivate subscription in database
      const { error } = await (supabase as any)
      .from("notification_subscriptions")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("device_id", deviceId);

      if (error) throw error;

      // Unsubscribe from browser push
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      setMessage({
        type: "success",
        text: "Notifications disabled successfully.",
      });
    } catch (error) {
      console.error("Error disabling notifications:", error);
      setMessage({
        type: "error",
        text: "Failed to disable notifications.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Loading notification status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If notifications not supported
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To receive push notifications, please use a modern browser like Chrome,
            Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Notification Settings
        </CardTitle>
        <CardDescription>
          {isSubscribed
            ? "You're receiving push notifications"
            : "Enable push notifications to stay updated"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "Enabled - You'll receive updates about bookings, service requests, and messages"
                : "Get instant updates on your device"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
        </div>

        {/* Message */}
        {message.type && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Browser Permission Warning */}
        {permission === "denied" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <p className="text-sm font-medium mb-1">Browser Permission Blocked</p>
            <p className="text-xs">
              You've previously blocked notifications. To enable them, click the lock
              icon in your browser's address bar and allow notifications for this
              site.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {isSubscribed ? (
            <Button
              onClick={handleDisableNotifications}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Disable Notifications
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleEnableNotifications}
              disabled={loading || permission === "denied"}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Notifications
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            <strong>What you'll receive:</strong>
            <br />• New booking requests and confirmations
            <br />• Service request responses and updates
            <br />• New messages from customers/providers
            <br />• Wallet updates and payment confirmations
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
