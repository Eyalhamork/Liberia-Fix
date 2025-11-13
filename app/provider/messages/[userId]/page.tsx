// app/provider/messages/[userId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  expires_at: string;
}

interface OtherUser {
  id: string;
  full_name: string;
  avatar_url: string;
  user_type: string;
}

function ProviderMessagesPageContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const customerId = params.userId as string;

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (user && customerId) {
      fetchOtherUser(abortController.signal);
      fetchMessages(abortController.signal);

      // Set up realtime subscription for new messages
      const channel = supabase
        .channel(`messages:${user.id}:${customerId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            if (isMountedRef.current && payload.new.sender_id === customerId) {
              setMessages((prev) => [...prev, payload.new as Message]);
              scrollToBottom();
            }
          }
        )
        .subscribe();

      return () => {
        isMountedRef.current = false;
        abortController.abort();
        channel.unsubscribe();
      };
    }
  }, [user?.id, customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOtherUser = async (signal: AbortSignal) => {
    try {
      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", customerId)
        .abortSignal(signal)
        .single();

      if (isMountedRef.current && !signal.aborted) {
        if (profileData) {
          setOtherUser({
            id: profileData.id,
            full_name: profileData.full_name || "Customer",
            avatar_url: profileData.avatar_url || "",
            user_type: "customer",
          });
        } else {
          // Even if profile fetch fails, allow messaging
          setOtherUser({
            id: customerId,
            full_name: "Customer",
            avatar_url: "",
            user_type: "customer",
          });
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") return;
      if (isMountedRef.current) {
        console.error("Error fetching user:", err);
        // Still allow messaging even if error
        setOtherUser({
          id: customerId,
          full_name: "Customer",
          avatar_url: "",
          user_type: "customer",
        });
      }
    }
  };

  const fetchMessages = async (signal: AbortSignal) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Fetch messages where user is either sender or receiver
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${customerId}),and(sender_id.eq.${customerId},receiver_id.eq.${user?.id})`
        )
        .order("created_at", { ascending: true })
        .abortSignal(signal);

      if (isMountedRef.current && !signal.aborted) {
        if (fetchError) {
          console.error("Error fetching messages:", fetchError);
          setError("Failed to load messages");
        } else {
          // Filter out expired messages (older than 30 days)
          const now = new Date();
          const validMessages = (data || []).filter((msg) => {
            const expiresAt = new Date(msg.expires_at);
            return expiresAt > now;
          });
          setMessages(validMessages);

          // Mark received messages as read
          const unreadIds = validMessages
            .filter((msg) => msg.receiver_id === user?.id && !msg.read)
            .map((msg) => msg.id);

          if (unreadIds.length > 0) {
            await supabase
              .from("messages")
              .update({ read: true })
              .in("id", unreadIds);
          }
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "PGRST301") return;
      if (isMountedRef.current) {
        console.error("Error:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !customerId) return;

    setSending(true);

    try {
      // Create expires_at date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: customerId,
          message: newMessage.trim(),
          read: false,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (sendError) throw sendError;

      if (data && isMountedRef.current) {
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load Conversation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if messages will expire soon
  const oldestMessage = messages[0];
  const daysUntilExpiry = oldestMessage
    ? getDaysUntilExpiry(oldestMessage.expires_at)
    : 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              {otherUser.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {otherUser.full_name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {otherUser.full_name}
                </h2>
                <p className="text-sm text-gray-600 capitalize">
                  {otherUser.user_type}
                </p>
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
            <div className="p-3 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">
                  Messages expire in {daysUntilExpiry} day
                  {daysUntilExpiry !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 text-sm">
                  Start the conversation by sending a message below
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwnMessage ? "order-2" : "order-1"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{formatTime(message.created_at)}</span>
                          {isOwnMessage && message.read && (
                            <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !sending && sendMessage()
                }
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Messages are automatically deleted after 30 days for privacy and
            storage optimization.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProviderMessagesPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderMessagesPageContent />
    </ProtectedRoute>
  );
}
