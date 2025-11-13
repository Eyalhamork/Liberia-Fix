// components/admin/header.tsx
"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminHeaderProps {
  user: {
    full_name: string | null;
    email: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:pl-64">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile menu button + Search */}
        <div className="flex items-center flex-1">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden sm:block w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search users, providers, bookings..."
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.full_name || "Admin"}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-orange-600">
                {(user.full_name || user.email)[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
