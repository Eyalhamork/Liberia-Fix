// components/notifications/notification-list.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Package,
  MessageSquare,
  DollarSign,
  Star,
  AlertCircle,
  TrendingUp,
  Gift,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationListProps {
  limit?: number;
  showAll?: boolean;
}

// Icon mapping based on category
const categoryIcons: Record<string, any> = {
  bookings: Package,
  messages: MessageSquare,
  payments: DollarSign,
  reviews: Star,
  custom_requests: AlertCircle,
  promotions: Gift,
  system: Bell,
  performance: TrendingUp,
};

// Color mapping based on priority
const priorityColors: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-blue-600 bg-blue-50 border-blue-200",
  low: "text-gray-600 bg-gray-50 border-gray-200",
};

export function NotificationList({
  limit = 5,
  showAll = false,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel("notification-list-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit, showAll]);

  async function fetchNotifications() {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!showAll) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string, actionUrl: string | null) {
    try {
      console.log("Marking notification as read:", notificationId);

      // Mark as read first (without waiting for response to avoid blocking)
      supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .then(({ error }) => {
          if (error) {
            console.error("Error marking notification as read:", error);
          } else {
            console.log("Notification marked as read successfully");
          }
        });

      // Navigate immediately if URL provided (don't wait for DB update)
      if (actionUrl) {
        console.log("Navigating to:", actionUrl);
        router.push(actionUrl);
      }
    } catch (error) {
      console.error("Error in markAsRead:", error);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No notifications yet</p>
        <p className="text-sm text-gray-400 mt-1">
          We'll notify you when something important happens
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notifications.map((notification) => {
        const Icon = categoryIcons[notification.category] || AlertCircle;
        const colorClass =
          priorityColors[notification.priority] || priorityColors.low;

        return (
          <button
            key={notification.id}
            onClick={() => markAsRead(notification.id, notification.action_url)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
              !notification.read ? "bg-blue-50/50" : ""
            }`}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                  )}
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {notification.body}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="capitalize">{notification.priority}</span>
                  <span>•</span>
                  <span className="capitalize">{notification.category}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
