// components/admin/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Star,
  FileText,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Providers",
    href: "/admin/providers",
    icon: Briefcase,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: DollarSign,
  },
  {
    name: "Verification",
    href: "/admin/verifications",
    icon: FileText,
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    name: "Service Requests",
    href: "/admin/service-requests",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  // 💡 TO ADD NEW PAGE:
  // 1. Import the icon from lucide-react
  // 2. Add object here with name, href, and icon
  // Example:
  // {
  //   name: "Settings",
  //   href: "/admin/settings",
  //   icon: Settings,
  // },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-purple-700 pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <Shield className="h-8 w-8 text-white" />
          <span className="ml-3 text-xl font-bold text-white">Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-100 hover:bg-blue-500/50 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive
                      ? "text-blue-600"
                      : "text-blue-200 group-hover:text-white"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 mt-4 pt-4 border-t border-blue-500/30">
          <Link
            href="/customer/dashboard"
            className="flex items-center text-sm text-blue-100 hover:text-white transition-colors"
          >
            <span>← Back to Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
