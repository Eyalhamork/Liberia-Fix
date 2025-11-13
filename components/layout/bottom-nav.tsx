"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  MessageSquare,
  User,
  Calendar,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/providers/auth-provider";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  activePattern: RegExp;
}

const customerNavItems: NavItem[] = [
  {
    icon: Search,
    label: "Browse",
    href: "/search",
    activePattern: /^\/(search|service)/,
  },
  {
    icon: Calendar,
    label: "Bookings",
    href: "/customer/bookings",
    activePattern: /^\/customer\/bookings/,
  },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/customer/messages",
    activePattern: /^\/customer\/messages/,
  },
  {
    icon: User,
    label: "Account",
    href: "/customer/profile",
    activePattern: /^\/customer\/(profile|settings)/,
  },
];

const providerNavItems: NavItem[] = [
  {
    icon: Home,
    label: "Jobs",
    href: "/provider/dashboard",
    activePattern: /^\/provider\/(dashboard|jobs)/,
  },
  {
    icon: MessageSquare,
    label: "Chats",
    href: "/provider/messages",
    activePattern: /^\/provider\/messages/,
  },
  {
    icon: BarChart3,
    label: "Stats",
    href: "/provider/analytics",
    activePattern: /^\/provider\/(analytics|stats)/,
  },
  {
    icon: User,
    label: "Profile",
    href: "/provider/profile",
    activePattern: /^\/provider\/(profile|settings)/,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isProvider, isCustomer } = useAuth();

  // Don't show bottom nav on certain pages
  const hideBottomNav =
    pathname?.startsWith("/welcome") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/onboarding");

  if (hideBottomNav) return null;

  // Determine which nav items to show based on user type
  const navItems = isProvider ? providerNavItems : customerNavItems;

  const handleNavigation = (href: string) => {
    // Add haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
    router.push(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname || "");
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className="relative flex flex-col items-center justify-center flex-1 h-full touch-feedback no-select"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActiveIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with scale animation */}
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`}
                />

                {/* Ripple container */}
                <div className="absolute inset-0 -m-2 rounded-full overflow-hidden">
                  {/* Ripple effect will be added here by tap */}
                </div>
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs mt-1 font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
