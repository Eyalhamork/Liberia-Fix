// components/auth/protected-action.tsx
"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

interface ProtectedActionProps {
  children: React.ReactNode;
  action: string; // e.g., "bid", "create request", "contact provider"
  requireAuth?: boolean;
  requireUserType?: Array<"customer" | "provider" | "admin">;
  onUnauthorized?: () => void;
  fallback?: React.ReactNode;
  className?: string;
}

export function ProtectedAction({
  children,
  action,
  requireAuth = true,
  requireUserType,
  onUnauthorized,
  fallback,
  className = "",
}: ProtectedActionProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // If loading, prevent action
    if (loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if authentication is required
    if (requireAuth && !user) {
      e.preventDefault();
      e.stopPropagation();

      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    // Check user type requirements
    if (
      requireAuth &&
      user &&
      profile &&
      requireUserType &&
      !requireUserType.includes(profile.user_type)
    ) {
      e.preventDefault();
      e.stopPropagation();

      if (onUnauthorized) {
        onUnauthorized();
      } else {
        alert(
          `This action requires a ${requireUserType.join(" or ")} account.`
        );
      }
      return;
    }

    // All checks passed, allow the action
  };

  // If custom fallback is provided and user is not authorized
  if (
    fallback &&
    requireAuth &&
    !loading &&
    (!user ||
      (requireUserType &&
        profile &&
        !requireUserType.includes(profile.user_type)))
  ) {
    return <>{fallback}</>;
  }

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}

// Hook for programmatic auth checks
export function useProtectedAction() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const checkAuth = (
    requireAuth: boolean = true,
    requireUserType?: Array<"customer" | "provider" | "admin">
  ): boolean => {
    if (loading) return false;

    if (requireAuth && !user) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return false;
    }

    if (
      requireAuth &&
      user &&
      profile &&
      requireUserType &&
      !requireUserType.includes(profile.user_type)
    ) {
      alert(`This action requires a ${requireUserType.join(" or ")} account.`);
      return false;
    }

    return true;
  };

  return { checkAuth, user, profile, loading };
}
