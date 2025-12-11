// components/notifications/notification-bell.tsx
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationCount } from "@/lib/hooks/use-notification-count";
import { NotificationList } from "./notification-list";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useNotificationCount();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  async function markAllAsRead() {
    if (!user) return;

    try {
      const { error } = await (supabase
        .from("notifications") as any)
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all as read:", error);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />

        {/* Badge */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <span className="text-xs text-gray-500">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    router.push("/notifications");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[500px]">
              <NotificationList limit={5} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
