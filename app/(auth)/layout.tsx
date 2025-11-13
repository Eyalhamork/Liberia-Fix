// app/(auth)/layout.tsx - SIMPLIFIED
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if fully loaded and user exists
    if (!loading && user && profile) {
      const routes: Record<string, string> = {
        customer: "/customer/dashboard",
        provider: "/provider/dashboard",
        admin: "/admin/dashboard",
      };
      router.replace(routes[profile.user_type] || "/customer/dashboard");
    }
  }, [user, profile, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render auth pages if already authenticated
  if (user) {
    return null;
  }

  return <>{children}</>;
}
