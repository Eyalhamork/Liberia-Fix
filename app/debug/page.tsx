// app/debug-auth/page.tsx - Debug page to test auth state
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { RefreshCw, Home, LayoutDashboard } from "lucide-react";

export default function AuthDebugPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const supabase = createClient();

  const checkSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    setSessionInfo({
      session: session ? "Active" : "None",
      error: error?.message,
    });
  };

  const forceRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Auth Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="font-medium">Loading:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  loading
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-green-200 text-green-800"
                }`}
              >
                {loading ? "TRUE (Still Loading...)" : "FALSE (Ready)"}
              </span>
            </div>

            {/* User State */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="font-medium">User:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  user
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {user
                  ? `Logged in (${user.id.slice(0, 8)}...)`
                  : "Not logged in"}
              </span>
            </div>

            {/* Profile State */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="font-medium">Profile:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  profile
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {profile
                  ? `${profile.user_type} (${profile.full_name})`
                  : "No profile"}
              </span>
            </div>

            {/* User Email */}
            {user && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <span className="font-medium">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
            )}

            {/* Session Check */}
            <div className="p-4 bg-orange-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Supabase Session:</span>
                <Button onClick={checkSession} size="sm" variant="outline">
                  Check Now
                </Button>
              </div>
              {sessionInfo && (
                <div className="text-sm text-gray-600">
                  Status: {sessionInfo.session}
                  {sessionInfo.error && ` (Error: ${sessionInfo.error})`}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Page loaded at: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full" variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go to Home Page
              </Button>
            </Link>

            <Link href="/customer/dashboard" className="block">
              <Button className="w-full" variant="outline">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>

            <Button onClick={forceRefresh} className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Reload Page
            </Button>

            {user && (
              <Button
                onClick={signOut}
                className="w-full"
                variant="destructive"
              >
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Console Logs Hint */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Open your browser's Developer Console
              (F12) to see detailed auth logs. Look for messages starting with{" "}
              <code className="bg-white px-1 rounded">[useAuth]</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
