// components/messaging/simple-chat.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Send,
  Phone,
  MapPin,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "customer" | "provider";
  timestamp: Date;
  type: "text" | "booking_request" | "address_shared" | "price_quote";
  metadata?: {
    address?: string;
    price?: number;
    service?: string;
    availability?: string;
  };
}

interface SimpleChatProps {
  providerId: string;
  providerName: string;
  providerTier: "free" | "pro";
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleChat({
  providerId,
  providerName,
  providerTier,
  isOpen,
  onClose,
}: SimpleChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm interested in your plumbing services. I have a leaky faucet in my kitchen.",
      sender: "customer",
      timestamp: new Date(Date.now() - 300000),
      type: "text",
    },
    {
      id: "2",
      content:
        "Hello! I can help with that. Kitchen faucet repairs are $25-35 depending on the issue.",
      sender: "provider",
      timestamp: new Date(Date.now() - 240000),
      type: "price_quote",
      metadata: { price: 30, service: "Kitchen faucet repair" },
    },
    {
      id: "3",
      content: "That sounds reasonable. When are you available?",
      sender: "customer",
      timestamp: new Date(Date.now() - 180000),
      type: "text",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "customer",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const sendQuickAction = (type: "booking_request" | "address_request") => {
    const quickMessages = {
      booking_request: "I'd like to book your service. When can you come?",
      address_request: "Could you share your location/address?",
    };

    const message: Message = {
      id: Date.now().toString(),
      content: quickMessages[type],
      sender: "customer",
      timestamp: new Date(),
      type: type === "booking_request" ? "booking_request" : "text",
    };

    setMessages((prev) => [...prev, message]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderMessage = (message: Message) => {
    const isCustomer = message.sender === "customer";

    return (
      <div
        key={message.id}
        className={`flex ${isCustomer ? "justify-end" : "justify-start"} mb-3`}
      >
        <div className={`max-w-[80%] ${isCustomer ? "order-2" : "order-1"}`}>
          {/* Special message types */}
          {message.type === "price_quote" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">
                  Price Quote
                </span>
              </div>
              <div className="text-sm">
                <div>
                  <strong>Service:</strong> {message.metadata?.service}
                </div>
                <div>
                  <strong>Price:</strong> ${message.metadata?.price}
                </div>
              </div>
            </div>
          )}

          {message.type === "booking_request" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">
                  Booking Request
                </span>
              </div>
            </div>
          )}

          {/* Regular message bubble */}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isCustomer
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-gray-100 text-gray-900 rounded-bl-md"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          <div
            className={`text-xs text-gray-500 mt-1 ${
              isCustomer ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-md h-[600px] sm:h-[500px] flex flex-col animate-slide-up">
        {/* Header */}
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{providerName}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {providerTier === "pro" && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      PRO VERIFIED
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Online now
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex gap-2 mb-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendQuickAction("booking_request")}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Request Booking
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendQuickAction("address_request")}
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Get Address
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`tel:+231771234567`)}
              className="text-xs"
            >
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:border-blue-500"
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Message notification badge component
export function MessageBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
      {count > 9 ? "9+" : count}
    </div>
  );
}

// Compact message list for dashboard
export function MessagesList() {
  const conversations = [
    {
      id: "1",
      providerName: "John's Plumbing",
      lastMessage: "I can come tomorrow at 2pm",
      timestamp: new Date(Date.now() - 300000),
      unread: 2,
      avatar: "🔧",
    },
    {
      id: "2",
      providerName: "Clean Pro Services",
      lastMessage: "House cleaning completed!",
      timestamp: new Date(Date.now() - 3600000),
      unread: 0,
      avatar: "🧽",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
          >
            <div className="text-2xl">{conv.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{conv.providerName}</span>
                <span className="text-xs text-gray-500">
                  {conv.timestamp.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conv.lastMessage}
              </p>
            </div>
            {conv.unread > 0 && <MessageBadge count={conv.unread} />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
