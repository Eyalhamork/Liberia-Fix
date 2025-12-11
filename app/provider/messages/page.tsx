"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  MessageSquare,
  Bell,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Crown,
  Sparkles,
  Megaphone,
  Archive,
  Eye,
  EyeOff,
} from "lucide-react";

interface Message {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "update" | "promotion" | "alert";
  read: boolean;
  created_at: string;
}

function ProviderMessagesContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "elite">(
    "free"
  );

  const isPro = currentTier === "pro" || currentTier === "elite";

  // Mock messages for demo - replace with real Supabase query
  const mockMessages: Message[] = [
    {
      id: "1",
      title: "Welcome to LiberiaFix! 🎉",
      content:
        "Thank you for joining LiberiaFix as a service provider! We're excited to help you grow your business. Here are some tips to get started:\n\n1. Complete your profile with high-quality photos\n2. Add detailed service descriptions\n3. Set competitive pricing\n4. Respond quickly to customer inquiries\n\nUpgrade to Pro for advanced analytics and priority placement in search results!",
      type: "announcement",
      read: false,
      created_at: "2025-10-06T10:00:00Z",
    },
    {
      id: "2",
      title: "New Feature: Analytics Dashboard",
      content:
        "Pro subscribers now have access to our new Analytics Dashboard! Track your profile views, contact requests, and conversion rates. Upgrade to Pro today to unlock these powerful insights.",
      type: "update",
      read: true,
      created_at: "2025-10-05T14:30:00Z",
    },
    {
      id: "3",
      title: "Limited Time Offer: 3 Months Free Pro! 🔥",
      content:
        "To celebrate our launch, we're offering 3 months of Pro subscription absolutely FREE to all providers who sign up this month! Enjoy unlimited service listings, advanced analytics, and priority search placement. Don't miss out!",
      type: "promotion",
      read: false,
      created_at: "2025-10-04T09:00:00Z",
    },
    {
      id: "4",
      title: "Platform Maintenance - October 10",
      content:
        "We'll be performing scheduled maintenance on October 10 from 2:00 AM to 4:00 AM GMT. The platform will be temporarily unavailable during this time. We apologize for any inconvenience.",
      type: "alert",
      read: true,
      created_at: "2025-10-03T16:00:00Z",
    },
    {
      id: "5",
      title: "Tips for Better Customer Reviews",
      content:
        "Want more 5-star reviews? Here's how:\n\n• Arrive on time\n• Communicate clearly\n• Clean up after completing work\n• Follow up with customers\n• Ask satisfied customers to leave reviews\n\nGreat reviews lead to more bookings!",
      type: "announcement",
      read: true,
      created_at: "2025-10-02T11:00:00Z",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchMessages();
    }
  }, [user]);

  const fetchProviderData = async () => {
    const { data } = await (supabase as any)
      .from("providers")
      .select("subscription_tier")
      .eq("user_id", user?.id as string)
      .single();

    if (data) {
      setCurrentTier(data.subscription_tier || "free");
    }
  };

  const fetchMessages = async () => {
    setLoading(true);

    // TODO: Replace with actual Supabase query when messages table is ready
    // const { data } = await supabase
    //   .from("admin_messages")
    //   .select("*")
    //   .order("created_at", { ascending: false });

    // For now, use mock data
    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 500);
  };

  const markAsRead = async (messageId: string) => {
    // TODO: Update in Supabase
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    // TODO: Delete from Supabase
    setMessages(messages.filter((msg) => msg.id !== messageId));
    setSelectedMessage(null);
  };

  const markAllAsRead = () => {
    // TODO: Update in Supabase
    setMessages(messages.map((msg) => ({ ...msg, read: true })));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="h-5 w-5 text-blue-600" />;
      case "update":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "promotion":
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "from-blue-50 to-blue-100 border-blue-200";
      case "update":
        return "from-purple-50 to-purple-100 border-purple-200";
      case "promotion":
        return "from-yellow-50 to-yellow-100 border-yellow-200";
      case "alert":
        return "from-red-50 to-red-100 border-red-200";
      default:
        return "from-gray-50 to-gray-100 border-gray-200";
    }
  };

  const filteredMessages =
    filter === "unread" ? messages.filter((msg) => !msg.read) : messages;

  const unreadCount = messages.filter((msg) => !msg.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/70 to-purple-50/30 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Messages
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white text-sm font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
                    <Crown className="h-4 w-4" />
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Stay updated with announcements and platform updates
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-xl p-2 border border-white/20 shadow-lg w-fit">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Messages ({messages.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === "unread"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === "unread" ? "No Unread Messages" : "No Messages Yet"}
            </h3>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up! Check back later for updates."
                : "We'll notify you when there are important updates."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read) markAsRead(message.id);
                  }}
                  className={`bg-gradient-to-br ${getMessageColor(
                    message.type
                  )} rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedMessage?.id === message.id
                      ? "ring-4 ring-blue-200 shadow-xl"
                      : ""
                  } ${!message.read ? "border-l-4 border-l-blue-600" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {getMessageIcon(message.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className={`font-bold text-gray-900 ${
                            !message.read ? "text-blue-900" : ""
                          }`}
                        >
                          {message.title}
                        </h3>
                        {!message.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">
                          {new Date(message.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            message.read
                              ? "bg-gray-200 text-gray-600"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {message.read ? "Read" : "New"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Details */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              {selectedMessage ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 bg-gradient-to-br ${getMessageColor(
                          selectedMessage.type
                        )} rounded-xl`}
                      >
                        {getMessageIcon(selectedMessage.type)}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                            selectedMessage.type === "announcement"
                              ? "bg-blue-100 text-blue-700"
                              : selectedMessage.type === "update"
                              ? "bg-purple-100 text-purple-700"
                              : selectedMessage.type === "promotion"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {selectedMessage.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedMessage.title}
                  </h2>

                  <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {new Date(selectedMessage.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => markAsRead(selectedMessage.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        selectedMessage.read
                          ? "text-gray-600 hover:bg-gray-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {selectedMessage.read ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Read
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Mark as Read
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-xl text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Select a Message
                  </h3>
                  <p className="text-gray-600">
                    Click on a message from the list to view its full content
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderMessages() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderMessagesContent />
    </ProtectedRoute>
  );
}
