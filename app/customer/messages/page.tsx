// app/customer/messages/page.tsx - MESSAGES/NOTIFICATIONS PAGE
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Trash2,
  Archive,
  Star,
  TrendingUp,
  Gift,
  Zap,
} from "lucide-react";
import { useState } from "react";

// Mock data - replace with real Supabase data
const mockMessages = [
  {
    id: "1",
    type: "announcement",
    title: "Welcome to LiberiaFix! 🎉",
    message:
      "Thank you for joining LiberiaFix! We're excited to help you connect with trusted service providers across Liberia. Explore our platform and find the perfect provider for your needs.",
    icon: Sparkles,
    color: "from-blue-500 to-purple-500",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    read: false,
    created_at: "2025-01-25T10:00:00",
    priority: "high",
  },
  {
    id: "2",
    type: "update",
    title: "New Feature: Quick Search",
    message:
      "We've added a quick search feature to help you find providers faster! Now you can search directly from your dashboard and get instant results.",
    icon: Zap,
    color: "from-yellow-500 to-blue-500",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    read: false,
    created_at: "2025-01-24T14:30:00",
    priority: "medium",
  },
  {
    id: "3",
    type: "promotion",
    title: "Special Offer: Free Booking Fee!",
    message:
      "Book 3 providers this month and get your 4th booking fee FREE! Limited time offer. Start booking now to take advantage of this amazing deal.",
    icon: Gift,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
    read: true,
    created_at: "2025-01-22T09:00:00",
    priority: "high",
  },
  {
    id: "4",
    type: "info",
    title: "Maintenance Notice",
    message:
      "We'll be performing scheduled maintenance on Sunday, January 28th from 2:00 AM to 4:00 AM. The platform may be temporarily unavailable during this time.",
    icon: Info,
    color: "from-gray-500 to-slate-500",
    bgColor: "bg-gray-50",
    iconColor: "text-gray-600",
    read: true,
    created_at: "2025-01-20T16:00:00",
    priority: "low",
  },
  {
    id: "5",
    type: "success",
    title: "Review Request",
    message:
      "You recently completed a booking with John Mensah. We'd love to hear about your experience! Your feedback helps other customers make informed decisions.",
    icon: Star,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    read: true,
    created_at: "2025-01-18T11:30:00",
    priority: "medium",
  },
];

function MessagesContent() {
  const [messages, setMessages] = useState(mockMessages);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = messages.filter((msg) => !msg.read).length;

  const filteredMessages =
    filter === "all" ? messages : messages.filter((msg) => !msg.read);

  const handleMarkAsRead = (id: string) => {
    setMessages(
      messages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
    );
  };

  const handleMarkAllAsRead = () => {
    setMessages(messages.map((msg) => ({ ...msg, read: true })));
  };

  const handleDelete = (id: string) => {
    setMessages(messages.filter((msg) => msg.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Updates, announcements, and important information from LiberiaFix
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-2 shadow-lg text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 " />
                <p className="text-xs font-medium ">Total</p>
              </div>
              <p className="text-2xl font-bold ">{messages.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-2 shadow-lg text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="h-4 w-4 " />
                <p className="text-xs font-medium ">Unread</p>
              </div>
              <p className="text-2xl font-bold ">{unreadCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-2 shadow-lg text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 " />
                <p className="text-xs font-medium ">Read</p>
              </div>
              <p className="text-2xl font-bold ">
                {messages.length - unreadCount}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-2 shadow-lg text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 " />
                <p className="text-xs font-medium ">This Week</p>
              </div>
              <p className="text-2xl font-bold ">
                {
                  messages.filter((msg) => {
                    const msgDate = new Date(msg.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return msgDate > weekAgo;
                  }).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                  className={
                    filter === "all"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600"
                      : ""
                  }
                >
                  All Messages
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  onClick={() => setFilter("unread")}
                  size="sm"
                  className={
                    filter === "unread" ? "bg-red-600 hover:bg-red-700" : ""
                  }
                >
                  Unread ({unreadCount})
                </Button>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden ${
                  !message.read ? "ring-2 ring-blue-200" : ""
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Left Color Bar */}
                    <div
                      className={`w-2 bg-gradient-to-b ${message.color}`}
                    ></div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`h-12 w-12 rounded-xl ${message.bgColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <message.icon
                            className={`h-6 w-6 ${message.iconColor}`}
                          />
                        </div>

                        {/* Message Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg text-gray-900">
                                {message.title}
                              </h3>
                              {!message.read && (
                                <Badge className="bg-blue-600 text-white">
                                  New
                                </Badge>
                              )}
                              {message.priority === "high" && (
                                <Badge className="bg-red-600 text-white">
                                  Important
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatDate(message.created_at)}
                            </p>
                          </div>

                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {message.message}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!message.read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Read
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(message.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {filter === "unread" ? "No unread messages" : "No messages"}
                </h3>
                <p className="text-gray-600">
                  {filter === "unread"
                    ? "You're all caught up! Check back later for new updates."
                    : "You don't have any messages yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Card */}
        {messages.length > 0 && (
          <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    About Messages
                  </p>
                  <p className="text-sm text-gray-600">
                    Messages from LiberiaFix admins include important
                    announcements, platform updates, special promotions, and
                    service reminders. We'll never spam you!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <ConditionalFooter />
    </div>
  );
}

export default function CustomerMessagesPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <MessagesContent />
    </ProtectedRoute>
  );
}
