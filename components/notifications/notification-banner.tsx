"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { requestNotificationPermission } from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, X, Loader2 } from "lucide-react";

/**
 * Banner that prompts users to enable notifications if they haven't already.
 * Shows on dashboard pages and can be dismissed.
 */
export function NotificationBanner() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkIfShouldShow = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Check if banner was dismissed
      const dismissKey = `notification_banner_dismissed_${user.id}`;
      if (localStorage.getItem(dismissKey) === "true") {
        setChecking(false);
        return;
      }

      // Check if notifications are supported
      if (!("Notification" in window)) {
        setChecking(false);
        return;
      }

      // Check browser permission
      if (Notification.permission === "granted") {
        // Permission granted, but check if subscribed
        const { data: subscription } = await (supabase as any)
      .from("notification_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (subscription) {
          // Already subscribed, don't show banner
          setChecking(false);
          return;
        }
      } else if (Notification.permission === "denied") {
        // User has blocked, don't show banner
        setChecking(false);
        return;
      }

      // Show banner if permission is "default" (not asked yet) or granted but not subscribed
      setIsVisible(true);
      setChecking(false);
    };

    checkIfShouldShow();
  }, [user, supabase]);

  const handleEnable = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const success = await requestNotificationPermission(user.id);

      if (success) {
        // Hide banner on success
        setIsVisible(false);
        const dismissKey = `notification_banner_dismissed_${user.id}`;
        localStorage.setItem(dismissKey, "true");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (!user) return;

    setIsVisible(false);
    const dismissKey = `notification_banner_dismissed_${user.id}`;
    localStorage.setItem(dismissKey, "true");
  };

  if (checking || !isVisible) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon & Message */}
          <div className="flex items-start gap-3 flex-1">
            <Bell className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base">
                Stay Updated with Push Notifications
              </p>
              <p className="text-sm text-blue-100 mt-1">
                Get instant alerts for bookings, service requests, messages, and more.
                Enable notifications to never miss important updates.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleEnable}
              disabled={loading}
              variant="secondary"
              className="flex-1 sm:flex-initial bg-white text-blue-600 hover:bg-blue-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Now
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
