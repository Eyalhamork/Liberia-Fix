"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/admin/data-table";
import StatsCard from "@/components/admin/stats-card";
import { Users, UserCheck, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const supabase = createClient();
      const { data } = await (supabase as any)
      .from("profiles")
        .select("*")
        .eq("is_admin", false)
        .order("created_at", { ascending: false });

      setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Calculate stats
  const totalUsers = users.length;
  const customers = users.filter((u) => u.user_type === "customer").length;
  const providers = users.filter((u) => u.user_type === "provider").length;

  // Define columns
  const columns = [
    {
      header: "User",
      accessor: (user: any) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {(user.full_name || user.email || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.full_name || "No name"}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (user: any) => (
        <Badge
          variant={user.user_type === "provider" ? "default" : "secondary"}
        >
          {user.user_type}
        </Badge>
      ),
    },
    {
      header: "Phone",
      accessor: (user: any) => (
        <span className="text-sm text-gray-900">
          {user.phone_number || "N/A"}
        </span>
      ),
    },
    {
      header: "Location",
      accessor: (user: any) => (
        <span className="text-sm text-gray-600">{user.location || "N/A"}</span>
      ),
    },
    {
      header: "Joined",
      accessor: (user: any) => (
        <span className="text-sm text-gray-500">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (user: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="mt-2 text-gray-600">Manage all customers and providers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatsCard title="Total Users" value={totalUsers} icon={Users} />
        <StatsCard title="Customers" value={customers} icon={UserCheck} />
        <StatsCard title="Providers" value={providers} icon={UserPlus} />
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by name, email, phone..."
        onExport={() => {
          console.log("Export users");
        }}
      />
    </div>
  );
}
