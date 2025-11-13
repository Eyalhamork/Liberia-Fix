// components/layout/mobile-nav.tsx - ADD SERVICE REQUESTS
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  Search,
  Info,
  Briefcase,
  LayoutDashboard,
  Calendar,
  Heart,
  MessageSquare,
  Settings,
  LogOut,
  User,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (path: string) => pathname === path;

  const handleSwitchToProvider = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Switch to provider account? You'll be able to offer services and receive bookings."
    );

    if (!confirmed) return;

    setIsOpen(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: "provider" })
        .eq("id", user.id);

      if (error) throw error;

      router.push("/provider/onboarding");
    } catch (error) {
      console.error("Switch error:", error);
      alert("Error switching account type");
    }
  };

  const getDashboardRoute = () => {
    if (!profile) return "/customer/dashboard";

    switch (profile.user_type) {
      case "provider":
        return "/provider/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-white shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-6 space-y-2">
              {/* User Info (if logged in) */}
              {user && profile && (
                <div className="pb-4 mb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {profile.full_name}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {profile.user_type}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Link (if logged in) */}
              {user && (
                <Link
                  href={getDashboardRoute()}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(getDashboardRoute())
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              )}

              {/* Main Navigation */}
              <Link
                href="/search"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/search")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Search className="h-5 w-5" />
                <span className="font-medium">Search Providers</span>
              </Link>

              {/* Service Requests */}
              <Link
                href="/service-requests"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/service-requests")
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Service Requests</span>
                {profile?.user_type === "provider" && (
                  <Badge className="bg-orange-500 text-white text-xs ml-auto">
                    12
                  </Badge>
                )}
              </Link>

              <Link
                href="/how-it-works"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/how-it-works")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Info className="h-5 w-5" />
                <span className="font-medium">How It Works</span>
              </Link>

              <Link
                href="/for-providers"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive("/for-providers")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Briefcase className="h-5 w-5" />
                <span className="font-medium">For Providers</span>
              </Link>

              {/* User-specific links */}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-4" />

                  {profile?.user_type === "customer" && (
                    <>
                      <Link
                        href="/customer/bookings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">My Bookings</span>
                      </Link>
                      <Link
                        href="/customer/service-requests"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">My Requests</span>
                      </Link>
                      <Link
                        href="/customer/favorites"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Heart className="h-5 w-5" />
                        <span className="font-medium">Favorites</span>
                      </Link>
                      <Link
                        href="/customer/messages"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">Messages</span>
                      </Link>
                    </>
                  )}

                  {profile?.user_type === "provider" && (
                    <>
                      <Link
                        href="/provider/bookings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Bookings</span>
                      </Link>
                      <Link
                        href="/provider/bids"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">My Bids</span>
                      </Link>
                    </>
                  )}

                  {/* Switch to Provider (Customer only) */}
                  {profile?.user_type === "customer" && (
                    <>
                      <div className="border-t border-gray-200 my-4" />
                      <button
                        onClick={handleSwitchToProvider}
                        className="w-full flex items-center gap-3 px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <RefreshCw className="h-5 w-5" />
                        <div className="text-left">
                          <p className="font-semibold">Switch to Provider</p>
                          <p className="text-xs text-gray-500">
                            Offer your services
                          </p>
                        </div>
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-200 my-4" />

                  <Link
                    href={
                      profile?.user_type === "provider"
                        ? "/provider/account"
                        : "/customer/account"
                    }
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Account Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              )}

              {/* Auth buttons (if not logged in) */}
              {!user && (
                <>
                  <div className="border-t border-gray-200 my-4" />
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
