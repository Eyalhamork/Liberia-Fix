// components/chat/simple-chat.tsx
// ============================================

"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface SimpleChatProps {
  receiverId: string;
  receiverName: string;
  bookingId?: string;
  serviceRequestId?: string;
}

export function SimpleChat({
  receiverId,
  receiverName,
  bookingId,
  serviceRequestId,
}: SimpleChatProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user && receiverId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [user, receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
      .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user?.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await (supabase
        .from("messages") as any)
        .update({ read: true } as any)
        .eq("receiver_id", user?.id as string)
        .eq("sender_id", receiverId)
        .eq("read", false);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          if (
            newMsg.sender_id === receiverId ||
            newMsg.receiver_id === receiverId
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { data, error } = await (supabase as any)
      .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          booking_id: bookingId || null,
          service_request_id: serviceRequestId || null,
          message: newMessage.trim(),
        } as any)
        .select()
        .single() as any as { data: Message | null; error: any };

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data]);
      }
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">{receiverName}</h3>
            <p className="text-xs text-blue-100">
              Messages auto-delete after 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    isOwn
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            disabled={sending}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {newMessage.length}/500 characters
        </p>
      </div>
    </div>
  );
}
