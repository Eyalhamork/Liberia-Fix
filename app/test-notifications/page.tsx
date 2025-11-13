// app/test-notifications/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Bell, AlertCircle } from "lucide-react";

export default function TestNotificationsPage() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user } = useAuth();
  const supabase = createClient();

  async function sendTestNotification(type: string) {
    if (!user) {
      setMessage("❌ Please log in first!");
      return;
    }

    setSending(true);
    setMessage("");
    setDebugInfo(null);

    try {
      const notifications: Record<string, any> = {
        booking: {
          type: "booking_confirmed",
          category: "bookings",
          priority: "high",
          title: "Booking Confirmed! 🎉",
          body: "Your booking with John Doe has been confirmed. Contact details unlocked!",
          action_url: "/customer/bookings",
        },
        message: {
          type: "new_message",
          category: "messages",
          priority: "medium",
          title: "New Message 💬",
          body: "John replied to your inquiry about plumbing services.",
          action_url: "/customer/messages",
        },
        payment: {
          type: "payment_received",
          category: "payments",
          priority: "high",
          title: "Payment Received 💰",
          body: "Payment of $50 received for booking #12345",
          action_url: "/provider/earnings",
        },
        review: {
          type: "new_review",
          category: "reviews",
          priority: "medium",
          title: "New Review ⭐",
          body: "You received a 5-star review from Sarah Johnson!",
          action_url: "/provider/reviews",
        },
        custom_request: {
          type: "custom_request_urgent",
          category: "custom_requests",
          priority: "critical",
          title: "Urgent Job Posted! ⚡",
          body: "New ASAP plumbing job in Monrovia - Budget: $150",
          action_url: "/provider/custom-requests",
        },
      };

      const notificationData = notifications[type];
      const insertData = {
        user_id: user.id,
        ...notificationData,
      };

      console.log("=== NOTIFICATION TEST DEBUG ===");
      console.log("User ID:", user.id);
      console.log("User Email:", user.email);
      console.log("Notification Type:", type);
      console.log("Insert Data:", insertData);

      setDebugInfo({
        userId: user.id,
        userEmail: user.email,
        insertData: insertData,
        status: "Sending...",
      });

      const { data, error } = await supabase
        .from("notifications")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        setDebugInfo({
          userId: user.id,
          userEmail: user.email,
          insertData: insertData,
          status: "Failed",
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
        });

        throw error;
      }

      console.log("✅ Notification created successfully!");
      console.log("Notification ID:", data.id);
      console.log("Full notification data:", data);

      setDebugInfo({
        userId: user.id,
        userEmail: user.email,
        insertData: insertData,
        status: "Success",
        result: data,
      });

      setMessage(
        `✅ Test notification sent successfully!\n\nNotification ID: ${data.id}\n\nCheck the bell icon in the header!`
      );
    } catch (error: any) {
      console.error("❌ Error sending test notification:", error);
      setMessage(
        `❌ Error: ${error.message}\n\n${
          error.hint ? `Hint: ${error.hint}\n\n` : ""
        }${error.details ? `Details: ${error.details}` : ""}`
      );
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to test notifications
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Test Notifications
            </h1>
          </div>

          <p className="text-gray-600 mb-6">
            Send test notifications to yourself to verify the notification
            system is working correctly. Open the browser console (F12) to see
            detailed logs.
          </p>

          {/* User Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Logged in as:</h3>
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-blue-800">
              <strong>User ID:</strong> {user.id}
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg whitespace-pre-line ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <details className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <summary className="font-semibold cursor-pointer">
                Debug Info (Click to expand)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}

          {/* Test Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => sendTestNotification("booking")}
              disabled={sending}
              className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-blue-900 mb-1">
                📦 Booking Confirmed
              </h3>
              <p className="text-sm text-blue-700">
                High priority • Bookings category
              </p>
            </button>

            <button
              onClick={() => sendTestNotification("message")}
              disabled={sending}
              className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-purple-900 mb-1">
                💬 New Message
              </h3>
              <p className="text-sm text-purple-700">
                Medium priority • Messages category
              </p>
            </button>

            <button
              onClick={() => sendTestNotification("payment")}
              disabled={sending}
              className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-green-900 mb-1">
                💰 Payment Received
              </h3>
              <p className="text-sm text-green-700">
                High priority • Payments category
              </p>
            </button>

            <button
              onClick={() => sendTestNotification("review")}
              disabled={sending}
              className="w-full p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-yellow-900 mb-1">
                ⭐ New Review
              </h3>
              <p className="text-sm text-yellow-700">
                Medium priority • Reviews category
              </p>
            </button>

            <button
              onClick={() => sendTestNotification("custom_request")}
              disabled={sending}
              className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-red-900 mb-1">
                ⚡ Urgent Custom Request
              </h3>
              <p className="text-sm text-red-700">
                Critical priority • Custom requests category
              </p>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Testing Checklist:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Open browser console (F12) to see detailed logs</li>
              <li>✓ Click a button above to send a test notification</li>
              <li>✓ Watch the badge count update in the header bell icon</li>
              <li>✓ Click the bell icon to see the notification dropdown</li>
              <li>✓ Click the notification to mark it as read</li>
              <li>✓ Badge count should decrease</li>
              <li>✓ Visit /notifications to see all notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
