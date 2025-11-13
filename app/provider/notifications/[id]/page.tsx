// app/(customer|provider)/messages/[id]/page.tsx
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SimpleChat } from "@/components/chat/simple-chat";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

function ChatPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract IDs from params
  const receiverId = params.id as string;

  useEffect(() => {
    if (user && receiverId) {
      fetchOtherUser();
    }
  }, [user, receiverId]);

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", receiverId)
        .single();

      if (error) throw error;
      setOtherUser(data);
    } catch (err: any) {
      console.error("Error fetching user:", err);
      setError(err.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
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
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        <SimpleChat
          receiverId={receiverId}
          receiverName={otherUser.full_name}
        />

        {/* Notice */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Messages are automatically deleted after 30 days for privacy and
            storage optimization.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
