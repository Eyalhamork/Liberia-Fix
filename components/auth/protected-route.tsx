// components/auth/protected-route.tsx
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedUserTypes?: Array<"customer" | "provider" | "admin">;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedUserTypes,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      console.log("🟢 ProtectedRoute check:", {
        loading,
        hasUser: !!user,
        userType: profile?.user_type,
        path: window.location.pathname,
      });

      // Redirect if auth required but no user
      if (requireAuth && !user) {
        router.replace(redirectTo);
        return;
      }

      // Check user type restrictions
      if (
        requireAuth &&
        user &&
        profile &&
        allowedUserTypes &&
        !allowedUserTypes.includes(profile.user_type)
      ) {
        // Redirect to appropriate dashboard based on user type
        const routes: Record<string, string> = {
          customer: "/customer/dashboard",
          provider: "/provider/dashboard",
          admin: "/admin/dashboard",
        };
        router.replace(routes[profile.user_type] || "/");
      }
    }
  }, [
    user,
    profile,
    loading,
    requireAuth,
    allowedUserTypes,
    redirectTo,
    router,
  ]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth required but no user
  if (requireAuth && !user) {
    return null;
  }

  // Don't render if user type not allowed
  if (
    requireAuth &&
    user &&
    profile &&
    allowedUserTypes &&
    !allowedUserTypes.includes(profile.user_type)
  ) {
    return null;
  }

  return <>{children}</>;
}
