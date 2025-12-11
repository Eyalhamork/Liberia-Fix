// app/notifications/page.tsx
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

type FilterType = "all" | "unread" | "bookings" | "messages" | "payments";

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

const priorityColors: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-blue-600 bg-blue-50 border-blue-200",
  low: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }

    fetchNotifications();
    fetchUnreadCount();

    // Real-time subscription
    const channel = supabase
      .channel("notifications-page-updates")
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
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filter]);

  async function fetchNotifications() {
    if (!user) return;

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filter === "unread") {
        query = query.eq("read", false);
      } else if (filter !== "all") {
        query = query.eq("category", filter);
      }

      const { data, error } = await query as { data: Notification[] | null; error: any };

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

  async function fetchUnreadCount() {
    if (!user) return;

    try {
      const { count, error } = await (supabase as any)
      .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false) as { count: number | null; error: any };

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  async function markAsRead(notificationId: string, actionUrl: string | null) {
    try {
      const { error } = await (supabase
        .from("notifications") as any)
        .update({ read: true, read_at: new Date().toISOString() } as any)
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking as read:", error);
        return;
      }

      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;

    try {
      const { error } = await (supabase
        .from("notifications") as any)
        .update({ read: true, read_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all as read:", error);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  const filterTabs: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: `Unread (${unreadCount})` },
    { value: "bookings", label: "Bookings" },
    { value: "messages", label: "Messages" },
    { value: "payments", label: "Payments" },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.value
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "You don't have any notifications yet"
                  : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon =
                  categoryIcons[notification.category] || AlertCircle;
                const colorClass =
                  priorityColors[notification.priority] || priorityColors.low;

                return (
                  <button
                    key={notification.id}
                    onClick={() =>
                      markAsRead(notification.id, notification.action_url)
                    }
                    className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="h-2.5 w-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {notification.body}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="capitalize font-medium">
                            {notification.priority}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {notification.category.replace("_", " ")}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
